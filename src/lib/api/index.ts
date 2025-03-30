
import { TranscriptionModel } from "@/components/ModelSelector";
import { DEFAULT_TRANSCRIPTION_PROMPT } from "../phi4TranscriptionService";
import { useLogsStore } from "@/lib/useLogsStore";

// API endpoints (using Supabase Edge Functions)
const OPENAI_TRANSCRIBE_URL = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/openai-transcribe';
const GEMINI_TRANSCRIBE_URL = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/gemini-transcribe';
const BRIGHTCOVE_PROXY_URL = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/brightcove-proxy';
const SHAREPOINT_PROXY_URL = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/sharepoint-proxy';

// Supabase API key for authentication
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhid25qZmR6Ym55dmF4bXF1ZnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4MTU5ODIsImV4cCI6MjA1ODM5MTk4Mn0.4-BgbiXxUcR6k7zMRpC1BPRKapqrai6LsOxETi_hYtk';

// Re-export API functions from other services
export { OPENAI_TRANSCRIBE_URL, GEMINI_TRANSCRIBE_URL, BRIGHTCOVE_PROXY_URL, SHAREPOINT_PROXY_URL, SUPABASE_KEY };
export { convertChunksToVTT, convertTextToVTT } from './utils';
export { fetchBrightcoveKeys, getBrightcoveAuthToken, addCaptionToBrightcove } from './brightcoveService';
export { fetchSharePointFiles, downloadSharePointFile } from './sharePointService';
export { 
  transcribeAudio, 
  saveTranscriptionState, 
  getTranscriptionState, 
  clearTranscriptionState,
  updateTranscriptionResult 
} from './transcriptionService';
