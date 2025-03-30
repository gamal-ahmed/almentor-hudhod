
// Common utilities and constants for API operations

// API endpoints using Supabase Edge Functions
export const API_ENDPOINTS = {
  OPENAI_TRANSCRIBE: 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/openai-transcribe',
  GEMINI_TRANSCRIBE: 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/gemini-transcribe',
  PHI4_TRANSCRIBE: 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/phi4-transcribe',
  BRIGHTCOVE_PROXY: 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/brightcove-proxy',
  SHAREPOINT_PROXY: 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/sharepoint-proxy',
  TRANSCRIPTION_SERVICE: 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/transcription-service'
};

// Supabase API key for authentication
export const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhid25qZmR6Ym55dmF4bXF1ZnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4MTU5ODIsImV4cCI6MjA1ODM5MTk4Mn0.4-BgbiXxUcR6k7zMRpC1BPRKapqrai6LsOxETi_hYtk';

// Helper function to convert text to VTT format
export function convertTextToVTT(text: string): string {
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
export function convertChunksToVTT(chunks: Array<{ text: string; timestamp: [number, number] }>): string {
  let vttContent = 'WEBVTT\n\n';
  
  chunks.forEach((chunk) => {
    const startTime = formatVTTTime(chunk.timestamp[0]);
    const endTime = formatVTTTime(chunk.timestamp[1]);
    vttContent += `${startTime} --> ${endTime}\n${chunk.text.trim()}\n\n`;
  });
  
  return vttContent;
}

// Helper function to format time for VTT
export function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}
