
import { TranscriptionJob, TranscriptionRecord } from "../../types/transcription";

// Helper function to convert database record to TranscriptionJob with proper types
export function mapToTranscriptionJob(record: TranscriptionRecord): TranscriptionJob {
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
