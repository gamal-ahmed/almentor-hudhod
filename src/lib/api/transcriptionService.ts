
import { TranscriptionModel } from "@/components/ModelSelector";
import { API_ENDPOINTS, SUPABASE_KEY, convertChunksToVTT, convertTextToVTT } from "./utils";
import { transcribeAudio as phi4Transcribe, DEFAULT_TRANSCRIPTION_PROMPT } from "../phi4TranscriptionService";
import { useLogsStore } from "@/lib/useLogsStore";

// Get logs store outside of component to use in this service file
const getLogsStore = () => useLogsStore.getState();

// Storage keys for persisting transcription state
const STORAGE_KEYS = {
  IN_PROGRESS: 'transcription_in_progress',
  FILE_NAME: 'transcription_file_name',
  FILE_SIZE: 'transcription_file_size',
  FILE_TYPE: 'transcription_file_type',
  SELECTED_MODELS: 'transcription_selected_models',
  PROMPT: 'transcription_prompt',
  RESULTS: 'transcription_results',
  TIMESTAMP: 'transcription_timestamp'
};

// Save transcription state to localStorage
export function saveTranscriptionState(file: File, models: TranscriptionModel[], prompt: string) {
  try {
    localStorage.setItem(STORAGE_KEYS.IN_PROGRESS, 'true');
    localStorage.setItem(STORAGE_KEYS.FILE_NAME, file.name);
    localStorage.setItem(STORAGE_KEYS.FILE_SIZE, file.size.toString());
    localStorage.setItem(STORAGE_KEYS.FILE_TYPE, file.type);
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODELS, JSON.stringify(models));
    localStorage.setItem(STORAGE_KEYS.PROMPT, prompt);
    localStorage.setItem(STORAGE_KEYS.TIMESTAMP, Date.now().toString());
    
    // Initialize results object
    const results = models.reduce((acc, model) => {
      acc[model] = { vtt: "", prompt: prompt, loading: true };
      return acc;
    }, {} as Record<string, any>);
    
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
    
    console.log('Transcription state saved to localStorage');
  } catch (error) {
    console.error('Error saving transcription state:', error);
  }
}

// Update results for a specific model
export function updateTranscriptionResult(model: TranscriptionModel, vttContent: string, prompt: string) {
  try {
    const resultsJson = localStorage.getItem(STORAGE_KEYS.RESULTS);
    if (resultsJson) {
      const results = JSON.parse(resultsJson);
      results[model] = { vtt: vttContent, prompt, loading: false };
      localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
      console.log(`Updated transcription result for ${model}`);
    }
  } catch (error) {
    console.error('Error updating transcription result:', error);
  }
}

// Check if there's a transcription in progress
export function getTranscriptionState(): null | {
  inProgress: boolean;
  fileName: string;
  fileSize: number;
  fileType: string;
  selectedModels: TranscriptionModel[];
  prompt: string;
  results: Record<string, { vtt: string; prompt: string; loading: boolean }>;
  timestamp: number;
} {
  try {
    const inProgress = localStorage.getItem(STORAGE_KEYS.IN_PROGRESS) === 'true';
    
    if (!inProgress) return null;
    
    const fileName = localStorage.getItem(STORAGE_KEYS.FILE_NAME);
    const fileSize = localStorage.getItem(STORAGE_KEYS.FILE_SIZE);
    const fileType = localStorage.getItem(STORAGE_KEYS.FILE_TYPE);
    const selectedModelsJson = localStorage.getItem(STORAGE_KEYS.SELECTED_MODELS);
    const prompt = localStorage.getItem(STORAGE_KEYS.PROMPT);
    const resultsJson = localStorage.getItem(STORAGE_KEYS.RESULTS);
    const timestamp = localStorage.getItem(STORAGE_KEYS.TIMESTAMP);
    
    if (!fileName || !fileSize || !fileType || !selectedModelsJson || !prompt || !resultsJson || !timestamp) {
      clearTranscriptionState();
      return null;
    }
    
    return {
      inProgress,
      fileName,
      fileSize: parseInt(fileSize, 10),
      fileType,
      selectedModels: JSON.parse(selectedModelsJson),
      prompt,
      results: JSON.parse(resultsJson),
      timestamp: parseInt(timestamp, 10)
    };
  } catch (error) {
    console.error('Error getting transcription state:', error);
    clearTranscriptionState();
    return null;
  }
}

// Clear transcription state from localStorage
export function clearTranscriptionState() {
  try {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    console.log('Transcription state cleared from localStorage');
  } catch (error) {
    console.error('Error clearing transcription state:', error);
  }
}

// Transcribe audio using selected model - directly uploads the file
export async function transcribeAudio(file: File, model: TranscriptionModel, prompt = DEFAULT_TRANSCRIPTION_PROMPT) {
  const addLog = getLogsStore().addLog;
  const startTimedLog = getLogsStore().startTimedLog;
  
  const logOperation = startTimedLog(`Transcribing with ${model}`, "info", model);
  
  try {
    addLog(`Starting transcription with ${model} model`, "info", {
      source: model,
      details: `File: ${file.name}, Size: ${file.size} bytes, Type: ${file.type}`
    });
    
    if (model === 'phi4') {
      addLog(`Using browser-based Phi-4 model`, "info", { source: "phi4" });
      const result = await phi4Transcribe(file);
      
      if (result.chunks) {
        addLog(`Received ${result.chunks.length} chunks from Phi-4`, "info", { source: "phi4" });
        const vttContent = convertChunksToVTT(result.chunks);
        logOperation.complete(`Successfully transcribed with ${model}`, `Generated ${vttContent.length} characters of VTT content`);
        
        // Update result in localStorage
        updateTranscriptionResult(model, vttContent, result.prompt || "No prompt supported in browser-based Phi-4 model");
        
        return {
          vttContent,
          prompt: result.prompt || "No prompt supported in browser-based Phi-4 model"
        };
      } else {
        addLog(`Received text result from Phi-4`, "info", { source: "phi4" });
        const vttContent = convertTextToVTT(result.text);
        logOperation.complete(`Successfully transcribed with ${model}`, `Generated ${vttContent.length} characters of VTT content`);
        
        // Update result in localStorage
        updateTranscriptionResult(model, vttContent, result.prompt || "No prompt supported in browser-based Phi-4 model");
        
        return {
          vttContent,
          prompt: result.prompt || "No prompt supported in browser-based Phi-4 model"
        };
      }
    }
    
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('prompt', prompt);
    
    let url;
    switch (model) {
      case 'openai':
        url = API_ENDPOINTS.OPENAI_TRANSCRIBE;
        break;
      case 'gemini':
        url = API_ENDPOINTS.GEMINI_TRANSCRIBE;
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
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
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
    
    // Log the response data structure
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
    
    // Log the first 200 characters of the vttContent for debugging
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
    
    // Update result in localStorage
    updateTranscriptionResult(model, data.vttContent, prompt);
    
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
