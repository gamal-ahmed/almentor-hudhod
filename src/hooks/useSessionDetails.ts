
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAudioUrl } from "@/hooks/useAudioUrl";
import { useSessionJobs } from "@/hooks/useSessionJobs";
import { useSelectedJob } from "@/hooks/useSelectedJob";
import { useSessionModelIds } from "@/hooks/useSessionModelIds";
import { TranscriptionJob } from "@/lib/api/types/transcription";
import { JobUpdateStatus } from "@/components/transcription/types";

export type ExportFormat = 'vtt' | 'srt' | 'text' | 'json';

export function useSessionDetails(sessionId?: string) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Use the extracted hooks
  const { 
    sessionJobs, 
    setSessionJobs, 
    loadedSessionId,
    setLoadedSessionId,
    refreshJobs,
    addLog,
    isPolling,
    jobsUpdated
  } = useSessionJobs(sessionId);
  
  const {
    selectedJob,
    setSelectedJob,
    selectedTranscriptionUrl,
    setSelectedTranscriptionUrl,
    saveEditedTranscription
  } = useSelectedJob(sessionJobs, jobsUpdated);
  
  const {
    selectedModelId,
    setSelectedModelId,
    acceptedModelId,
    setAcceptedModelId
  } = useSessionModelIds(sessionId, loadedSessionId, sessionJobs, selectedJob, setSelectedJob);
  
  const { audioUrl } = useAudioUrl(sessionId, loadedSessionId, addLog);

  // Centralized fetch process
  const fetchSessionDetails = async () => {
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
      
      await refreshJobs();
    } catch (error) {
      console.error("Error fetching session details:", error);
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
    fetchSessionDetails();
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
    refreshJobs: fetchSessionDetails,
    addLog,
    isPolling,
    jobsUpdated,
    saveEditedTranscription
  };
}
