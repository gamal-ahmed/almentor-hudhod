
import { TranscriptionModel } from "@/components/ModelSelector";
import { transcribeAudio, createTranscriptionJob, checkTranscriptionJobStatus, getUserTranscriptionJobs, resetStuckJobs } from "./transcriptionService";
import { fetchSharePointFiles, downloadSharePointFile } from "./sharePointService";
import { getBrightcoveAuthToken, addCaptionToBrightcove } from "./brightcoveService";

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
  resetStuckJobs
};
