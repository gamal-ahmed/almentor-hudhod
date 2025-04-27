
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.4.0";
import { corsHeaders } from "./utils/cors.ts";
import { handleStartJob, handleJobStatus, handleResetStuckJobs } from "./handlers/jobHandlers.ts";
import { handleDownloadAudio } from "./handlers/audioHandlers.ts";

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? '';
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  const url = new URL(req.url);
  const endpoint = url.pathname.split('/').pop();

  try {
    console.log(`Received request for endpoint: ${endpoint}`);
    
    // Add CORS headers to all responses
    const headers = { ...corsHeaders, "Content-Type": "application/json" };
    
    switch(endpoint) {
      case 'start-job':
        return await handleStartJob(req, headers);
      case 'job-status':
        return await handleJobStatus(req, headers, supabase);
      case 'reset-stuck-jobs':
        return await handleResetStuckJobs(req, headers, supabase);
      case 'download-audio':
        return await handleDownloadAudio(req, headers);
      default:
        return new Response(
          JSON.stringify({ error: "Invalid endpoint" }),
          {
            status: 400,
            headers
          }
        );
    }
  } catch (error) {
    console.error(`Error handling request to ${endpoint}:`, error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
