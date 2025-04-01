
import { TranscriptionJob, TranscriptionRecord } from "../types/transcription";
import { baseService, getLogsStore } from "./baseService";

// Helper function to convert database record to TranscriptionJob with proper types
function mapToTranscriptionJob(record: TranscriptionRecord): TranscriptionJob {
  return {
    id: record.id || '',
    status: record.status as 'pending' | 'processing' | 'completed' | 'failed',
    model: record.model,
    created_at: record.created_at || new Date().toISOString(),
    updated_at: record.updated_at || new Date().toISOString(),
    status_message: record.status_message || '',
    error: record.error,
    result: record.result,
    file_path: record.file_path,
    user_id: record.user_id,
    session_id: record.session_id,
    vtt_file_url: record.vtt_file_url
  };
}

// Check the status of a transcription job
export async function checkTranscriptionJobStatus(jobId: string) {
  try {
    const { data, error } = await baseService.supabase
      .from('transcription_jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (error) {
      throw new Error(`Failed to fetch job status: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error checking transcription job status:', error);
    throw error;
  }
}

// Get all transcription jobs for the current user
export async function getUserTranscriptionJobs(): Promise<TranscriptionJob[]> {
  try {
    // Use the transcription_jobs view to get all jobs
    const { data, error } = await baseService.supabase
      .from('transcription_jobs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch user jobs: ${error.message}`);
    }
    
    // Map database records to TranscriptionJob type
    return (data || []).map(mapToTranscriptionJob);
  } catch (error) {
    console.error('Error fetching user transcription jobs:', error);
    throw error;
  }
}

// Get all transcription jobs for a specific session
export async function getSessionTranscriptionJobs(sessionId: string): Promise<TranscriptionJob[]> {
  try {
    console.log(`Fetching jobs for session ${sessionId}`);
    
    // Check if sessionId looks like a timestamp (contains T and Z)
    const isTimestamp = sessionId.includes('T') && sessionId.includes('Z');
    
    if (isTimestamp) {
      console.log(`Session ID appears to be a timestamp: ${sessionId}`);
      
      // URL decode the timestamp if needed
      const decodedTimestamp = decodeURIComponent(sessionId);
      console.log(`Decoded timestamp: ${decodedTimestamp}`);
      
      try {
        const timestampDate = new Date(decodedTimestamp);
        
        // Use a wider time window to find jobs (10 minutes before and after)
        const TIME_WINDOW = 10 * 60 * 1000; // 10 minutes in milliseconds
        const startTime = new Date(timestampDate.getTime() - TIME_WINDOW);
        const endTime = new Date(timestampDate.getTime() + TIME_WINDOW);
        
        console.log(`Searching for jobs between ${startTime.toISOString()} and ${endTime.toISOString()}`);
        
        // Try direct database query first
        const { data: directJobs, error: directError } = await baseService.supabase
          .from('transcriptions')
          .select('*')
          .gte('created_at', startTime.toISOString())
          .lte('created_at', endTime.toISOString())
          .order('created_at', { ascending: false });
          
        if (!directError && directJobs && directJobs.length > 0) {
          console.log(`Found ${directJobs.length} jobs directly from database`);
          return directJobs.map(mapToTranscriptionJob);
        }
          
        // Fallback to view if direct query fails or returns no results
        const { data, error } = await baseService.supabase
          .from('transcription_jobs')
          .select('*')
          .gte('created_at', startTime.toISOString())
          .lte('created_at', endTime.toISOString())
          .order('created_at', { ascending: false });
        
        if (error) {
          throw new Error(`Failed to fetch jobs by timestamp: ${error.message}`);
        }
        
        console.log(`Found ${data?.length || 0} jobs within timestamp window`);
        
        if (!data || data.length === 0) {
          // If no jobs found within the window, get recent jobs as a fallback
          const { data: recentJobs, error: recentError } = await baseService.supabase
            .from('transcription_jobs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
            
          if (recentError) {
            throw new Error(`Failed to fetch recent jobs: ${recentError.message}`);
          }
          
          console.log(`Returning ${recentJobs?.length || 0} recent jobs as fallback`);
          return (recentJobs || []).map(mapToTranscriptionJob);
        }
        
        return (data || []).map(mapToTranscriptionJob);
      } catch (parseError) {
        console.error(`Error processing timestamp ${sessionId}:`, parseError);
        throw new Error(`Invalid timestamp format: ${parseError.message}`);
      }
    } else {
      // For UUID-based sessions, use the normal query
      
      // Try direct query first
      const { data: directJobs, error: directError } = await baseService.supabase
        .from('transcriptions')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });
        
      if (!directError && directJobs && directJobs.length > 0) {
        console.log(`Found ${directJobs.length} jobs directly from database for session ${sessionId}`);
        return directJobs.map(mapToTranscriptionJob);
      }
      
      // Fallback to view
      // Use explicit type annotation to help TypeScript resolve the type
      type TranscriptionData = any[];
      const { data, error }: { data: TranscriptionData | null, error: any } = await baseService.supabase
        .from('transcription_jobs')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error(`Error fetching transcription jobs for session ${sessionId}:`, error);
        throw new Error(`Failed to fetch session jobs: ${error.message}`);
      }
      
      console.log(`Found ${data?.length || 0} jobs for session ${sessionId}`);
      return (data || []).map(mapToTranscriptionJob);
    }
  } catch (error) {
    console.error(`Error fetching transcription jobs for session ${sessionId}:`, error);
    throw error;
  }
}

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
