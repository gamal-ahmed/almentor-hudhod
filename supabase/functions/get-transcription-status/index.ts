
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract job ID from URL or request body
    let jobId: string;
    const url = new URL(req.url);
    
    if (url.pathname.includes('/')) {
      // Extract job ID from URL path
      const pathParts = url.pathname.split('/');
      jobId = pathParts[pathParts.length - 1];
    } else {
      // Extract job ID from request body
      const { id } = await req.json();
      jobId = id;
    }

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'Job ID is required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://xbwnjfdzbnyvaxmqufrw.supabase.co';
    const supabaseKey = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user session - use getUser() to validate the JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Authentication error:", userError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: userError.message }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Query the job status
    const { data: job, error: jobError } = await supabase
      .from('transcription_jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();

    if (jobError) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch job: ${jobError.message}` }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!job) {
      return new Response(
        JSON.stringify({ error: `Job not found with ID: ${jobId}` }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // If user_id is set, verify that the current user owns the job
    if (job.user_id && job.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to access this job' }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Return the job status with all necessary information
    return new Response(
      JSON.stringify({
        status: job.status,
        status_message: job.status_message || job.status,
        error: job.error,
        result: job.result,
        file_name: job.file_name,
        created_at: job.created_at,
        updated_at: job.updated_at,
        model: job.model
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in get-transcription-status function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
