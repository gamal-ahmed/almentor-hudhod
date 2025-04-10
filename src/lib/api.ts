import { TranscriptionModel } from "@/components/ModelSelector";
import { 
  transcribeAudio as serverTranscribeAudio,
  createTranscriptionJob,
  checkTranscriptionJobStatus,
  getUserTranscriptionJobs,
  resetStuckJobs,
  getSessionTranscriptionJobs,
  saveTranscriptionToVTT,
  saveSelectedTranscription,
  clientTranscribeAudio,
  deleteTranscriptionSession
} from "./api/transcriptionService";
import { 
  getBrightcoveAuthToken, 
  addCaptionToBrightcove, 
  deleteCaptionFromBrightcove,
  listCaptionsForBrightcoveVideo, 
  getVideoDetails,
  listAudioTracksForBrightcoveVideo
} from "./api/brightcoveService";
import { fetchAudioFromUrl } from "./api/audioDownloadService";
import { useLogsStore } from "@/lib/useLogsStore";

// API endpoints (using Supabase Edge Functions)
const OPENAI_TRANSCRIBE_URL = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/openai-transcribe';
const GEMINI_TRANSCRIBE_URL = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/gemini-transcribe';
const PHI4_TRANSCRIBE_URL = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/phi4-transcribe';
const BRIGHTCOVE_PROXY_URL = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/brightcove-proxy';

// Supabase API key for authentication
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhid25qZmR6Ym55dmF4bXF1ZnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4MTU5ODIsImV4cCI6MjA1ODM5MTk4Mn0.4-BgbiXxUcR6k7zMRpC1BPRKapqrai6LsOxETi_hYtk';

// Get logs store outside of component to use in this service file
const getLogsStore = () => useLogsStore.getState();

// Re-export transcription service functions
export {
  createTranscriptionJob,
  checkTranscriptionJobStatus,
  getUserTranscriptionJobs,
  resetStuckJobs,
  getBrightcoveAuthToken,
  addCaptionToBrightcove,
  fetchAudioFromUrl,
  getSessionTranscriptionJobs,
  saveTranscriptionToVTT,
  saveSelectedTranscription,
  deleteTranscriptionSession,
  deleteCaptionFromBrightcove,
  listCaptionsForBrightcoveVideo,
  getVideoDetails,
  listAudioTracksForBrightcoveVideo,
  clientTranscribeAudio
};

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
export async function transcribeAudio(file: File, model: TranscriptionModel, prompt = "Please preserve all English words exactly as spoken") {
  return serverTranscribeAudio(file, model, prompt);
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
