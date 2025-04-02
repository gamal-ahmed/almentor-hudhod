
import { 
  transcribeAudio, 
  createTranscriptionJob, 
  checkTranscriptionJobStatus, 
  getUserTranscriptionJobs, 
  resetStuckJobs,
  saveTranscriptionToVTT,
  saveSelectedTranscription,
  getSessionTranscriptionJobs
} from "./transcriptionService";
import { 
  getBrightcoveAuthToken, 
  addCaptionToBrightcove, 
  fetchBrightcoveKeys,
  deleteCaptionFromBrightcove,
  listCaptionsForBrightcoveVideo
} from "./brightcoveService";
import { fetchAudioFromUrl } from "./audioDownloadService";
import { fetchSharePointFiles, downloadSharePointFile } from "./sharePointService";

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
  getSessionTranscriptionJobs,
  deleteCaptionFromBrightcove,
  listCaptionsForBrightcoveVideo
};
