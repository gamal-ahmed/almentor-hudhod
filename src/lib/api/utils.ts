
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhid25qZmR6Ym55dmF4bXF1ZnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4MTU5ODIsImV4cCI6MjA1ODM5MTk4Mn0.4-BgbiXxUcR6k7zMRpC1BPRKapqrai6LsOxETi_hYtk";

export const API_ENDPOINTS = {
  OPENAI_TRANSCRIBE: 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/openai-transcribe',
  GEMINI_TRANSCRIBE: 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/gemini-transcribe',
  PHI4_TRANSCRIBE: 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/phi4-transcribe',
  QUEUE_TRANSCRIPTION: 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/queue-transcription',
  
  // Update the endpoint path if needed
  GET_TRANSCRIPTION_STATUS: 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/get-transcription-status',
  
  SHAREPOINT_FILES: 'https://graph.microsoft.com/v1.0/me/drive/root:/General:/children?select=name,webUrl,size,file',
  SHAREPOINT_DOWNLOAD: 'https://graph.microsoft.com/v1.0/me/drive/items/', // + itemId + /content

  BRIGHTCOVE_KEYS: 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/brightcove-keys',
  BRIGHTCOVE_TOKEN: 'https://oauth.brightcove.com/oauth/token',
  BRIGHTCOVE_ADD_CAPTION: 'https://ingest.api.brightcove.com/v1/accounts/{account_id}/videos/{video_id}/texttracks',
  
  // Adding missing proxy endpoints
  SHAREPOINT_PROXY: 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/sharepoint-proxy',
  BRIGHTCOVE_PROXY: 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/brightcove-proxy'
};

export function convertTextToVTT(text: string, timeOffset = 3): string {
  const paragraphs = text.split('\n').filter(p => p.trim() !== '');
  let vttContent = "WEBVTT\n\n";
  let currentTime = 0;

  for (const paragraph of paragraphs) {
    const startTime = formatVTTTime(currentTime);
    currentTime += timeOffset;
    const endTime = formatVTTTime(currentTime);

    vttContent += `${startTime} --> ${endTime}\n${paragraph}\n\n`;
  }

  return vttContent;
}

export function convertChunksToVTT(chunks: { text: string; timestamp: number; }[]): string {
  let vttContent = "WEBVTT\n\n";

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const startTime = formatVTTTime(chunk.timestamp);
    const endTime = i < chunks.length - 1 ? formatVTTTime(chunks[i + 1].timestamp) : formatVTTTime(chunk.timestamp + 3); // Add 3 seconds if it's the last chunk

    vttContent += `${startTime} --> ${endTime}\n${chunk.text}\n\n`;
  }

  return vttContent;
}

export function formatVTTTime(timeInSeconds: number): string {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  const milliseconds = Math.round((timeInSeconds % 1) * 1000);

  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(seconds).padStart(2, '0');
  const formattedMilliseconds = String(milliseconds).padStart(3, '0');

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`;
}
