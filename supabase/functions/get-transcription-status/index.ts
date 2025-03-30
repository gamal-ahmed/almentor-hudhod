
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
    // Get the job ID from the URL
    const url = new URL(req.url);
    const jobId = url.pathname.split('/').pop();
    
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

    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("No Authorization header provided");
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

    // Initialize Supabase client with the token
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://xbwnjfdzbnyvaxmqufrw.supabase.co';
    const supabaseKey = authHeader.replace('Bearer ', '');
    
    // Create client with the JWT token from the request
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the JWT token and get user data
    try {
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
        console.error("User not found in token");
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

      console.log(`Authenticated user: ${user.id}, ${user.email} requesting job: ${jobId}`);

      // Get the job data
      const { data: job, error: jobError } = await supabase
        .from('transcription_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', user.id)  // Only allow users to see their own jobs
        .single();

      if (jobError) {
        console.error("Error fetching job:", jobError);
        return new Response(
          JSON.stringify({ error: 'Failed to retrieve job', details: jobError.message }),
          {
            status: 404,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (!job) {
        return new Response(
          JSON.stringify({ error: 'Job not found' }),
          {
            status: 404,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      console.log(`Found job: ${job.id}, status: ${job.status}`);

      // Return job information
      return new Response(
        JSON.stringify(job),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (authError) {
      console.error("Authentication error:", authError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: authError.message }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
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
