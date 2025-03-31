
// API base URL (Proxy for external services or Edge Functions)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// API endpoints
export const API_ENDPOINTS = {
  // Transcription services
  TRANSCRIBE: `${API_BASE_URL}/transcribe`,
  TRANSCRIPTION_JOB: `${API_BASE_URL}/transcription-job`,
  TRANSCRIPTION_JOB_STATUS: `${API_BASE_URL}/transcription-job-status`,
  TRANSCRIPTION_JOBS: `${API_BASE_URL}/transcription-jobs`,
  RESET_STUCK_JOBS: `${API_BASE_URL}/reset-stuck-jobs`,
  
  // SharePoint integration
  SHAREPOINT_FILES: `${API_BASE_URL}/sharepoint-files`,
  SHAREPOINT_DOWNLOAD: `${API_BASE_URL}/sharepoint-download`,
  
  // Brightcove integration
  BRIGHTCOVE_AUTH: `${API_BASE_URL}/brightcove-auth`,
  BRIGHTCOVE_CAPTION: `${API_BASE_URL}/brightcove-caption`,
  BRIGHTCOVE_KEYS: `${API_BASE_URL}/brightcove-keys`,
  
  // Cloud storage integration
  CLOUD_STORAGE_AUTH: `${API_BASE_URL}/cloud-storage-auth`,
  CLOUD_STORAGE_TOKEN: `${API_BASE_URL}/cloud-storage-token`,
  CLOUD_STORAGE_FILES: `${API_BASE_URL}/cloud-storage-files`,
  CLOUD_STORAGE_DOWNLOAD: `${API_BASE_URL}/cloud-storage-download`,
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
