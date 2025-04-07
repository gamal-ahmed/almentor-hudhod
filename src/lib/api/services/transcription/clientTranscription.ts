
import { TranscriptionModel } from "@/components/ModelSelector";
import { getLogsStore } from "../baseService";
import { supabase } from "@/integrations/supabase/client";

// Direct client-side transcription that doesn't use edge functions
export async function clientTranscribeAudio(
  file: File, 
  model: TranscriptionModel, 
  prompt = "Please preserve all English words exactly as spoken"
) {
  const addLog = getLogsStore().addLog;
  const startTimedLog = getLogsStore().startTimedLog;
  
  const logOperation = startTimedLog(`Client-side transcription with ${model}`, "info", model);
  
  try {
    // Validate the file
    if (!file || !file.name || !file.size || !file.type) {
      throw new Error("Invalid file object. File is missing required properties.");
    }
    
    addLog(`Processing audio file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`, "info", {
      source: model,
      details: `Starting direct client transcription with ${model}`
    });
    
    // Convert file to audio element and extract audio data
    const audioUrl = URL.createObjectURL(file);
    
    // For client-side processing, we need to create a unique ID for tracking
    const jobId = crypto.randomUUID();
    
    addLog(`Created client transcription job ${jobId}`, "info", {
      source: model,
      details: `File: ${file.name}`
    });
    
    // Use browser's SpeechRecognition API if available (for simple cases)
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      // Note: This is a basic implementation and has limitations
      // It works best for short recordings and simple transcriptions
      
      addLog(`Using browser's speech recognition API`, "info", { source: model });
      
      // Here we would use the Web Speech API
      // However, it can't directly process audio files, so this is more of a placeholder
      // In a real implementation, you would need to:
      // 1. Play the audio
      // 2. Capture it with microphone
      // 3. Feed it to SpeechRecognition
      
      // For demo purposes, we'll simulate a successful transcription
      const mockResult = {
        vttContent: generateSimpleVtt(`This is a simulated transcription for ${file.name}. The actual implementation would require audio processing which is beyond the scope of a direct browser implementation without additional libraries.`),
        text: `This is a simulated transcription for ${file.name}. The actual implementation would require audio processing which is beyond the scope of a direct browser implementation without additional libraries.`,
        prompt
      };
      
      // Store the result in Supabase for tracking
      const { data, error } = await supabase
        .from('transcriptions')
        .insert({
          id: jobId,
          model: model,
          status: 'completed',
          result: mockResult,
          file_path: file.name,
          status_message: 'Completed via client-side processing',
          user_id: "00000000-0000-0000-0000-000000000000" // Anonymous user ID as fallback
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(`Failed to store transcription result: ${error.message}`);
      }
      
      logOperation.complete(`Completed ${model} client-side transcription`, `Generated ${mockResult.vttContent.length} characters of VTT content`);
      
      return {
        jobId,
        ...mockResult
      };
    } else {
      // For browsers without SpeechRecognition, we'll explain the limitation
      addLog(`Browser does not support direct speech recognition`, "warning", { source: model });
      
      // Create a record of the attempt
      const { data, error } = await supabase
        .from('transcriptions')
        .insert({
          id: jobId,
          model: model,
          status: 'failed',
          error: 'Browser does not support direct speech recognition',
          file_path: file.name,
          status_message: 'Failed - browser limitations',
          user_id: "00000000-0000-0000-0000-000000000000" // Anonymous user ID as fallback
        })
        .select()
        .single();
      
      throw new Error(`Your browser doesn't support direct speech recognition. For advanced transcription, we recommend using our server-based transcription service.`);
    }
  } catch (error) {
    addLog(`Error in ${model} client-side transcription: ${error.message}`, "error", {
      source: model,
      details: error.stack
    });
    console.error(`Error in ${model} client-side transcription:`, error);
    logOperation.error(`${error.message}`, error.stack);
    throw error;
  }
}

// Helper function to generate a simple VTT file from text
function generateSimpleVtt(text: string): string {
  let vttContent = 'WEBVTT\n\n';
  
  // Split text into sentences or chunks
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  // Create a VTT cue for each sentence with appropriate timestamps
  sentences.forEach((sentence, index) => {
    const startTime = formatVTTTime(index * 5);
    const endTime = formatVTTTime((index + 1) * 5);
    vttContent += `${startTime} --> ${endTime}\n${sentence.trim()}\n\n`;
  });
  
  return vttContent;
}

// Helper function to format time in seconds to VTT timestamp format (HH:MM:SS.mmm)
function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}
