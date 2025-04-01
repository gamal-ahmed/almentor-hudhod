
import { TranscriptionModel } from "@/components/ModelSelector";
import { transcribeAudio, createTranscriptionJob, checkTranscriptionJobStatus, getUserTranscriptionJobs, resetStuckJobs } from "./transcriptionService";
import { getBrightcoveAuthToken, addCaptionToBrightcove } from "./brightcoveService";
import { fetchAudioFromUrl } from "./audioDownloadService";

// Re-export all API functions for easy access
export {
  transcribeAudio,
  createTranscriptionJob,
  checkTranscriptionJobStatus,
  getUserTranscriptionJobs,
  getBrightcoveAuthToken,
  addCaptionToBrightcove,
  resetStuckJobs,
  fetchAudioFromUrl
};
