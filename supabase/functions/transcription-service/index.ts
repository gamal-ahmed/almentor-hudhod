
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

  try {
    console.log(`Received request for endpoint: ${endpoint}`);
    
    if (endpoint === 'start-job') {
      return await handleStartJob(req);
    } else if (endpoint === 'job-status') {
      return await handleJobStatus(req);
    } else if (endpoint === 'reset-stuck-jobs') {
      return await handleResetStuckJobs(req);
    } else if (endpoint === 'download-audio') {
      return await handleDownloadAudio(req);
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid endpoint" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error(`Error handling request to ${endpoint}:`, error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Handle downloading audio from URL
async function handleDownloadAudio(req: Request) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      throw new Error("No URL provided");
    }
    
    console.log(`Downloading audio from URL: ${url}`);
    
    // Extract filename from URL
    let filename = 'audio.mp3';
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const lastPathPart = pathParts[pathParts.length - 1];
      
      if (lastPathPart && (lastPathPart.endsWith('.mp3') || lastPathPart.endsWith('.wav') || lastPathPart.endsWith('.m4a'))) {
        filename = lastPathPart;
      }
    } catch (e) {
      console.warn('Could not parse URL for filename, using default');
    }
    
    // Handle different URL types
    let finalUrl = url;
    
    // Handle Dropbox URLs
    if (url.includes('dropbox.com')) {
      // Convert dropbox.com/s/ links to direct download links
      finalUrl = url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
      if (!finalUrl.includes('dl=0') && !finalUrl.includes('dl=1')) {
        finalUrl += '?dl=1';
      } else {
        finalUrl = finalUrl.replace('dl=0', 'dl=1');
      }
    }
    
    // Handle Google Drive URLs
    if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.match(/\/d\/(.+?)\/|\/d\/(.+)$/);
      if (fileId && (fileId[1] || fileId[2])) {
        const driveId = fileId[1] || fileId[2];
        finalUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
      }
    }
    
    console.log(`Fetching audio from adjusted URL: ${finalUrl}`);
    
    const response = await fetch(finalUrl, {
      headers: {
        // Some sites block requests without a user agent
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download audio from URL: ${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('audio/') && !contentType.includes('video/') && !contentType.includes('application/octet-stream')) {
      console.warn(`Unexpected content type: ${contentType} for URL: ${finalUrl}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    //console.log(`Successfully downloaded audio: ${arrayBuffer.byteLength} bytes`);
    
    return new Response(
      arrayBuffer,
      {
        headers: {
          ...corsHeaders,
          'Content-Type': contentType || 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      }
    );
  } catch (error) {
    console.error("Error downloading audio from URL:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}

// Handle starting a new transcription job
async function handleStartJob(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio");
    const prompt = formData.get("prompt") || "Please preserve all English words exactly as spoken";
    const jobId = formData.get("jobId");
    const sessionId = formData.get("sessionId");

    // Check if required data is provided
    if (!audioFile || !(audioFile instanceof File)) {
      throw new Error("No audio file provided or invalid file");
    }

    if (!jobId) {
      throw new Error("No job ID provided");
    }

    console.log(`Processing job ${jobId}: file: ${audioFile.name}, size: ${audioFile.size} bytes`);
    
    // Add logging for sessionId
    if (sessionId) {
      console.log(`Job ${jobId} is associated with session ${sessionId}`);
    }

    // Update job status - use the base table instead of the view
    await updateJobStatus(jobId.toString(), 'processing', 'Transcription in progress');

    // Process transcription in the background
    EdgeRuntime.waitUntil(processTranscription(jobId.toString(), audioFile, prompt.toString(), sessionId?.toString()));

    return new Response(
      JSON.stringify({ 
        message: "Transcription job started",
        jobId,
        sessionId: sessionId || null
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

    // Get job from database using the transcription_jobs view
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

// Handle resetting stuck jobs
async function handleResetStuckJobs(req: Request) {
  try {
    console.log("Resetting all stuck transcription jobs");
    
    // Get current time minus 30 minutes
    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);
    
    // Update all jobs that are stuck in pending or processing for more than 30 minutes
    const { data: updatedJobs, error } = await supabase
      .from('transcriptions')
      .update({
        status: 'failed',
        error: 'Job was stuck and automatically reset by the system',
        updated_at: new Date().toISOString()
      })
      .in('status', ['pending', 'processing'])
      .lt('updated_at', thirtyMinutesAgo.toISOString())
      .select('id');
    
    if (error) {
      throw new Error(`Failed to reset stuck jobs: ${error.message}`);
    }
    
    const updatedCount = updatedJobs?.length || 0;
    console.log(`Reset ${updatedCount} stuck jobs`);
    
    return new Response(
      JSON.stringify({ 
        message: "Successfully reset stuck jobs",
        updatedCount 
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error resetting stuck jobs:", error);
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
    updated_at: new Date().toISOString()
  };

  if (error) {
    updateData.error = error;
  }

  if (result) {
    updateData.result = result;
  }

  try {
    // Update the transcriptions table directly - avoid using the view
    const { error: updateError } = await supabase
      .from('transcriptions')
      .update(updateData)
      .eq('id', jobId);

    if (updateError) {
      console.error(`Error updating job ${jobId} status:`, updateError);
      throw new Error(`Failed to update job status: ${updateError.message}`);
    }

    console.log(`Updated job ${jobId} status to ${status}: ${statusMessage}`);
  } catch (error) {
    console.error(`Error in updateJobStatus for job ${jobId}:`, error);
    throw error;
  }
}

// Process transcription in the background
async function processTranscription(jobId: string, audioFile: File, prompt: string, sessionId?: string) {
  try {
    console.log(`Starting background transcription for job ${jobId}`);
    
    if (sessionId) {
      console.log(`This job is associated with session ${sessionId}`);
    }
    
    // Get job information from database - use the view for reading
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
        apiUrl = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/openai-transcribe';
        break;
      case 'gemini-2.0-flash':
        apiUrl = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/gemini-transcribe';
        break;
      case 'phi4':
        apiUrl = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/phi4-transcribe';
        break;
      default:
        apiUrl = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/openai-transcribe';
    }
    
    // Convert audio to buffer for processing
    const audioBuffer = await audioFile.arrayBuffer();
    
    // Create a FormData for API call
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: audioFile.type });
    
    // Common parameters for all models
    formData.append('audio', blob, audioFile.name);
    formData.append('prompt', prompt);
    
    // Include sessionId if it exists
    if (sessionId) {
      formData.append('sessionId', sessionId);
    }
    
    // Update job status
    await updateJobStatus(jobId, 'processing', `Sending request to ${job.model} API`);
    
    // Call the API
    console.log(`Calling ${apiUrl} for job ${jobId}`);
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'apikey': Deno.env.get("SUPABASE_ANON_KEY") || '',
        'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      let errorMessage = `Transcription API error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage += ` - ${errorData.error || JSON.stringify(errorData)}`;
      } catch (e) {
        const errorText = await response.text();
        errorMessage += ` - ${errorText || 'Unknown error'}`;
      }
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    if (!data || !data.vttContent) {
      throw new Error(`Invalid response from transcription API: ${JSON.stringify(data)}`);
    }
    
    console.log(`Received response from ${job.model} API for job ${jobId}`);
    
    // If we have a sessionId, make sure it's stored with the job
    if (sessionId) {
      // Ensure the session_id is properly set in the database
      await supabase
        .from('transcriptions')
        .update({ session_id: sessionId })
        .eq('id', jobId);
      
      console.log(`Updated job ${jobId} with session_id ${sessionId}`);
    }
    
    // Update job with success
    await updateJobStatus(
      jobId, 
      'completed', 
      `Successfully transcribed with ${job.model}`,
      undefined,
      { 
        vttContent: data.vttContent, 
        text: data.text || "",
        prompt
      }
    );
    
    console.log(`Completed transcription job ${jobId}`);
  } catch (error) {
    console.error(`Error processing transcription job ${jobId}:`, error);
    
    // Update job with error
    try {
      await updateJobStatus(
        jobId,
        'failed',
        `Transcription failed: ${error.message}`,
        error.stack || error.message
      );
    } catch (updateError) {
      console.error(`Failed to update job ${jobId} with error status:`, updateError);
    }
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
