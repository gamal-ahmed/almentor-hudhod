
import { pipeline } from "@huggingface/transformers";
import { toast } from "sonner";

// Define a type for the transcription result
export interface TranscriptionResult {
  text: string;
  chunks?: Array<{
    text: string;
    timestamp: [number, number];
  }>;
}

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
    
    // Run the transcription with a prompt to preserve English words
    const result = await transcriber(audioUrl, {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: true,
      prompt: "Please preserve all English words exactly as spoken"
    });

    // Clean up the URL object
    URL.revokeObjectURL(audioUrl);

    // Handle the result properly checking if it's an array
    if (Array.isArray(result)) {
      // If it's an array, we'll join the text from each item
      const combinedText = result.map(item => item.text || "").join(" ");
      return { text: combinedText };
    } else {
      // If it's a single object
      return {
        text: result.text || "",
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
    const formData = new FormData();
    formData.append("audio", audioFile);
    formData.append("prompt", "Please preserve all English words exactly as spoken"); // Adding prompt to preserve English words

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
    
    return { text: textContent };
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
