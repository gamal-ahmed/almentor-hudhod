
import { 
  transcribeAudio, 
  createTranscriptionJob, 
  checkTranscriptionJobStatus, 
  getUserTranscriptionJobs, 
  resetStuckJobs,
  saveTranscriptionToVTT,
  saveSelectedTranscription,
  getSessionTranscriptionJobs,
  clientTranscribeAudio
} from "./transcriptionService";
import { 
  getBrightcoveAuthToken, 
  addCaptionToBrightcove, 
  fetchBrightcoveKeys,
  deleteCaptionFromBrightcove,
  listCaptionsForBrightcoveVideo,
  getVideoDetails,
  listAudioTracksForBrightcoveVideo
} from "./brightcoveService";
import { fetchAudioFromUrl } from "./audioDownloadService";

// Re-export all API functions for easy access
export {
  transcribeAudio,
  clientTranscribeAudio,
  createTranscriptionJob,
  checkTranscriptionJobStatus,
  getUserTranscriptionJobs,
  getBrightcoveAuthToken,
  addCaptionToBrightcove,
  resetStuckJobs,
  fetchAudioFromUrl,
  fetchBrightcoveKeys,
  saveTranscriptionToVTT,
  saveSelectedTranscription,
  getSessionTranscriptionJobs,
  deleteCaptionFromBrightcove,
  listCaptionsForBrightcoveVideo,
  getVideoDetails,
  listAudioTracksForBrightcoveVideo
};
