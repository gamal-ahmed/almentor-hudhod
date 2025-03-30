
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.4.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? '';
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const endpoint = url.pathname.split('/').pop();

  if (endpoint === 'start-job') {
    return await handleStartJob(req);
  } else if (endpoint === 'job-status') {
    return await handleJobStatus(req);
  } else {
    return new Response(
      JSON.stringify({ error: "Invalid endpoint" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Handle starting a new transcription job
async function handleStartJob(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio");
    const prompt = formData.get("prompt") || "Please preserve all English words exactly as spoken";
    const jobId = formData.get("jobId");

    // Check if required data is provided
    if (!audioFile || !(audioFile instanceof File)) {
      throw new Error("No audio file provided or invalid file");
    }

    if (!jobId) {
      throw new Error("No job ID provided");
    }

    console.log(`Processing job ${jobId}: file: ${audioFile.name}, size: ${audioFile.size} bytes`);

    // Update job status
    await updateJobStatus(jobId.toString(), 'processing', 'Transcription in progress');

    // Process transcription in the background
    EdgeRuntime.waitUntil(processTranscription(jobId.toString(), audioFile, prompt.toString()));

    return new Response(
      JSON.stringify({ 
        message: "Transcription job started",
        jobId
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error starting transcription job:", error);
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
}

// Handle checking job status
async function handleJobStatus(req: Request) {
  try {
    const url = new URL(req.url);
    const jobId = url.searchParams.get('jobId');

    if (!jobId) {
      throw new Error("No job ID provided");
    }

    // Get job from database
    const { data: job, error } = await supabase
      .from('transcription_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error) {
      throw new Error(`Failed to fetch job: ${error.message}`);
    }

    return new Response(
      JSON.stringify(job),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error checking job status:", error);
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
}

// Update job status in the database
async function updateJobStatus(
  jobId: string, 
  status: 'pending' | 'processing' | 'completed' | 'failed',
  statusMessage: string, 
  error?: string,
  result?: any
) {
  const updateData: any = {
    status,
    status_message: statusMessage,
    updated_at: new Date().toISOString()
  };

  if (error) {
    updateData.error = error;
  }

  if (result) {
    updateData.result = result;
  }

  const { error: updateError } = await supabase
    .from('transcription_jobs')
    .update(updateData)
    .eq('id', jobId);

  if (updateError) {
    console.error(`Error updating job ${jobId} status:`, updateError);
    throw new Error(`Failed to update job status: ${updateError.message}`);
  }

  console.log(`Updated job ${jobId} status to ${status}: ${statusMessage}`);
}

// Process transcription in the background
async function processTranscription(jobId: string, audioFile: File, prompt: string) {
  try {
    console.log(`Starting background transcription for job ${jobId}`);
    
    // Get job information from database
    const { data: job, error: jobError } = await supabase
      .from('transcription_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (jobError) {
      throw new Error(`Failed to fetch job: ${jobError.message}`);
    }
    
    // Determine which API to use based on the model
    let apiUrl = '';
    switch (job.model) {
      case 'openai':
        apiUrl = 'https://api.openai.com/v1/audio/transcriptions';
        break;
      case 'gemini-2.0-flash':
        // Use internal endpoint for now (would need to implement proper Gemini API call)
        apiUrl = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/gemini-transcribe';
        break;
      case 'phi4':
        // Use internal endpoint for now (would need to implement proper Phi4 API call)
        apiUrl = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/phi4-transcribe';
        break;
      default:
        apiUrl = 'https://api.openai.com/v1/audio/transcriptions';
    }
    
    // Convert audio to buffer for processing
    const audioBuffer = await audioFile.arrayBuffer();
    
    // Create a FormData for API call
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: audioFile.type });
    
    if (job.model === 'openai') {
      // OpenAI-specific parameters
      formData.append('file', blob, audioFile.name);
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');
      if (prompt) {
        formData.append('prompt', prompt);
      }
    } else {
      // For other models we use our existing Edge Functions
      formData.append('audio', blob, audioFile.name);
      formData.append('prompt', prompt);
    }
    
    // Update job status
    await updateJobStatus(jobId, 'processing', `Sending request to ${job.model} API`);
    
    // Additional headers for OpenAI
    const headers: Record<string, string> = {};
    if (job.model === 'openai') {
      headers['Authorization'] = `Bearer ${Deno.env.get("OPENAI_API_KEY")}`;
    } else {
      // For our Edge Functions
      headers['apikey'] = Deno.env.get("SUPABASE_ANON_KEY") || '';
      headers['Authorization'] = `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`;
    }
    
    // Call the API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Transcription API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Process the response based on model
    let vttContent = '';
    
    if (job.model === 'openai') {
      // Handle OpenAI response
      if (data.segments && data.segments.length > 0) {
        vttContent = "WEBVTT\n\n";
        data.segments.forEach((segment: any) => {
          const startTime = formatVTTTime(segment.start);
          const endTime = formatVTTTime(segment.end);
          vttContent += `${startTime} --> ${endTime}\n${segment.text.trim()}\n\n`;
        });
      } else {
        // Fallback to plain text if no segments
        vttContent = convertTextToVTT(data.text);
      }
    } else {
      // Our Edge Functions return vttContent directly
      vttContent = data.vttContent;
    }
    
    // Update job with success
    await updateJobStatus(
      jobId, 
      'completed', 
      `Successfully transcribed with ${job.model}`,
      undefined,
      { 
        vttContent, 
        text: data.text || "",
        prompt
      }
    );
    
    console.log(`Completed transcription job ${jobId}`);
  } catch (error) {
    console.error(`Error processing transcription job ${jobId}:`, error);
    
    // Update job with error
    await updateJobStatus(
      jobId,
      'failed',
      `Transcription failed: ${error.message}`,
      error.stack || error.message
    );
  }
}

// Helper function to format time for VTT
function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}

// Helper function to convert text to VTT format
function convertTextToVTT(text: string): string {
  let vttContent = 'WEBVTT\n\n';
  
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  sentences.forEach((sentence: string, index: number) => {
    const startTime = formatVTTTime(index * 5);
    const endTime = formatVTTTime((index + 1) * 5);
    vttContent += `${startTime} --> ${endTime}\n${sentence.trim()}\n\n`;
  });
  
  return vttContent;
}
