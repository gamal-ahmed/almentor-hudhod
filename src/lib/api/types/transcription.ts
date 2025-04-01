
import { Json } from "@/integrations/supabase/types";

// Define types for transcription records
export interface TranscriptionRecord {
  model: string;
  file_path: string;
  status: string;
  session_id?: string;
  error?: string;
  result?: Json;
  status_message?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  id?: string;
  vtt_file_url?: string;
}

// Define a union type for all possible job statuses
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Define type for transcription job response
export interface TranscriptionJob {
  id: string;
  status: JobStatus;
  model: string;
  created_at: string;
  updated_at: string;
  status_message: string;
  error?: string;
  result?: { 
    vttContent: string; 
    text: string; 
    prompt: string;
  } | Json;
  file_path: string;
  user_id?: string;
  session_id?: string;
  vtt_file_url?: string;
}
