
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
    vttContent?: string; 
    text?: string; 
    prompt?: string;
  } | { [key: string]: Json } | Json[];
  file_path: string;
  user_id?: string;
  session_id?: string;
  vtt_file_url?: string;
}

// Define type for transcription session
export interface TranscriptionSession {
  id: string;
  user_id: string;
  created_at: string;
  last_updated: string;
  audio_file_name?: string;
  selected_models: string[];
  selected_model?: string;
  selected_model_id?: string | null;
  selected_transcription?: string | null;
  selected_transcription_url?: string | null;
  video_id?: string | null;
  vtt_file_url?: string | null;
  transcriptions: Json;
}
