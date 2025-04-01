
import { baseService, getLogsStore } from "../baseService";

// Reset stuck jobs
export async function resetStuckJobs() {
  const addLog = getLogsStore().addLog;
  const startTimedLog = getLogsStore().startTimedLog;
  
  const logOperation = startTimedLog(`Resetting stuck jobs`, "info", "System");
  
  try {
    // Call the Supabase Function to reset stuck jobs
    const response = await baseService.createAuthorizedRequest(
      `${baseService.apiEndpoints.TRANSCRIPTION_SERVICE}/reset-stuck-jobs`, 
      { method: 'POST' }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to reset stuck jobs: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    addLog(`Successfully reset ${data.updatedCount} stuck jobs`, "success", {
      source: "System",
      details: `Jobs were updated from 'pending' or 'processing' to 'failed'`
    });
    
    logOperation.complete(`Reset stuck jobs`, `${data.updatedCount} jobs updated`);
    
    return data.updatedCount;
  } catch (error) {
    addLog(`Error resetting stuck jobs: ${error.message}`, "error", {
      source: "System",
      details: error.stack
    });
    console.error('Error resetting stuck jobs:', error);
    logOperation.error(`${error.message}`, error.stack);
    throw error;
  }
}
