
import { TranscriptionModel } from "@/components/ModelSelector";
import { getLogsStore } from "../baseService";
import { createTranscriptionJob } from "./jobCreation";
import { checkTranscriptionJobStatus } from "./jobStatus";

// Legacy function that now creates a job and then periodically polls for results
export async function transcribeAudio(
  file: File, 
  model: TranscriptionModel, 
  prompt = "Please preserve all English words exactly as spoken", 
  sessionId?: string
) {
  const addLog = getLogsStore().addLog;
  const startTimedLog = getLogsStore().startTimedLog;
  
  const logOperation = startTimedLog(`Transcribing with ${model}`, "info", model);
  
  try {
    // Create a new transcription job with the optional sessionId
    const { jobId } = await createTranscriptionJob(file, model, prompt, sessionId);
    
    addLog(`Waiting for ${model} transcription job to complete`, "info", {
      source: model,
      details: `Job ID: ${jobId}`
    });
    
    // Poll for job completion
    let result = null;
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes (10 second intervals)
    const pollInterval = 10000; // 10 seconds
    
    while (attempts < maxAttempts) {
      const job = await checkTranscriptionJobStatus(jobId);
      
      if (job.status === 'completed') {
        result = job.result;
        break;
      } else if (job.status === 'failed') {
        throw new Error(`Transcription job failed: ${job.error}`);
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;
    }
    
    if (!result) {
      throw new Error(`Transcription job timed out after ${maxAttempts * pollInterval / 1000} seconds`);
    }
    
    logOperation.complete(`Completed ${model} transcription`, `Generated ${result.vttContent.length} characters of VTT content`);
    
    return {
      vttContent: result.vttContent,
      prompt
    };
  } catch (error) {
    addLog(`Error in ${model} transcription: ${error.message}`, "error", {
      source: model,
      details: error.stack
    });
    console.error(`Error in ${model} transcription:`, error);
    logOperation.error(`${error.message}`, error.stack);
    throw error;
  }
}
