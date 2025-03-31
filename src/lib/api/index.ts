
import { TranscriptionModel } from "@/components/ModelSelector";
import { transcribeAudio, createTranscriptionJob, checkTranscriptionJobStatus, getUserTranscriptionJobs, resetStuckJobs } from "./transcriptionService";
import { fetchSharePointFiles, downloadSharePointFile } from "./sharePointService";
import { publishCaptions } from "./brightcoveService";

// Re-export all API functions for easy access
export {
  transcribeAudio,
  createTranscriptionJob,
  checkTranscriptionJobStatus,
  getUserTranscriptionJobs,
  fetchSharePointFiles,
  downloadSharePointFile,
  publishCaptions,
  resetStuckJobs
};
