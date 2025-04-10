
import { 
  createTranscriptionJob as createJob,
  getUserTranscriptionJobs as getJobs,
  checkTranscriptionJobStatus as checkStatus,
  resetStuckJobs as resetJobs,
} from './services/transcription/jobManagement';

import { 
  transcribeAudio as directTranscribe 
} from './services/transcription/directTranscription';

import { 
  getSessionTranscriptionJobs as getSessionJobs 
} from './services/transcription/sessionJobs';

import { 
  clientTranscribeAudio as clientTranscribe 
} from './services/transcription/clientTranscription';

import {
  deleteTranscriptionSession as deleteSession
} from './services/transcription/sessionManagement';

import { 
  saveTranscriptionToVTT as saveVTT,
  saveSelectedTranscription as saveSelected
} from './services/transcription/transcriptionStorage';

// Re-export all functions
export const createTranscriptionJob = createJob;
export const getUserTranscriptionJobs = getJobs;
export const checkTranscriptionJobStatus = checkStatus;
export const resetStuckJobs = resetJobs;
export const transcribeAudio = directTranscribe;
export const getSessionTranscriptionJobs = getSessionJobs;
export const saveTranscriptionToVTT = saveVTT;
export const saveSelectedTranscription = saveSelected;
export const clientTranscribeAudio = clientTranscribe;
export const deleteTranscriptionSession = deleteSession;
