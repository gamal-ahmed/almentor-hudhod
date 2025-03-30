
import { TranscriptionModel } from "@/components/ModelSelector";
import { API_ENDPOINTS, SUPABASE_KEY, convertChunksToVTT, convertTextToVTT } from "./utils";
import { useLogsStore } from "@/lib/useLogsStore";
import { supabase } from "@/integrations/supabase/client";

const getLogsStore = () => useLogsStore.getState();

export async function transcribeAudio(file: File, model: TranscriptionModel, prompt = "Please preserve all English words exactly as spoken") {
  const addLog = getLogsStore().addLog;
  const startTimedLog = getLogsStore().startTimedLog;
  
  const logOperation = startTimedLog(`Transcribing with ${model}`, "info", model);
  
  try {
    addLog(`Starting transcription with ${model} model`, "info", {
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
    
    addLog(`Sending request to ${model} endpoint`, "info", { 
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
    
    // Save transcription to Supabase
    await saveTranscriptionResult(model, data.vttContent, prompt, file.name);
    
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

// Save transcription result to Supabase
export async function saveTranscriptionResult(
  model: string, 
  vttContent: string, 
  prompt: string, 
  fileName: string
) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    if (!userId) {
      console.log("No user ID available, saving transcription anonymously");
    }
    
    const { data, error } = await supabase
      .from('transcriptions')
      .insert({
        model,
        result: { vttContent, prompt },
        status: 'completed',
        file_path: fileName,
        user_id: userId || null
      });
    
    if (error) {
      throw new Error(`Error saving transcription: ${error.message}`);
    }
    
    console.log("Transcription saved to database", data);
    return data;
  } catch (error) {
    console.error("Error saving transcription result:", error);
    throw error;
  }
}

// Get all user transcriptions
export async function getUserTranscriptions() {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    if (!userId) {
      // If user is not authenticated, return empty array
      return [];
    }
    
    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Error fetching transcriptions: ${error.message}`);
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching user transcriptions:", error);
    return [];
  }
}

// Get transcription by ID
export async function getTranscriptionById(id: string) {
  try {
    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      throw new Error(`Error fetching transcription: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching transcription by ID:", error);
    throw error;
  }
}

// Get the latest transcription for each model
export async function getLatestTranscriptionsByModel() {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    
    if (!userId) {
      // If user is not authenticated, return empty object
      return {};
    }
    
    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Error fetching transcriptions: ${error.message}`);
    }
    
    // Group by model and get the latest for each
    const latestByModel = {};
    if (data) {
      for (const transcription of data) {
        const model = transcription.model;
        if (!latestByModel[model] || new Date(transcription.created_at) > new Date(latestByModel[model].created_at)) {
          latestByModel[model] = transcription;
        }
      }
    }
    
    return latestByModel;
  } catch (error) {
    console.error("Error fetching latest transcriptions by model:", error);
    return {};
  }
}
