
import { TranscriptionModel } from "@/components/ModelSelector";
import { API_ENDPOINTS, SUPABASE_KEY, convertChunksToVTT, convertTextToVTT } from "./utils";
import { useLogsStore } from "@/lib/useLogsStore";
import { supabase } from "@/integrations/supabase/client";

const getLogsStore = () => useLogsStore.getState();

// Queue a transcription job in the async system
export async function queueTranscription(file: File, model: TranscriptionModel) {
  const addLog = getLogsStore().addLog;
  const startTimedLog = getLogsStore().startTimedLog;
  
  const logOperation = startTimedLog(`Queueing transcription with ${model}`, "info", model);
  
  try {
    addLog(`Starting async transcription with ${model} model`, "info", {
      source: model,
      details: `File: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`
    });
    
    // Prepare FormData
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('model', model);
    formData.append('fileName', file.name);
    
    addLog(`Sending request to queue-transcription endpoint`, "info", { 
      source: model,
      details: `File size: ${file.size} bytes`
    });
    
    const response = await fetch(`${API_ENDPOINTS.QUEUE_TRANSCRIPTION}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: formData,
    });
    
    addLog(`Received response from queue-transcription endpoint`, "info", {
      source: model,
      details: `Status: ${response.status} ${response.statusText}`
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      addLog(`Error response from queue-transcription`, "error", {
        source: model,
        details: `Status: ${response.status}, Response: ${errorText}`
      });
      logOperation.error(`Failed with status ${response.status}`, errorText);
      throw new Error(`Failed to queue transcription: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    addLog(`Successfully queued transcription job`, "success", {
      source: model,
      details: `Job ID: ${data.jobId}`
    });
    
    logOperation.complete(`Completed queueing ${model} transcription`, `Job ID: ${data.jobId}`);
    
    return {
      jobId: data.jobId,
      status: data.status,
      message: data.message
    };
  } catch (error) {
    addLog(`Error in queueing ${model} transcription: ${error.message}`, "error", {
      source: model,
      details: error.stack
    });
    console.error(`Error in queueing ${model} transcription:`, error);
    logOperation.error(`${error.message}`, error.stack);
    throw error;
  }
}

// Get the status of a transcription job
export async function getTranscriptionStatus(jobId: string) {
  const addLog = getLogsStore().addLog;
  
  try {
    addLog(`Checking status of transcription job: ${jobId}`, "info", {
      source: "TranscriptionService",
      details: `Job ID: ${jobId}`
    });
    
    const response = await fetch(`${API_ENDPOINTS.GET_TRANSCRIPTION_STATUS}/${jobId}`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      addLog(`Error checking transcription job status`, "error", {
        source: "TranscriptionService",
        details: `Status: ${response.status}, Response: ${errorText}`
      });
      throw new Error(`Failed to check transcription status: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    addLog(`Retrieved transcription job status: ${data.status}`, "info", {
      source: "TranscriptionService",
      details: `Job ID: ${jobId}, Status: ${data.status}`
    });
    
    return {
      status: data.status,
      status_message: data.status_message,
      error: data.error,
      result: data.result,
      file_name: data.file_name,
      created_at: data.created_at,
      updated_at: data.updated_at,
      model: data.model
    };
  } catch (error) {
    addLog(`Error checking transcription status: ${error.message}`, "error", {
      source: "TranscriptionService",
      details: error.stack
    });
    console.error(`Error checking transcription status:`, error);
    throw error;
  }
}

// Backward compatibility with the older direct transcription method
export async function transcribeAudio(file: File, model: TranscriptionModel, prompt = "Please preserve all English words exactly as spoken") {
  const addLog = getLogsStore().addLog;
  const startTimedLog = getLogsStore().startTimedLog;
  
  const logOperation = startTimedLog(`Transcribing with ${model} (legacy method)`, "info", model);
  
  try {
    addLog(`Starting transcription with ${model} model (legacy method)`, "info", {
      source: model,
      details: `File: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`
    });
    
    // Prepare FormData for any model
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('prompt', prompt);
    
    let url;
    let headers = {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    };
    
    switch (model) {
      case 'openai':
        url = API_ENDPOINTS.OPENAI_TRANSCRIBE;
        break;
      case 'gemini-2.0-flash':
        url = API_ENDPOINTS.GEMINI_TRANSCRIBE;
        break;
      case 'phi4':
        url = API_ENDPOINTS.PHI4_TRANSCRIBE;
        break;
      default:
        url = API_ENDPOINTS.OPENAI_TRANSCRIBE;
    }
    
    addLog(`Sending request to ${model} endpoint (legacy method)`, "info", { 
      source: model,
      details: `Endpoint: ${url}, File size: ${file.size} bytes`
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    addLog(`Received response from ${model} endpoint`, "info", {
      source: model,
      details: `Status: ${response.status} ${response.statusText}`
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      addLog(`Error response from ${model}`, "error", {
        source: model,
        details: `Status: ${response.status}, Response: ${errorText}`
      });
      logOperation.error(`Failed with status ${response.status}`, errorText);
      throw new Error(`Transcription failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    addLog(`Response data structure: ${Object.keys(data).join(', ')}`, "debug", {
      source: model,
      details: `Response data type: ${typeof data}`
    });
    
    if (!data.vttContent) {
      addLog(`Invalid response format from ${model}`, "error", {
        source: model,
        details: `Response did not contain vttContent: ${JSON.stringify(data)}`
      });
      logOperation.error("Invalid response format", `Response did not contain vttContent: ${JSON.stringify(data)}`);
      throw new Error(`Invalid response from ${model}: missing vttContent`);
    }
    
    const vttPreview = data.vttContent.substring(0, 200) + (data.vttContent.length > 200 ? '...' : '');
    addLog(`${model} transcription content preview`, "debug", {
      source: model,
      details: `Content (first 200 chars): ${vttPreview}`
    });
    
    addLog(`Successfully transcribed with ${model}`, "success", {
      source: model,
      details: `Generated ${data.vttContent.length} characters of VTT content`
    });
    
    logOperation.complete(`Completed ${model} transcription`, `Generated ${data.vttContent.length} characters of VTT content`);
    
    return {
      vttContent: data.vttContent,
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

// Get all transcription jobs for the current user
export async function getTranscriptionJobs() {
  try {
    const { data, error } = await supabase
      .from('transcription_jobs')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching transcription jobs:', error);
    throw error;
  }
}
