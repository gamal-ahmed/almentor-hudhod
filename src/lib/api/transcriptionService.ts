import { TranscriptionModel } from "@/components/ModelSelector";
import { API_ENDPOINTS, SUPABASE_KEY, convertChunksToVTT, convertTextToVTT } from "./utils";
import { useLogsStore } from "@/lib/useLogsStore";
import { supabase } from "@/integrations/supabase/client";

const getLogsStore = () => useLogsStore.getState();

// Creates a transcription job and returns the job ID
export async function createTranscriptionJob(file: File, model: TranscriptionModel, prompt = "Please preserve all English words exactly as spoken") {
  const addLog = getLogsStore().addLog;
  const startTimedLog = getLogsStore().startTimedLog;
  
  const logOperation = startTimedLog(`Creating transcription job with ${model}`, "info", model);
  
  try {
    // Validate the file
    if (!file || !file.name || !file.size || !file.type) {
      throw new Error("Invalid file object. File is missing required properties.");
    }
    
    addLog(`File validation passed: ${file.name}, size: ${file.size} bytes, type: ${file.type}`, "info", {
      source: model,
      details: `Creating transcription job with ${model}`
    });
    
    // First upload the file to temporary storage
    const fileName = `temp/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    addLog(`Uploading file for ${model} transcription job`, "info", {
      source: model,
      details: `File: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`
    });
    
    // Create job record in the database first - using the actual table, not the view
    const { data: jobData, error: jobError } = await supabase
      .from('transcriptions')
      .insert({
        model: model as string, // Cast model to string
        file_path: fileName,
        status: 'pending'
      })
      .select()
      .single();
    
    if (jobError) {
      throw new Error(`Failed to create transcription job: ${jobError.message}`);
    }
    
    // Now update the status message in a separate query
    await supabase
      .from('transcriptions')
      .update({
        error: null // Clear any previous errors
      })
      .eq('id', jobData.id);
    
    // Prepare FormData for the transcription request
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('prompt', prompt);
    formData.append('jobId', jobData.id);
    
    // Start the transcription process on the server (doesn't wait for completion)
    const response = await fetch(`${API_ENDPOINTS.TRANSCRIPTION_SERVICE}/start-job`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      let errorMessage = `Failed to start transcription job: ${response.status}`;
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
    
    addLog(`Transcription job created with ${model}`, "success", {
      source: model,
      details: `Job ID: ${jobData.id}`
    });
    
    logOperation.complete(`Created transcription job`, `Job ID: ${jobData.id}`);
    
    return {
      jobId: jobData.id
    };
  } catch (error) {
    addLog(`Error creating ${model} transcription job: ${error.message}`, "error", {
      source: model,
      details: error.stack
    });
    console.error(`Error creating ${model} transcription job:`, error);
    logOperation.error(`${error.message}`, error.stack);
    throw error;
  }
}

// Check the status of a transcription job
export async function checkTranscriptionJobStatus(jobId: string) {
  try {
    const { data, error } = await supabase
      .from('transcription_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (error) {
      throw new Error(`Failed to fetch job status: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error checking transcription job status:', error);
    throw error;
  }
}

// Get all transcription jobs for the current user
export async function getUserTranscriptionJobs() {
  try {
    const { data, error } = await supabase
      .from('transcription_jobs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch user jobs: ${error.message}`);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching user transcription jobs:', error);
    throw error;
  }
}

// Legacy function that now creates a job and then periodically polls for results
export async function transcribeAudio(file: File, model: TranscriptionModel, prompt = "Please preserve all English words exactly as spoken") {
  const addLog = getLogsStore().addLog;
  const startTimedLog = getLogsStore().startTimedLog;
  
  const logOperation = startTimedLog(`Transcribing with ${model}`, "info", model);
  
  try {
    // Create a new transcription job
    const { jobId } = await createTranscriptionJob(file, model, prompt);
    
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
    
    addLog(`Successfully transcribed with ${model}`, "success", {
      source: model,
      details: `Generated ${result.vttContent.length} characters of VTT content`
    });
    
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

// Reset stuck jobs
export async function resetStuckJobs() {
  const addLog = getLogsStore().addLog;
  const startTimedLog = getLogsStore().startTimedLog;
  
  const logOperation = startTimedLog(`Resetting stuck jobs`, "info", "System");
  
  try {
    // Call the Supabase Function to reset stuck jobs
    const response = await fetch(`${API_ENDPOINTS.TRANSCRIPTION_SERVICE}/reset-stuck-jobs`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to reset stuck jobs: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    addLog(`Successfully reset ${data.updatedCount} stuck jobs`, "success", {
      source: "System",
      details: `Jobs were updated from 'pending' or 'processing' to 'failed'`
    });
    
    logOperation.complete(`Reset stuck jobs`, `${data.updatedCount} jobs updated`);
    
    return data.updatedCount;
  } catch (error) {
    addLog(`Error resetting stuck jobs: ${error.message}`, "error", {
      source: "System",
      details: error.stack
    });
    console.error('Error resetting stuck jobs:', error);
    logOperation.error(`${error.message}`, error.stack);
    throw error;
  }
}

// Save the selected transcription and update the database with the URL
export async function saveSelectedTranscription(transcriptionId: string, vttContent: string) {
  const addLog = getLogsStore().addLog;
  const startTimedLog = getLogsStore().startTimedLog;
  
  const logOperation = startTimedLog(`Saving selected transcription`, "info", "Storage");
  
  try {
    // Create a file name using the transcription ID
    const fileName = `${transcriptionId}.vtt`;
    
    // Call the Supabase Function to save the VTT content
    const response = await fetch(`${API_ENDPOINTS.TRANSCRIPTION_SERVICE}/save-transcription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        transcriptionId,
        vttContent,
        fileName
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to save transcription: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Update the transcription record with the file URL
    const { error } = await supabase
      .from('transcriptions')
      .update({
        vtt_file_url: data.fileUrl
      })
      .eq('id', transcriptionId);
    
    if (error) {
      throw new Error(`Failed to update transcription record: ${error.message}`);
    }
    
    addLog(`Successfully saved transcription as VTT file`, "success", {
      source: "Storage",
      details: `File URL: ${data.fileUrl}`
    });
    
    logOperation.complete(`Saved transcription`, `File URL: ${data.fileUrl}`);
    
    return data.fileUrl;
  } catch (error) {
    addLog(`Error saving transcription: ${error.message}`, "error", {
      source: "Storage",
      details: error.stack
    });
    console.error('Error saving transcription:', error);
    logOperation.error(`${error.message}`, error.stack);
    throw error;
  }
}

// Update the session with the selected transcription URL
export async function updateSessionTranscriptionUrl(sessionId: string, url: string) {
  try {
    const { error } = await supabase
      .from('transcription_sessions')
      .update({
        selected_transcription_url: url
      })
      .eq('id', sessionId);
    
    if (error) {
      throw new Error(`Failed to update session: ${error.message}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating session:', error);
    throw error;
  }
}
