
import { baseService } from "../baseService";
import { mapToTranscriptionJob } from "./utils";
import { TranscriptionJob } from "../../types/transcription";

// Define simplified type for Supabase query response to avoid excessive type instantiation
type SupabaseQueryResult = {
  data: any | null;
  error: any | null;
};

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
    const result: SupabaseQueryResult = await baseService.supabase
      .from('transcription_jobs')
      .select('*')
      .order('created_at', { ascending: false });
    
    const data = result.data || [];
    const error = result.error;
    
    if (error) {
      throw new Error(`Failed to fetch user jobs: ${error.message}`);
    }
    
    // Use explicit casting to TranscriptionRecord type
    return data.map(record => mapToTranscriptionJob(record));
  } catch (error) {
    console.error('Error fetching user transcription jobs:', error);
    throw error;
  }
}
