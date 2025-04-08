
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAudioUrl(
  sessionId?: string, 
  loadedSessionId: string | null = null,
  addLog: (message: string, type: "info" | "error" | "success" | "warning") => void = () => {}
) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchAudioUrl = async () => {
      const identifier = sessionId || loadedSessionId;
      if (!identifier || identifier === 'null' || identifier === 'undefined') {
        return;
      }

      try {
        const { data: sessionData, error: sessionError } = await supabase
          .from('transcription_sessions')
          .select('audio_file_name')
          .eq('id', identifier)
          .single();
          
        if (!sessionError && sessionData?.audio_file_name) {
          // Create signed URL for audio access
          const { data, error } = await supabase.storage
            .from('transcriptions')
            .createSignedUrl(`sessions/${identifier}/${sessionData.audio_file_name}`, 3600);
            
          if (!error && data) {
            setAudioUrl(data.signedUrl);
          } else {
            console.error("Error creating signed URL:", error);
            addLog(`Error creating signed URL for audio: ${error?.message || "Unknown error"}`, "error");
          }
        } else {
          console.error("Error fetching session audio details:", sessionError);
          addLog(`Error fetching audio details: ${sessionError?.message || "Unknown error"}`, "error");
        }
      } catch (error) {
        console.error("Error fetching audio URL:", error);
        addLog(`Error in audio URL fetch: ${error instanceof Error ? error.message : String(error)}`, "error");
      }
    };

    fetchAudioUrl();
  }, [sessionId, loadedSessionId]);

  return { audioUrl };
}
