
import { baseService } from "../baseService";
import { mapToTranscriptionJob } from "./utils";
import { TranscriptionJob, TranscriptionRecord } from "../../types/transcription";

// Simplified interface for Supabase query results to avoid excessive type instantiation
interface SupabaseQueryResult {
  data: any[] | null;
  error: any | null;
}

// Get all transcription jobs for a specific session
export async function getSessionTranscriptionJobs(sessionId: string): Promise<TranscriptionJob[]> {
  try {
    console.log(`Fetching jobs for session ${sessionId}`);
    
    // Validate sessionId - early exit if invalid
    if (!sessionId || sessionId === 'null' || sessionId === 'undefined') {
      console.warn('Invalid or null session ID provided, returning recent jobs instead');
      return await getFallbackRecentJobs();
    }
    
    // Check if sessionId looks like a timestamp (contains T and Z)
    const isTimestamp = sessionId.includes('T') && sessionId.includes('Z');
    
    if (isTimestamp) {
      return await getJobsByTimestamp(sessionId);
    } else {
      return await getJobsBySessionId(sessionId);
    }
  } catch (error) {
    console.error(`Error fetching transcription jobs for session ${sessionId}:`, error);
    throw error;
  }
}

// Handle timestamp-based job retrieval logic
async function getJobsByTimestamp(sessionId: string): Promise<TranscriptionJob[]> {
  try {
    console.log(`Session ID appears to be a timestamp: ${sessionId}`);
    
    // URL decode the timestamp if needed
    const decodedTimestamp = decodeURIComponent(sessionId);
    console.log(`Decoded timestamp: ${decodedTimestamp}`);
    
    const timestampDate = new Date(decodedTimestamp);
    
    // Use a wider time window to find jobs (10 minutes before and after)
    const TIME_WINDOW = 10 * 60 * 1000; // 10 minutes in milliseconds
    const startTime = new Date(timestampDate.getTime() - TIME_WINDOW);
    const endTime = new Date(timestampDate.getTime() + TIME_WINDOW);
    
    console.log(`Searching for jobs between ${startTime.toISOString()} and ${endTime.toISOString()}`);
    
    // Try direct database query first
    const result = await baseService.supabase
      .from('transcriptions')
      .select('*')
      .gte('created_at', startTime.toISOString())
      .lte('created_at', endTime.toISOString())
      .order('created_at', { ascending: false });
      
    const directJobs = result.data || [];
    const directError = result.error;
      
    if (!directError && directJobs.length > 0) {
      console.log(`Found ${directJobs.length} jobs directly from database`);
      return directJobs.map(job => mapToTranscriptionJob(job as TranscriptionRecord));
    }
      
    // Fallback to view if direct query fails or returns no results
    const viewResult = await baseService.supabase
      .from('transcription_jobs')
      .select('*')
      .gte('created_at', startTime.toISOString())
      .lte('created_at', endTime.toISOString())
      .order('created_at', { ascending: false });
    
    const data = viewResult.data || [];
    const error = viewResult.error;
    
    if (error) {
      throw new Error(`Failed to fetch jobs by timestamp: ${error.message}`);
    }
    
    console.log(`Found ${data.length} jobs within timestamp window`);
    
    if (data.length === 0) {
      return await getFallbackRecentJobs();
    }
    
    return data.map(job => mapToTranscriptionJob(job as TranscriptionRecord));
  } catch (parseError) {
    console.error(`Error processing timestamp ${sessionId}:`, parseError);
    throw new Error(`Invalid timestamp format: ${parseError.message}`);
  }
}

// Handle session ID-based job retrieval logic
async function getJobsBySessionId(sessionId: string): Promise<TranscriptionJob[]> {
  // Double-check sessionId is valid - this is important to prevent issues
  if (!sessionId || sessionId === 'null' || sessionId === 'undefined') {
    console.log('Invalid session ID provided in getJobsBySessionId, returning recent jobs instead');
    return await getFallbackRecentJobs();
  }

  console.log(`Fetching jobs for session ID: ${sessionId}`);

  // Try direct query first
  const directResult = await baseService.supabase
    .from('transcriptions')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });
    
  const directJobs = directResult.data || [];
  const directError = directResult.error;
    
  if (!directError && directJobs.length > 0) {
    console.log(`Found ${directJobs.length} jobs directly from database for session ${sessionId}`);
    return directJobs.map(job => mapToTranscriptionJob(job as TranscriptionRecord));
  }
  
  // Fallback to view
  const viewResult = await baseService.supabase
    .from('transcription_jobs')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });
  
  const data = viewResult.data || [];
  const error = viewResult.error;
  
  if (error) {
    console.error(`Error fetching transcription jobs for session ${sessionId}:`, error);
    throw new Error(`Failed to fetch session jobs: ${error.message}`);
  }
  
  console.log(`Found ${data.length} jobs for session ${sessionId}`);
  
  if (data.length === 0) {
    console.log(`No jobs found for session ${sessionId}, returning recent jobs instead`);
    return await getFallbackRecentJobs();
  }
  
  return data.map(job => mapToTranscriptionJob(job as TranscriptionRecord));
}

// Get recent jobs as a fallback
async function getFallbackRecentJobs(): Promise<TranscriptionJob[]> {
  console.log("Using fallback to get recent transcription jobs");
  
  const recentResult = await baseService.supabase
    .from('transcription_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
    
  const recentJobs = recentResult.data || [];
  const recentError = recentResult.error;
    
  if (recentError) {
    throw new Error(`Failed to fetch recent jobs: ${recentError.message}`);
  }
  
  console.log(`Returning ${recentJobs.length} recent jobs as fallback`);
  return recentJobs.map(job => mapToTranscriptionJob(job as TranscriptionRecord));
}
