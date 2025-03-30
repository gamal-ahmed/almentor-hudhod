import { TranscriptionModel } from "@/components/ModelSelector";
import { transcribeAudio as phi4Transcribe, DEFAULT_TRANSCRIPTION_PROMPT } from "./phi4TranscriptionService";
import { useLogsStore } from "@/lib/useLogsStore";

// API endpoints (using Supabase Edge Functions)
const OPENAI_TRANSCRIBE_URL = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/openai-transcribe';
const GEMINI_TRANSCRIBE_URL = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/gemini-transcribe';
const BRIGHTCOVE_PROXY_URL = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/brightcove-proxy';
const SHAREPOINT_PROXY_URL = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/sharepoint-proxy';

// Supabase API key for authentication
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhid25qZmR6Ym55dmF4bXF1ZnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4MTU5ODIsImV4cCI6MjA1ODM5MTk4Mn0.4-BgbiXxUcR6k7zMRpC1BPRKapqrai6LsOxETi_hYtk';

// Get logs store outside of component to use in this service file
const getLogsStore = () => useLogsStore.getState();

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

// Fetch MP3 files from SharePoint
export async function fetchSharePointFiles(sharePointUrl: string): Promise<{name: string, url: string, size: number, lastModified: string}[]> {
  try {
    console.log(`Fetching SharePoint files from: ${sharePointUrl}`);
    const response = await fetch(`${SHAREPOINT_PROXY_URL}/list-files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        sharePointUrl
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch SharePoint files: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    console.log(`Received ${data.files.length} files from SharePoint proxy`);
    
    // Return all files, filtering will be done in the component
    return data.files;
  } catch (error) {
    console.error('Error fetching SharePoint files:', error);
    throw error;
  }
}

// Download a single file from SharePoint
export async function downloadSharePointFile(fileUrl: string): Promise<File> {
  try {
    console.log(`Downloading file from: ${fileUrl}`);
    const response = await fetch(`${SHAREPOINT_PROXY_URL}/download-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        fileUrl
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to download file: ${response.status} - ${errorText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    // Extract file name from URL
    const fileName = fileUrl.split('/').pop() || 'audio.mp3';
    
    // Create a File object from the array buffer
    return new File([arrayBuffer], fileName, { type: 'audio/mpeg' });
  } catch (error) {
    console.error('Error downloading SharePoint file:', error);
    throw error;
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
        url = OPENAI_TRANSCRIBE_URL;
        break;
      case 'gemini':
        url = GEMINI_TRANSCRIBE_URL;
        break;
      default:
        url = OPENAI_TRANSCRIBE_URL;
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
    
    // Special handling for Gemini to log detailed response
    if (model === 'gemini') {
      try {
        const responseText = await response.text();
        addLog(`Raw Gemini response received (${responseText.length} chars)`, "debug", {
          source: "gemini",
          details: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : '')
        });
        
        // Parse the text back to JSON
        const data = JSON.parse(responseText);
        
        // Extra validation for Gemini response
        if (!data) {
          throw new Error("Empty response from Gemini");
        }
        
        addLog(`Parsed Gemini response keys: ${Object.keys(data).join(', ')}`, "debug", {
          source: "gemini"
        });
        
        if (!data.vttContent) {
          throw new Error(`Missing vttContent in Gemini response: ${JSON.stringify(data)}`);
        }
        
        addLog(`Gemini VTT content length: ${data.vttContent.length}`, "debug", {
          source: "gemini",
          details: `First 200 chars: ${data.vttContent.substring(0, 200)}...`
        });
        
        // Return properly formatted data
        logOperation.complete(`Successfully transcribed with ${model}`, `Generated ${data.vttContent.length} characters of VTT content`);
        return {
          vttContent: data.vttContent,
          prompt
        };
      } catch (parseError) {
        addLog(`Error parsing Gemini response: ${parseError.message}`, "error", {
          source: "gemini",
          details: parseError.stack
        });
        throw parseError;
      }
    } else {
      // Handle other models normally
      const data = await response.json();
      
      // Log more details about the response
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
      
      return {
        vttContent: data.vttContent,
        prompt
      };
    }
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

// Helper function to convert text to VTT format
function convertTextToVTT(text: string): string {
  let vttContent = 'WEBVTT\n\n';
  
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
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
