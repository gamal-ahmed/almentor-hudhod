
import { baseService, getLogsStore } from "./baseService";

// Save a VTT file to storage and update the session with the URL
export async function saveTranscriptionToVTT(sessionId: string, vttContent: string, fileName: string) {
  const addLog = getLogsStore().addLog;
  const startTimedLog = getLogsStore().startTimedLog;
  
  const logOperation = startTimedLog(`Saving VTT file for session ${sessionId}`, "info");
  
  try {
    // Create a Blob from the VTT content
    const blob = new Blob([vttContent], { type: 'text/vtt' });
    const file = new File([blob], fileName, { type: 'text/vtt' });
    
    // Upload the file to Supabase Storage
    const filePath = `transcriptions/${sessionId}/${fileName}`;
    
    const { data: uploadData, error: uploadError } = await baseService.supabase.storage
      .from('transcriptions')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      throw new Error(`Failed to upload VTT file: ${uploadError.message}`);
    }
    
    // Get the public URL for the uploaded file
    const { data: urlData } = await baseService.supabase.storage
      .from('transcriptions')
      .getPublicUrl(filePath);
    
    const publicUrl = urlData.publicUrl;
    
    // Update the session with the VTT file URL
    const { error: updateError } = await baseService.supabase
      .from('transcription_sessions')
      .update({
        vtt_file_url: publicUrl
      })
      .eq('id', sessionId);
    
    if (updateError) {
      throw new Error(`Failed to update session with VTT URL: ${updateError.message}`);
    }
    
    addLog(`Successfully saved VTT file for session ${sessionId}`, "success", {
      source: "VTT Export",
      details: `File saved at: ${publicUrl}`
    });
    
    logOperation.complete(`Saved VTT file`, `URL: ${publicUrl}`);
    
    return {
      success: true,
      vttUrl: publicUrl
    };
  } catch (error) {
    addLog(`Error saving VTT file: ${error.message}`, "error", {
      source: "VTT Export",
      details: error.stack
    });
    
    logOperation.error(`${error.message}`, error.stack);
    throw error;
  }
}
