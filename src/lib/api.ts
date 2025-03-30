
import { TranscriptionModel } from "@/components/ModelSelector";
import { useLogsStore } from "@/lib/useLogsStore";
import { 
  // Transcription API
  transcribeAudio as directTranscribeAudio,
  queueTranscription,
  getTranscriptionStatus,
  getTranscriptionJobs,
  getLatestTranscriptionJob,
  saveTranscriptionResult,
  
  // SharePoint API
  fetchSharePointFiles,
  downloadSharePointFile,
  
  // Brightcove API
  fetchBrightcoveKeys,
  getBrightcoveAuthToken,
  addCaptionToBrightcove,
  
  // Utils
  convertTextToVTT,
  convertChunksToVTT,
  formatVTTTime
} from './api/index';

// For backward compatibility, re-export all functions
export {
  // Transcription API
  queueTranscription,
  getTranscriptionStatus,
  getTranscriptionJobs,
  getLatestTranscriptionJob,
  saveTranscriptionResult,
  
  // SharePoint API
  fetchSharePointFiles,
  downloadSharePointFile,
  
  // Brightcove API
  fetchBrightcoveKeys,
  getBrightcoveAuthToken,
  addCaptionToBrightcove
};

// Transcribe audio using selected model - directly uploads the file (synchronous version)
export async function transcribeAudio(file: File, model: TranscriptionModel, prompt = "Please preserve all English words exactly as spoken") {
  return directTranscribeAudio(file, model, prompt);
}

// Queue a transcription job for async processing
export async function queueTranscriptionJob(file: File, model: TranscriptionModel) {
  return queueTranscription(file, model);
}

// Check the status of a transcription job
export async function checkTranscriptionStatus(jobId: string) {
  return getTranscriptionStatus(jobId);
}

// Get all transcription jobs for the current user
export async function getMyTranscriptionJobs() {
  return getTranscriptionJobs();
}

// Get the latest transcription job for the current user
export async function getMyLatestTranscriptionJob() {
  return getLatestTranscriptionJob();
}
