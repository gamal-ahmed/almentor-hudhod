
import { TranscriptionModel } from "@/components/ModelSelector";
import { 
  transcribeAudio, 
  createTranscriptionJob, 
  checkTranscriptionJobStatus, 
  getUserTranscriptionJobs, 
  resetStuckJobs,
  saveTranscriptionToVTT,
  saveSelectedTranscription,
  getSessionTranscriptionJobs
} from "./api/transcriptionService";
import { 
  getBrightcoveAuthToken, 
  addCaptionToBrightcove, 
  fetchBrightcoveKeys 
} from "./api/brightcoveService";
import { fetchAudioFromUrl } from "./api/audioDownloadService";
import { fetchSharePointFiles, downloadSharePointFile } from "./api/sharePointService";

// Re-export all API functions for easy access
export {
  transcribeAudio,
  createTranscriptionJob,
  checkTranscriptionJobStatus,
  getUserTranscriptionJobs,
  getBrightcoveAuthToken,
  addCaptionToBrightcove,
  resetStuckJobs,
  fetchAudioFromUrl,
  fetchBrightcoveKeys,
  fetchSharePointFiles,
  downloadSharePointFile,
  saveTranscriptionToVTT,
  saveSelectedTranscription,
  getSessionTranscriptionJobs
};
