
// This file imports and re-exports transcription storage functions from the main storageService

import {
  saveTranscriptionToVTT,
  saveSelectedTranscription
} from '../../services/storageService';

// Re-export the functions
export {
  saveTranscriptionToVTT,
  saveSelectedTranscription
};
