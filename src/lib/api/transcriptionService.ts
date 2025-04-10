
import { 
  createTranscriptionJob as createJob,
  getUserTranscriptionJobs as getJobs,
  checkTranscriptionJobStatus as checkStatus,
} from './services/transcription/jobStatus';

import { 
  resetStuckJobs as resetJobs,
} from './services/transcription/jobMaintenance';

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

// Import from storageService instead of transcriptionStorage
import { 
  saveTranscriptionToVTT as saveVTT,
  saveSelectedTranscription as saveSelected
} from '../api/services/storageService';

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
