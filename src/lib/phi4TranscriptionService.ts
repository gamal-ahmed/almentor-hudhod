import { pipeline } from "@huggingface/transformers";
import { toast } from "sonner";

// Define a type for the transcription result
export interface TranscriptionResult {
  text: string;
  prompt?: string;
  chunks?: Array<{
    text: string;
    timestamp: [number, number];
  }>;
}

// Default prompt for transcription
export const DEFAULT_TRANSCRIPTION_PROMPT = "Please preserve all English words exactly as spoken";

/**
 * Transcribes audio using Microsoft Phi-4 model from Hugging Face
 */
export async function transcribeAudio(audioFile: File): Promise<TranscriptionResult> {
  try {
    // Load the Microsoft Phi-4 model for speech recognition
    const transcriber = await pipeline(
      "automatic-speech-recognition",
      "microsoft/Phi-4-multimodal-instruct",
      { revision: "main" }
    );

    // Create a URL from the audio file for processing
    const audioUrl = URL.createObjectURL(audioFile);
    
    // Run the transcription with the correct configuration options 
    // (removed "prompt" which isn't supported by the library)
    const result = await transcriber(audioUrl, {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: true
    });

    // Clean up the URL object
    URL.revokeObjectURL(audioUrl);

    // Handle the result properly checking if it's an array
    if (Array.isArray(result)) {
      // If it's an array, we'll join the text from each item
      const combinedText = result.map(item => item.text || "").join(" ");
      
      // Generate VTT content from the combined text
      const vttContent = convertTextToVTT(combinedText);
      
      return { 
        text: combinedText,
        prompt: "No prompt supported in browser-based Phi-4 model" 
      };
    } else {
      // If it's a single object with chunks, convert to VTT format
      let vttContent = "";
      
      if (Array.isArray(result.chunks) && result.chunks.length > 0) {
        vttContent = convertChunksToVTT(result.chunks);
      } else {
        vttContent = convertTextToVTT(result.text || "");
      }
      
      return {
        text: result.text || "",
        prompt: "No prompt supported in browser-based Phi-4 model",
        chunks: Array.isArray(result.chunks) ? result.chunks : undefined
      };
    }
  } catch (error) {
    console.error("Transcription error:", error);
    toast.error("Failed to transcribe audio. Falling back to cloud service...");
    return transcribeWithOpenAI(audioFile);
  }
}

/**
 * Fallback to Supabase OpenAI function if the browser transcription fails
 */
export async function transcribeWithOpenAI(audioFile: File): Promise<TranscriptionResult> {
  try {
    const prompt = DEFAULT_TRANSCRIPTION_PROMPT;
    const formData = new FormData();
    formData.append("audio", audioFile);
    formData.append("prompt", prompt); // Adding prompt to preserve English words

    const response = await fetch("https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/openai-transcribe", {
      method: "POST",
      body: formData,
      headers: {
        "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhid25qZmR6Ym55dmF4bXF1ZnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4MTU5ODIsImV4cCI6MjA1ODM5MTk4Mn0.4-BgbiXxUcR6k7zMRpC1BPRKapqrai6LsOxETi_hYtk",
        "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhid25qZmR6Ym55dmF4bXF1ZnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4MTU5ODIsImV4cCI6MjA1ODM5MTk4Mn0.4-BgbiXxUcR6k7zMRpC1BPRKapqrai6LsOxETi_hYtk"
      }
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    const vttContent = data.vttContent;
    
    // Extract the text content from the VTT format
    const textContent = extractTextFromVTT(vttContent);
    
    return { 
      text: textContent,
      prompt 
    };
  } catch (error) {
    console.error("OpenAI transcription error:", error);
    toast.error("Failed to transcribe audio with cloud service. Please try again.");
    throw error;
  }
}

/**
 * Helper function to extract text from VTT format
 */
function extractTextFromVTT(vttContent: string): string {
  const lines = vttContent.split('\n');
  const textLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    // Skip WebVTT header, timecodes, and empty lines
    if (
      lines[i] !== 'WEBVTT' && 
      !lines[i].match(/^\d{2}:\d{2}:\d{2}/) && 
      !lines[i].match(/^\d{2}:\d{2}/) && 
      lines[i].trim() !== ''
    ) {
      textLines.push(lines[i]);
    }
  }
  
  return textLines.join(' ').trim();
}

/**
 * Convert plain text to VTT format
 */
function convertTextToVTT(text: string): string {
  let vttContent = 'WEBVTT\n\n';
  
  // Split text into sentences or chunks (simple splitting by punctuation)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  // Create a VTT cue for each sentence with appropriate timestamps
  sentences.forEach((sentence, index) => {
    const startTime = formatVTTTime(index * 5);
    const endTime = formatVTTTime((index + 1) * 5);
    vttContent += `${startTime} --> ${endTime}\n${sentence.trim()}\n\n`;
  });
  
  return vttContent;
}

/**
 * Convert chunks with timestamps to VTT format
 */
function convertChunksToVTT(chunks: Array<{ text: string; timestamp: [number, number] }>): string {
  let vttContent = 'WEBVTT\n\n';
  
  chunks.forEach((chunk) => {
    const startTime = formatVTTTime(chunk.timestamp[0]);
    const endTime = formatVTTTime(chunk.timestamp[1]);
    vttContent += `${startTime} --> ${endTime}\n${chunk.text.trim()}\n\n`;
  });
  
  return vttContent;
}

/**
 * Format time in seconds to VTT timestamp format (HH:MM:SS.mmm)
 */
function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}
