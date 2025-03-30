
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Supabase credentials - always use service role for background processes
const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://xbwnjfdzbnyvaxmqufrw.supabase.co';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'); 

// API endpoints for transcription services
const TRANSCRIPTION_ENDPOINTS = {
  'openai': 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/openai-transcribe',
  'gemini-2.0-flash': 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/gemini-transcribe',
  'phi4': 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/phi4-transcribe'
};

// Check for any in-progress job that's been stuck for more than 10 minutes
async function resetStuckJobs(supabase) {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  
  const { data, error } = await supabase
    .from('transcriptions')
    .update({ 
      status: 'pending',
      error: 'Previous processing attempt timed out'
    })
    .match({ status: 'processing' })
    .lt('updated_at', tenMinutesAgo)
    .select();
  
  if (error) {
    console.error('Error resetting stuck jobs:', error);
  } else if (data && data.length > 0) {
    console.log(`Reset ${data.length} stuck jobs to pending status`);
  }
}

// Process the next pending transcription job
async function processNextJob(supabase) {
  // First check if there's a job in progress
  const { data: processingJobs } = await supabase
    .from('transcriptions')
    .select('id')
    .eq('status', 'processing')
    .limit(1);
  
  if (processingJobs && processingJobs.length > 0) {
    console.log('A job is already being processed. Skipping this run.');
    return { success: true, message: 'Skipped - job already in progress' };
  }
  
  // Find the oldest pending job
  const { data: pendingJobs, error: queryError } = await supabase
    .from('transcriptions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1);
  
  if (queryError) {
    console.error('Error querying for pending jobs:', queryError);
    return { success: false, error: queryError.message };
  }
  
  if (!pendingJobs || pendingJobs.length === 0) {
    console.log('No pending jobs found');
    return { success: true, message: 'No pending jobs' };
  }
  
  // Get the job to process
  const job = pendingJobs[0];
  console.log(`Processing job ${job.id} for model ${job.model}`);
  
  try {
    // Update job status to processing
    const { error: updateError } = await supabase
      .from('transcriptions')
      .update({ status: 'processing' })
      .eq('id', job.id);
    
    if (updateError) {
      throw new Error(`Failed to update job status: ${updateError.message}`);
    }
    
    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('transcription-files')
      .download(job.file_path);
    
    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message || 'File not found'}`);
    }
    
    // Create a File object from the downloaded data
    const fileName = job.file_path.split('/').pop() || 'audio.mp3';
    const audioFile = new File([fileData], fileName, { type: 'audio/mpeg' });
    
    // Determine which transcription service to use
    const endpoint = TRANSCRIPTION_ENDPOINTS[job.model];
    if (!endpoint) {
      throw new Error(`Unknown transcription model: ${job.model}`);
    }
    
    // Prepare form data
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('prompt', 'Please preserve all English words exactly as spoken');
    
    // Call the appropriate transcription service
    console.log(`Calling transcription service: ${job.model}`);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Transcription service error (${response.status}): ${errorText}`);
    }
    
    const result = await response.json();
    
    // Update the job with the result
    const { error: resultUpdateError } = await supabase
      .from('transcriptions')
      .update({
        status: 'completed',
        result: result,
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);
    
    if (resultUpdateError) {
      throw new Error(`Failed to update job with result: ${resultUpdateError.message}`);
    }
    
    console.log(`Successfully completed transcription job ${job.id}`);
    return { success: true, jobId: job.id };
  } catch (error) {
    console.error(`Error processing job ${job.id}:`, error);
    
    // Update job status to failed
    const { error: failureUpdateError } = await supabase
      .from('transcriptions')
      .update({
        status: 'failed',
        error: error.message,
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id);
    
    if (failureUpdateError) {
      console.error(`Failed to update job failure status: ${failureUpdateError.message}`);
    }
    
    return { success: false, error: error.message, jobId: job.id };
  }
}

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
    }
    
    // Initialize Supabase client with service role for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('Transcription worker started');
    
    // Reset any stuck jobs
    await resetStuckJobs(supabase);
    
    // Process the next job
    const result = await processNextJob(supabase);
    
    console.log('Transcription worker completed:', result);
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Worker error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
