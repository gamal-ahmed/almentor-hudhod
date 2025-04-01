// API base URL (Proxy for external services or Edge Functions)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Supabase anon key for service requests
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// API endpoints
export const API_ENDPOINTS = {
  // Transcription services
  TRANSCRIBE: `${API_BASE_URL}/functions/v1/openai-transcribe`,
  TRANSCRIPTION_JOB: `${API_BASE_URL}/functions/v1/transcription-job`,
  TRANSCRIPTION_JOB_STATUS: `${API_BASE_URL}/functions/v1/transcription-job-status`,
  TRANSCRIPTION_JOBS: `${API_BASE_URL}/functions/v1/transcription-jobs`,
  RESET_STUCK_JOBS: `${API_BASE_URL}/functions/v1/reset-stuck-jobs`,
  
  // SharePoint integration
  SHAREPOINT_FILES: `${API_BASE_URL}/functions/v1/sharepoint-files`,
  SHAREPOINT_DOWNLOAD: `${API_BASE_URL}/functions/v1/sharepoint-download`,
  SHAREPOINT_PROXY: `${API_BASE_URL}/functions/v1/sharepoint-proxy`,
  
  // Brightcove integration
  BRIGHTCOVE_AUTH: `${API_BASE_URL}/functions/v1/brightcove-auth`,
  BRIGHTCOVE_CAPTION: `${API_BASE_URL}/functions/v1/brightcove-caption`,
  BRIGHTCOVE_KEYS: `${API_BASE_URL}/functions/v1/brightcove-keys`,
  BRIGHTCOVE_PROXY: `${API_BASE_URL}/functions/v1/brightcove-proxy`,
  
  // Cloud storage integration
  CLOUD_STORAGE_AUTH: `${API_BASE_URL}/functions/v1/cloud-storage-auth`,
  CLOUD_STORAGE_TOKEN: `${API_BASE_URL}/functions/v1/cloud-storage-token`,
  CLOUD_STORAGE_FILES: `${API_BASE_URL}/functions/v1/cloud-storage-files`,
  CLOUD_STORAGE_DOWNLOAD: `${API_BASE_URL}/functions/v1/cloud-storage-download`,
  
  // Transcription service - fix the URL path to use the correct format
  TRANSCRIPTION_SERVICE: `${API_BASE_URL}/functions/v1/transcription-service`,
};

// Error handling helper
export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unknown error occurred';
};

// Format VTT time
export function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}

// Convert text to VTT format
export function convertTextToVTT(text: string): string {
  let vttContent = 'WEBVTT\n\n';
  
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  sentences.forEach((sentence: string, index: number) => {
    const startTime = formatVTTTime(index * 5);
    const endTime = formatVTTTime((index + 1) * 5);
    vttContent += `${startTime} --> ${endTime}\n${sentence.trim()}\n\n`;
  });
  
  return vttContent;
}

// Convert chunks to VTT format
export function convertChunksToVTT(chunks: any[]): string {
  if (!chunks || chunks.length === 0) return convertTextToVTT('No transcript available');
  
  let vttContent = 'WEBVTT\n\n';
  
  chunks.forEach((chunk: any) => {
    const startTime = formatVTTTime(chunk.start);
    const endTime = formatVTTTime(chunk.end);
    vttContent += `${startTime} --> ${endTime}\n${chunk.text.trim()}\n\n`;
  });
  
  return vttContent;
}
