
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
    // First check if the transcriptions bucket exists
    const { data: buckets, error: bucketsError } = await baseService.supabase.storage
      .listBuckets();
    
    if (bucketsError) {
      throw new Error(`Failed to list storage buckets: ${bucketsError.message}`);
    }
    
    // Check if the transcriptions bucket exists
    const transcriptionBucketExists = buckets.some(bucket => bucket.name === 'transcriptions');
    
    // If the bucket doesn't exist, create it
    if (!transcriptionBucketExists) {
      addLog(`Creating transcriptions bucket`, "info", {
        source: "Storage Service",
        details: "Bucket doesn't exist, creating it"
      });
      
      const { error: createBucketError } = await baseService.supabase.storage
        .createBucket('transcriptions', {
          public: true
        });
      
      if (createBucketError) {
        throw new Error(`Failed to create transcriptions bucket: ${createBucketError.message}`);
      }
      
      addLog(`Created transcriptions bucket`, "success", {
        source: "Storage Service"
      });
    }
    
    // Ensure the path exists for this session
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

// Also add a function for saving selected transcriptions
export async function saveSelectedTranscription(sessionId: string, vttContent: string, fileName: string, modelName: string) {
  const addLog = getLogsStore().addLog;
  
  try {
    // Create a Blob from the VTT content
    const blob = new Blob([vttContent], { type: 'text/vtt' });
    const file = new File([blob], fileName, { type: 'text/vtt' });
    
    // Check if the transcription_files bucket exists
    const { data: buckets, error: bucketsError } = await baseService.supabase.storage
      .listBuckets();
    
    if (bucketsError) {
      throw new Error(`Failed to list storage buckets: ${bucketsError.message}`);
    }
    
    const transcriptionFilesBucketExists = buckets.some(bucket => bucket.name === 'transcription_files');
    
    // If the bucket doesn't exist, create it
    if (!transcriptionFilesBucketExists) {
      addLog(`Creating transcription_files bucket`, "info", {
        source: "Storage Service",
        details: "Bucket doesn't exist, creating it"
      });
      
      const { error: createBucketError } = await baseService.supabase.storage
        .createBucket('transcription_files', {
          public: true
        });
      
      if (createBucketError) {
        throw new Error(`Failed to create transcription_files bucket: ${createBucketError.message}`);
      }
      
      addLog(`Created transcription_files bucket`, "success", {
        source: "Storage Service"
      });
    }
    
    const { data: uploadData, error: uploadError } = await baseService.supabase.storage
      .from('transcription_files')
      .upload(fileName, file, {
        contentType: 'text/vtt',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = baseService.supabase.storage
      .from('transcription_files')
      .getPublicUrl(fileName);

    if (!publicUrlData) throw new Error("Failed to get public URL");

    // Only update session if sessionId doesn't look like a timestamp
    if (!sessionId.includes('T') || !sessionId.includes('Z')) {
      const { error: sessionUpdateError } = await baseService.supabase
        .from('transcription_sessions')
        .update({ 
          selected_transcription_url: publicUrlData.publicUrl,
          selected_transcription: vttContent,
          selected_model: modelName
        })
        .eq('id', sessionId);

      if (sessionUpdateError) throw sessionUpdateError;
      
      addLog(`Updated session with selected transcription`, "success", {
        source: "Storage Service",
        details: `Session: ${sessionId}, Model: ${modelName}`
      });
    }

    return {
      success: true,
      transcriptionUrl: publicUrlData.publicUrl
    };
  } catch (error) {
    addLog(`Error saving selected transcription: ${error.message}`, "error", {
      source: "Storage Service",
      details: error.stack
    });
    
    throw error;
  }
}
