
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLogsStore } from "@/lib/useLogsStore";
import { supabase } from "@/integrations/supabase/client";
import { TranscriptionJob } from "@/lib/api/types/transcription";
import { getSessionTranscriptionJobs } from "@/lib/api";

export type ExportFormat = 'vtt' | 'srt' | 'text' | 'json';

export function useSessionDetails(sessionId?: string) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessionJobs, setSessionJobs] = useState<TranscriptionJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<TranscriptionJob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedTranscriptionUrl, setSelectedTranscriptionUrl] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loadedSessionId, setLoadedSessionId] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [acceptedModelId, setAcceptedModelId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { addLog } = useLogsStore();
  
  const fetchSessionJobs = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      
      const identifier = sessionId;
      
      if (!identifier || identifier === 'null' || identifier === 'undefined') {
        const errorMessage = "Could not load session details: No valid session ID provided";
        console.error(errorMessage);
        
        toast({
          title: "Missing session identifier",
          description: errorMessage,
          variant: "destructive",
        });
        
        setFetchError(errorMessage);
        setLoading(false);
        
        setTimeout(() => {
          navigate('/app');
        }, 3000);
        
        return;
      }
      
      console.log(`Using session identifier: ${identifier}`);
      
      setLoadedSessionId(identifier);
      
      try {
        const jobs = await getSessionTranscriptionJobs(identifier);
        
        if (jobs && jobs.length > 0) {
          console.log(`Found ${jobs.length} jobs for session ${identifier}`);
          setSessionJobs(jobs);
          
          try {
            const { data: sessionData, error: sessionDataError } = await supabase
              .from('transcription_sessions')
              .select('selected_model, accepted_model_id, accepted_model_id, selected_transcription_url')
              .eq('id', identifier)
              .single();
              
            if (!sessionDataError && sessionData) {
              if (sessionData && 
                  'accepted_model_id' in sessionData && 
                  sessionData.accepted_model_id !== null && 
                  typeof sessionData.accepted_model_id === 'string') {
                  
                const modelId = sessionData.accepted_model_id;
                setSelectedModelId(modelId);
                setSelectedTranscriptionUrl(sessionData.selected_transcription_url);
                const selectedJob = jobs.find(job => job.id === modelId);
                if (selectedJob) {
                  setSelectedJob(selectedJob);
                } else {
                  const completedJobs = jobs.filter(job => job.status === 'completed');
                  if (completedJobs.length > 0) {
                    setSelectedJob(completedJobs[0]);
                  } else if (jobs.length > 0) {
                    setSelectedJob(jobs[0]);
                  }
                }
              } else {
                const completedJobs = jobs.filter(job => job.status === 'completed');
                if (completedJobs.length > 0) {
                  setSelectedJob(completedJobs[0]);
                } else if (jobs.length > 0) {
                  setSelectedJob(jobs[0]);
                }
              }
              
              if (sessionData && 
                  'accepted_model_id' in sessionData && 
                  sessionData.accepted_model_id !== null && 
                  typeof sessionData.accepted_model_id === 'string') {
                
                setAcceptedModelId(sessionData.accepted_model_id);
              }
            } else {
              console.error("Error fetching session data:", sessionDataError);
              
              const completedJobs = jobs.filter(job => job.status === 'completed');
              if (completedJobs.length > 0) {
                setSelectedJob(completedJobs[0]);
              } else if (jobs.length > 0) {
                setSelectedJob(jobs[0]);
              }
            }
          } catch (error) {
            console.error("Error handling session data:", error);
            
            const completedJobs = jobs.filter(job => job.status === 'completed');
            if (completedJobs.length > 0) {
              setSelectedJob(completedJobs[0]);
            } else if (jobs.length > 0) {
              setSelectedJob(jobs[0]);
            }
          }
        } else {
          console.log(`No jobs found for session ${identifier}`);
          setSessionJobs([]);
          setSelectedJob(null);
        }
      } catch (error) {
        console.error(`Error fetching jobs for session ${identifier}:`, error);
        setFetchError(`Error fetching session jobs: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      if (identifier) {
        try {
          const { data: sessionData, error: sessionError } = await supabase
            .from('transcription_sessions')
            .select('audio_file_name')
            .eq('id', identifier)
            .single();
            
          if (!sessionError && sessionData?.audio_file_name) {
            const { data, error } = await supabase.storage
              .from('transcriptions')
              .createSignedUrl(`sessions/${identifier}/${sessionData.audio_file_name}`, 3600);
              
            if (!error && data) {
              setAudioUrl(data.signedUrl);
            }
          }
        } catch (error) {
          console.error("Error fetching audio URL:", error);
        }
      }
    } catch (error) {
      console.error("Error fetching session jobs:", error);
      setFetchError(`Failed to load session data: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: "Error loading session",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionJobs();
  }, [sessionId]);

  return {
    loading,
    sessionJobs,
    selectedJob,
    setSelectedJob,
    audioUrl,
    selectedTranscriptionUrl,
    fetchError,
    loadedSessionId,
    selectedModelId,
    setSelectedModelId,
    acceptedModelId,
    setAcceptedModelId,
    refreshJobs: fetchSessionJobs,
    addLog
  };
}
