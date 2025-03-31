
import { TranscriptionModel } from "@/components/ModelSelector";
import { transcribeAudio, createTranscriptionJob, checkTranscriptionJobStatus, getUserTranscriptionJobs, resetStuckJobs } from "./transcriptionService";
import { fetchSharePointFiles, downloadSharePointFile } from "./sharePointService";
import { getBrightcoveAuthToken, addCaptionToBrightcove, fetchBrightcoveKeys } from "./brightcoveService";
import { 
  getCloudStorageConfig, 
  saveCloudStorageConfig, 
  updatePlatformConfig, 
  isPlatformConfigured,
  getConnectionStatus,
  saveConnectionStatus,
  connectPlatform,
  disconnectPlatform,
  isPlatformConnected
} from "./cloudStorageService";

// Re-export all API functions for easy access
export {
  transcribeAudio,
  createTranscriptionJob,
  checkTranscriptionJobStatus,
  getUserTranscriptionJobs,
  fetchSharePointFiles,
  downloadSharePointFile,
  getBrightcoveAuthToken,
  addCaptionToBrightcove,
  resetStuckJobs,
  // Brightcove key function
  fetchBrightcoveKeys,
  // Cloud storage functions
  getCloudStorageConfig,
  saveCloudStorageConfig,
  updatePlatformConfig,
  isPlatformConfigured,
  // New connection status functions
  getConnectionStatus,
  saveConnectionStatus,
  connectPlatform,
  disconnectPlatform,
  isPlatformConnected
};

// Export CloudStorageConfig type
export type { CloudStorageConfig, ConnectionStatus } from "./cloudStorageService";
