import { TranscriptionModel } from "@/components/ModelSelector";
import { TranscriptionRecord } from "../../types/transcription";
import { baseService, getLogsStore } from "../baseService";

export async function createTranscriptionJob(
  file: File, 
  model: TranscriptionModel, 
  prompt = "Please preserve all English words exactly as spoken", 
  sessionId?: string
) {
  const addLog = getLogsStore().addLog;
  const startTimedLog = getLogsStore().startTimedLog;
  
  const logOperation = startTimedLog(`Creating transcription job with ${model}`, "info", model);
  
  try {
    // Validate file
    if (!file || !file.name || !file.size || !file.type) {
      throw new Error("Invalid file object. File is missing required properties.");
    }
    
    addLog(`File validation passed: ${file.name}, size: ${file.size} bytes, type: ${file.type}`, "info", {
      source: model,
      details: `Creating transcription job with ${model}`
    });
    
    const fileName = `temp/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    
    addLog(`Uploading file for ${model} transcription job`, "info", {
      source: model,
      details: `File: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`
    });
    
    // Create job record with prompt_text
    const insertData: TranscriptionRecord = {
      model: model as string,
      file_path: fileName,
      status: 'pending',
      prompt_text: prompt
    };
    
    if (sessionId) {
      insertData.session_id = sessionId;
    }
    
    const { data: jobData, error: jobError } = await baseService.supabase
      .from('transcriptions')
      .insert(insertData)
      .select()
      .single();
    
    if (jobError) {
      throw new Error(`Failed to create transcription job: ${jobError.message}`);
    }
    
    // Now update the status message in a separate query
    await baseService.supabase
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
    if (sessionId) {
      formData.append('sessionId', sessionId);
    }
    
    // Get authorization token using the baseService's createAuthorizedRequest method
    const { data: sessionData } = await baseService.supabase.auth.getSession();
    const authToken = sessionData.session?.access_token || baseService.supabaseKey;
    
    // Start the transcription process on the server (doesn't wait for completion)
    const response = await fetch(
      `${baseService.apiEndpoints.TRANSCRIPTION_SERVICE}/start-job`, 
      {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'apikey': baseService.supabaseKey
        }
      }
    );
    
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
