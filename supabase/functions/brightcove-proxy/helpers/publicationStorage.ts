
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

// Helper to store a Brightcove publication record in the database
export async function storePublicationRecord(
  supabaseUrl: string,
  supabaseKey: string,
  sessionId: string,
  videoId: string,
  modelId: string | null,
  modelName: string,
  transcriptionUrl: string | null,
  brightcoveResponse: any
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Try to insert the record directly via the REST API
    const { error } = await supabase
      .from('brightcove_publications')
      .insert({
        session_id: sessionId,
        video_id: videoId,
        model_id: modelId,
        model_name: modelName,
        transcription_url: transcriptionUrl,
        brightcove_response: brightcoveResponse,
        is_published: true
      });
      
    return { success: !error, error };
  } catch (error) {
    console.error('Error storing publication record:', error);
    return { success: false, error };
  }
}
