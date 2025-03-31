
import { TranscriptionModel } from "@/components/ModelSelector";
import { transcribeAudio, createTranscriptionJob, checkTranscriptionJobStatus, getUserTranscriptionJobs, resetStuckJobs } from "./transcriptionService";
import { fetchSharePointFiles, downloadSharePointFile } from "./sharePointService";
import { getBrightcoveAuthToken, addCaptionToBrightcove } from "./brightcoveService";
import { getCloudStorageConfig, saveCloudStorageConfig, updatePlatformConfig, isPlatformConfigured } from "./cloudStorageService";

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
  // Cloud storage functions
  getCloudStorageConfig,
  saveCloudStorageConfig,
  updatePlatformConfig,
  isPlatformConfigured
};

// Cloud storage related types
export interface CloudStorageConfig {
  googleDrive: {
    clientId: string;
    apiKey: string;
  };
  dropbox: {
    appKey: string;
  };
}
