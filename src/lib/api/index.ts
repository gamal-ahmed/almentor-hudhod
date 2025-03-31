
import { TranscriptionModel } from "@/components/ModelSelector";
import { transcribeAudio, createTranscriptionJob, checkTranscriptionJobStatus, getUserTranscriptionJobs, resetStuckJobs } from "./transcriptionService";
import { fetchSharePointFiles, downloadSharePointFile } from "./sharePointService";
import { getBrightcoveAuthToken, addCaptionToBrightcove, fetchBrightcoveKeys } from "./brightcoveService";
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
  // Brightcove key function that was missing
  fetchBrightcoveKeys,
  // Cloud storage functions
  getCloudStorageConfig,
  saveCloudStorageConfig,
  updatePlatformConfig,
  isPlatformConfigured
};

// Export CloudStorageConfig type
export type { CloudStorageConfig } from "./cloudStorageService";
