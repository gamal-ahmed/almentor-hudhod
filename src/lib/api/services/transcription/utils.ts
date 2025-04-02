
import { TranscriptionJob, TranscriptionRecord } from "../../types/transcription";
import { Json } from "@/integrations/supabase/types";

// Helper function to convert database record to TranscriptionJob with proper types
export function mapToTranscriptionJob(record: TranscriptionRecord): TranscriptionJob {
  // Ensure result is of the correct type
  let typedResult: TranscriptionJob['result'] = {};
  
  if (record.result) {
    // If result is a string (which may happen from database), try to parse it
    if (typeof record.result === 'string') {
      try {
        const parsed = JSON.parse(record.result);
        typedResult = parsed;
      } catch {
        // If parsing fails, use an empty object with the string as vttContent
        typedResult = { vttContent: record.result as string };
      }
    } else if (typeof record.result === 'object') {
      // If it's already an object, use it directly
      typedResult = record.result as TranscriptionJob['result'];
    }
  }
  
  return {
    id: record.id || '',
    status: record.status as 'pending' | 'processing' | 'completed' | 'failed',
    model: record.model,
    created_at: record.created_at || new Date().toISOString(),
    updated_at: record.updated_at || new Date().toISOString(),
    status_message: record.status_message || '',
    error: record.error,
    result: typedResult,
    file_path: record.file_path,
    user_id: record.user_id,
    session_id: record.session_id,
    vtt_file_url: record.vtt_file_url
  };
}
