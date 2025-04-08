
import { TranscriptionModel } from "@/components/ModelSelector";
import { baseService, getLogsStore } from "../baseService";
import { supabase } from "@/integrations/supabase/client";

// Client-side implementation of transcribeAudio, for when we can't rely on edge functions
export async function clientTranscribeAudio(
  file: File, 
  model: TranscriptionModel, 
  prompt = "Please preserve all English words exactly as spoken"
) {
  const addLog = getLogsStore().addLog;
  const startTimedLog = getLogsStore().startTimedLog;
  
  const logOperation = startTimedLog(`Client-side transcription with ${model}`, "info", model);
  
  try {
    // Create a unique ID for this transcription
    const jobId = crypto.randomUUID();
    
    // Prepare the form data for direct API call
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('prompt', prompt);
    
    let apiUrl = '';
    
    // Select appropriate endpoint based on model
    switch(model) {
      case 'openai':
        apiUrl = baseService.apiEndpoints.OPENAI_TRANSCRIBE_URL;
        break;
      case 'gemini-2.0-flash':
        apiUrl = baseService.apiEndpoints.GEMINI_TRANSCRIBE_URL;
        break;
      case 'phi4':
        apiUrl = baseService.apiEndpoints.PHI4_TRANSCRIBE_URL;
        break;
      default:
        apiUrl = baseService.apiEndpoints.OPENAI_TRANSCRIBE_URL;
    }
    
    addLog(`Making direct API call to ${model} endpoint`, "info", {
      source: model,
      details: `URL: ${apiUrl}`
    });
    
    // Get authentication token
    const { data: authData } = await supabase.auth.getSession();
    const authToken = authData.session?.access_token || baseService.supabaseKey;
    
    // Call the API endpoint directly
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'apikey': baseService.supabaseKey
      },
      body: formData
    });
    
    if (!response.ok) {
      let errorMessage = `Failed direct API call to ${model}: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage += ` - ${errorData.error || JSON.stringify(errorData)}`;
      } catch (e) {
        const errorText = await response.text();
        errorMessage += ` - ${errorText || 'Unknown error'}`;
      }
      throw new Error(errorMessage);
    }
    
    // Parse the response
    const result = await response.json();
    
    // Create a job record in the database to match the interface of the regular flow
    const insertData = {
      id: jobId,
      model: model,
      status: 'completed',
      result: {
        vttContent: result.vttContent,
        text: result.text || "",
        prompt: prompt
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Save the result to the database
    const { error: insertError } = await baseService.supabase
      .from('transcriptions')
      .insert(insertData);
    
    if (insertError) {
      console.warn(`Warning: Failed to save client-side transcription result to database: ${insertError.message}`);
    }
    
    logOperation.complete(`Completed ${model} transcription (client-side)`, `Generated ${result.vttContent.length} characters of VTT content`);
    
    return {
      jobId,
      vttContent: result.vttContent,
      text: result.text || "",
      prompt
    };
  } catch (error) {
    addLog(`Error in client-side ${model} transcription: ${error.message}`, "error", {
      source: model,
      details: error.stack
    });
    console.error(`Error in client-side ${model} transcription:`, error);
    logOperation.error(`${error.message}`, error.stack);
    throw error;
  }
}
