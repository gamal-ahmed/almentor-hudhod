
import { baseService } from "../baseService";
import { mapToTranscriptionJob } from "./utils";
import { TranscriptionJob } from "../../types/transcription";

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
    return (data || []).map(record => mapToTranscriptionJob(record));
  } catch (error) {
    console.error('Error fetching user transcription jobs:', error);
    throw error;
  }
}
