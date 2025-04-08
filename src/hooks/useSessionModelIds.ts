
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TranscriptionJob } from "@/lib/api/types/transcription";

export function useSessionModelIds(
  sessionId?: string,
  loadedSessionId: string | null = null,
  sessionJobs: TranscriptionJob[] = [],
  selectedJob: TranscriptionJob | null = null,
  setSelectedJob: (job: TranscriptionJob | null) => void = () => {}
) {
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [acceptedModelId, setAcceptedModelId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      const identifier = sessionId || loadedSessionId;
      if (!identifier || identifier === 'null' || identifier === 'undefined' || sessionJobs.length === 0) {
        return;
      }

      try {
        // Get session details to determine selected and accepted models
        const { data: sessionData, error: sessionDataError } = await supabase
          .from('transcription_sessions')
          .select('selected_model, accepted_model_id, selected_transcription_url')
          .eq('id', identifier)
          .single();
          
        if (!sessionDataError && sessionData) {
          if (sessionData && 
              'accepted_model_id' in sessionData && 
              sessionData.accepted_model_id !== null && 
              typeof sessionData.accepted_model_id === 'string') {
              
            const modelId = sessionData.accepted_model_id;
            setSelectedModelId(modelId);
            
            const selectedJob = sessionJobs.find(job => job.id === modelId);
            if (selectedJob) {
              setSelectedJob(selectedJob);
            }
          }
          
          if (sessionData && 
              'accepted_model_id' in sessionData && 
              sessionData.accepted_model_id !== null && 
              typeof sessionData.accepted_model_id === 'string') {
            
            setAcceptedModelId(sessionData.accepted_model_id);
          }
        }
      } catch (error) {
        console.error("Error handling session data:", error);
      }
    };

    fetchSessionData();
  }, [sessionId, loadedSessionId, sessionJobs, selectedJob]);

  return {
    selectedModelId,
    setSelectedModelId,
    acceptedModelId,
    setAcceptedModelId
  };
}
