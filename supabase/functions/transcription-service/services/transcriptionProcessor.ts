
import { updateJobStatus } from "../utils/jobUtils.ts";

// Process transcription in the background
export async function processTranscription(jobId: string, audioFile: File, prompt: string, sessionId?: string) {
  try {
    console.log(`Starting background transcription for job ${jobId}`);
    
    if (sessionId) {
      console.log(`This job is associated with session ${sessionId}`);
    }
    
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
    
    formData.append('audio', blob, audioFile.name);
    formData.append('prompt', prompt);
    
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
      await supabase
        .from('transcriptions')
        .update({ session_id: sessionId })
        .eq('id', jobId);
      
      console.log(`Updated job ${jobId} with session_id ${sessionId}`);
    }
    
    // Update job with success and store prompt in result
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
