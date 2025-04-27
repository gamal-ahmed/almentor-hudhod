
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.4.0";
import { corsHeaders } from "../utils/cors.ts";
import { updateJobStatus } from "../utils/jobUtils.ts";
import { processTranscription } from "../services/transcriptionProcessor.ts";

// Handle starting a new transcription job
export async function handleStartJob(req: Request, headers: HeadersInit) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio");
    const prompt = formData.get("prompt") || "Please preserve all English words exactly as spoken";
    const jobId = formData.get("jobId");
    const sessionId = formData.get("sessionId");

    if (!audioFile || !(audioFile instanceof File)) {
      throw new Error("No audio file provided or invalid file");
    }

    if (!jobId) {
      throw new Error("No job ID provided");
    }

    console.log(`Processing job ${jobId}: file: ${audioFile.name}, size: ${audioFile.size} bytes`);
    
    if (sessionId) {
      console.log(`Job ${jobId} is associated with session ${sessionId}`);
    }

    // Update job status
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
        headers
      }
    );
  } catch (error) {
    console.error("Error starting transcription job:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers
      }
    );
  }
}

// Handle checking job status
export async function handleJobStatus(req: Request, headers: HeadersInit, supabase: any) {
  try {
    const url = new URL(req.url);
    const jobId = url.searchParams.get('jobId');

    if (!jobId) {
      throw new Error("No job ID provided");
    }

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
        headers
      }
    );
  } catch (error) {
    console.error("Error checking job status:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers
      }
    );
  }
}

// Handle resetting stuck jobs
export async function handleResetStuckJobs(req: Request, headers: HeadersInit, supabase: any) {
  try {
    console.log("Resetting all stuck transcription jobs");
    
    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);
    
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
        headers
      }
    );
  } catch (error) {
    console.error("Error resetting stuck jobs:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers
      }
    );
  }
}

