
import { TranscriptionModel } from "@/components/ModelSelector";
import { transcribeAudio as phi4Transcribe, DEFAULT_TRANSCRIPTION_PROMPT } from "./phi4TranscriptionService";

// API endpoints (using Supabase Edge Functions)
const OPENAI_TRANSCRIBE_URL = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/openai-transcribe';
const GEMINI_TRANSCRIBE_URL = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/gemini-transcribe';
const BRIGHTCOVE_PROXY_URL = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/brightcove-proxy';

// Supabase API key for authentication
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhid25qZmR6Ym55dmF4bXF1ZnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4MTU5ODIsImV4cCI6MjA1ODM5MTk4Mn0.4-BgbiXxUcR6k7zMRpC1BPRKapqrai6LsOxETi_hYtk';

// Fetch Brightcove keys from Supabase
export async function fetchBrightcoveKeys() {
  try {
    const response = await fetch(
      'https://xbwnjfdzbnyvaxmqufrw.supabase.co/rest/v1/transcription_integrations?select=key_name%2Ckey_value&key_name=in.%28brightcove_client_id%2Cbrightcove_client_secret%2Cbrightcove_account_id%29',
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Brightcove keys: ${response.statusText}`);
    }
    
    const data = await response.json();
    const keys = data.reduce((acc: Record<string, string>, item: { key_name: string, key_value: string }) => {
      acc[item.key_name] = item.key_value;
      return acc;
    }, {});
    
    return keys;
  } catch (error) {
    console.error('Error fetching Brightcove keys:', error);
    throw error;
  }
}

// Transcribe audio using selected model - directly uploads the file
export async function transcribeAudio(file: File, model: TranscriptionModel, prompt = DEFAULT_TRANSCRIPTION_PROMPT) {
  try {
    // For Phi-4, use client-side transcription
    if (model === 'phi4') {
      // Get the result from Phi-4
      const result = await phi4Transcribe(file);
      
      // The phi4Transcribe function now returns chunks with timestamps if available
      if (result.chunks) {
        // If we have chunks, convert them to VTT format
        const vttContent = convertChunksToVTT(result.chunks);
        return {
          vttContent,
          prompt: result.prompt || "No prompt supported in browser-based Phi-4 model"
        };
      } else {
        // If no chunks, convert plain text to VTT
        const vttContent = convertTextToVTT(result.text);
        return {
          vttContent,
          prompt: result.prompt || "No prompt supported in browser-based Phi-4 model"
        };
      }
    }
    
    // For other models, use the server-side functions
    const formData = new FormData();
    formData.append('audio', file);
    formData.append('prompt', prompt);
    
    let url;
    switch (model) {
      case 'openai':
        url = OPENAI_TRANSCRIBE_URL;
        break;
      case 'gemini':
        url = GEMINI_TRANSCRIBE_URL;
        break;
      default:
        url = OPENAI_TRANSCRIBE_URL;
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      vttContent: data.vttContent,
      prompt
    };
  } catch (error) {
    console.error(`Error in ${model} transcription:`, error);
    throw error;
  }
}

// Helper function to convert text to VTT format
function convertTextToVTT(text: string): string {
  let vttContent = 'WEBVTT\n\n';
  
  // Split text into sentences or chunks
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  // Create a VTT cue for each sentence
  sentences.forEach((sentence, index) => {
    const startTime = formatVTTTime(index * 5);
    const endTime = formatVTTTime((index + 1) * 5);
    vttContent += `${startTime} --> ${endTime}\n${sentence.trim()}\n\n`;
  });
  
  return vttContent;
}

// Helper function to convert chunks with timestamps to VTT format
function convertChunksToVTT(chunks: Array<{ text: string; timestamp: [number, number] }>): string {
  let vttContent = 'WEBVTT\n\n';
  
  chunks.forEach((chunk) => {
    const startTime = formatVTTTime(chunk.timestamp[0]);
    const endTime = formatVTTTime(chunk.timestamp[1]);
    vttContent += `${startTime} --> ${endTime}\n${chunk.text.trim()}\n\n`;
  });
  
  return vttContent;
}

// Helper function to format time for VTT
function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}

// Get Brightcove Auth Token using our proxy
export async function getBrightcoveAuthToken(clientId: string, clientSecret: string) {
  try {
    const response = await fetch(`${BRIGHTCOVE_PROXY_URL}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get Brightcove token: ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting Brightcove token:', error);
    throw error;
  }
}

// Add caption to Brightcove video using our proxy
export async function addCaptionToBrightcove(
  videoId: string, 
  vttContent: string, 
  language = 'ar', 
  label = 'Arabic',
  accountId: string,
  accessToken: string
) {
  try {
    // Send the caption content directly to our proxy
    const response = await fetch(`${BRIGHTCOVE_PROXY_URL}/captions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        videoId,
        vttContent,
        language,
        label,
        accountId,
        accessToken
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add caption: ${response.statusText} - ${errorText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error adding caption to Brightcove:', error);
    throw error;
  }
}
