import { TranscriptionModel } from "@/components/ModelSelector";
import { API_ENDPOINTS, SUPABASE_KEY, convertChunksToVTT, convertTextToVTT } from "./utils";
import { transcribeAudio as phi4Transcribe, DEFAULT_TRANSCRIPTION_PROMPT } from "../phi4TranscriptionService";
import { useLogsStore } from "@/lib/useLogsStore";

const getLogsStore = () => useLogsStore.getState();

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
        return {
          vttContent,
          prompt: result.prompt || "No prompt supported in browser-based Phi-4 model"
        };
      } else {
        addLog(`Received text result from Phi-4`, "info", { source: "phi4" });
        const vttContent = convertTextToVTT(result.text);
        logOperation.complete(`Successfully transcribed with ${model}`, `Generated ${vttContent.length} characters of VTT content`);
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
      case 'gemini-2.0-flash':
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
