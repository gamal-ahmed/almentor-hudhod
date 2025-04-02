
import { baseService, getLogsStore } from "./baseService";
import { parseVTT } from "@/lib/vttParser";

// Save a VTT file to storage and update the session with the URL
export async function saveTranscriptionToVTT(sessionId: string, vttContent: string, fileName: string) {
  const addLog = getLogsStore().addLog;
  const startTimedLog = getLogsStore().startTimedLog;
  
  const logOperation = startTimedLog(`Saving VTT file for session ${sessionId}`, "info");
  
  try {
    // Make sure we have properly formatted VTT content
    let finalVttContent = vttContent;
    
    // If the content doesn't start with WEBVTT, add the header
    if (!finalVttContent.trim().startsWith("WEBVTT")) {
      finalVttContent = "WEBVTT\n\n" + finalVttContent.trim();
    }
    
    // Validate that the VTT content contains multiple segments
    const segments = parseVTT(finalVttContent);
    addLog(`Processing VTT with ${segments.length} segments`, "info", {
      source: "VTT Export",
      segments: segments.length
    });
    
    // Create a Blob from the VTT content
    const blob = new Blob([finalVttContent], { type: 'text/vtt' });
    const file = new File([blob], fileName, { type: 'text/vtt' });
    
    // Ensure the transcriptions bucket exists, create if not
    await ensureBucketExists('transcriptions', addLog);
    
    // Ensure the path exists for this session
    const filePath = `${sessionId}/${fileName}`;
    
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
    const { data: urlData } = baseService.supabase.storage
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
    // Make sure we have properly formatted VTT content
    let finalVttContent = vttContent;
    
    // If the content doesn't start with WEBVTT, add the header
    if (!finalVttContent.trim().startsWith("WEBVTT")) {
      finalVttContent = "WEBVTT\n\n" + finalVttContent.trim();
    }
    
    // Validate that the VTT content contains multiple segments
    const segments = parseVTT(finalVttContent);
    addLog(`Processing VTT with ${segments.length} segments for selected transcription`, "info", {
      source: "Storage Service",
      segments: segments.length
    });
    
    // Create a Blob from the VTT content
    const blob = new Blob([finalVttContent], { type: 'text/vtt' });
    const file = new File([blob], fileName, { type: 'text/vtt' });
    
    // Ensure the transcription_files bucket exists, create if not
    await ensureBucketExists('transcription_files', addLog);
    
    const { data: uploadData, error: uploadError } = await baseService.supabase.storage
      .from('transcription_files')
      .upload(fileName, file, {
        contentType: 'text/vtt',
        upsert: true
      });

    if (uploadError) throw new Error(`Failed to upload VTT file: ${uploadError.message}`);

    const { data: publicUrlData } = baseService.supabase.storage
      .from('transcription_files')
      .getPublicUrl(fileName);

    if (!publicUrlData) throw new Error("Failed to get public URL");

    // Only update session if sessionId doesn't look like a timestamp
    if (!sessionId.includes('T') && !sessionId.includes('Z')) {
      const { error: sessionUpdateError } = await baseService.supabase
        .from('transcription_sessions')
        .update({ 
          selected_transcription_url: publicUrlData.publicUrl,
          selected_transcription: finalVttContent, // Use the full VTT content
          selected_model: modelName,
          accepted_model_id: null // Add this line to clear any previous selection
        })
        .eq('id', sessionId);

      if (sessionUpdateError) throw new Error(`Failed to update session: ${sessionUpdateError.message}`);
      
      addLog(`Updated session with selected transcription`, "success", {
        source: "Storage Service",
        details: `Session: ${sessionId}, Model: ${modelName}, Segments: ${segments.length}`
      });
    }

    addLog(`Saved selected transcription`, "success", {
      source: "Storage Service",
      details: `File: ${fileName}, URL: ${publicUrlData.publicUrl}, Segments: ${segments.length}`
    });

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

// Helper function to ensure a bucket exists, create if not
async function ensureBucketExists(bucketName: string, addLog: Function) {
  const { data: buckets, error: bucketsError } = await baseService.supabase.storage.listBuckets();
  
  if (bucketsError) {
    throw new Error(`Failed to list storage buckets: ${bucketsError.message}`);
  }
  
  const bucketExists = buckets.some(bucket => bucket.name === bucketName);
  
  if (!bucketExists) {
    addLog(`Creating ${bucketName} bucket`, "info", {
      source: "Storage Service",
      details: "Bucket doesn't exist, creating it"
    });
    
    const { error: createBucketError } = await baseService.supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 52428800 // 50MB limit
    });
    
    if (createBucketError) {
      throw new Error(`Failed to create ${bucketName} bucket: ${createBucketError.message}`);
    }
    
    addLog(`Created ${bucketName} bucket`, "success", {
      source: "Storage Service"
    });
  }
}
