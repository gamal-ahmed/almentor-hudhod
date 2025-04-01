
export interface TranscriptionJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | string;
  model: string;
  created_at: string;
  updated_at: string;
  status_message: string;
  error?: string;
  result?: { 
    vttContent: string; 
    text: string; 
    prompt: string;
  } | any;
  vtt_file_url?: string;
  file_path?: string;
  user_id?: string;
}
