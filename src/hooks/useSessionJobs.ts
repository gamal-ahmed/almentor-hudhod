
import { useState, useEffect, useCallback } from "react";
import { useLogsStore } from "@/lib/useLogsStore";
import { TranscriptionJob } from "@/lib/api/types/transcription";
import { getSessionTranscriptionJobs, checkTranscriptionJobStatus } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { JobUpdateStatus } from "@/components/transcription/types";

export function useSessionJobs(sessionId?: string) {
  const [sessionJobs, setSessionJobs] = useState<TranscriptionJob[]>([]);
  const [loadedSessionId, setLoadedSessionId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [jobsUpdated, setJobsUpdated] = useState<JobUpdateStatus[]>([]);
  const { addLog } = useLogsStore();
  const { toast } = useToast();

  const refreshJobs = useCallback(async () => {
    if (!sessionId || sessionId === 'null' || sessionId === 'undefined') {
      return;
    }

    console.log(`Using session identifier: ${sessionId}`);
    setLoadedSessionId(sessionId);
    
    try {
      // Fetch jobs specifically for this session
      const jobs = await getSessionTranscriptionJobs(sessionId);
      
      if (jobs && jobs.length > 0) {
        console.log(`Found ${jobs.length} jobs for session ${sessionId}`);
        setSessionJobs(jobs);
      } else {
        console.log(`No jobs found for session ${sessionId}`);
        setSessionJobs([]);
      }
    } catch (error) {
      console.error(`Error fetching jobs for session ${sessionId}:`, error);
      addLog(`Error fetching session jobs: ${error instanceof Error ? error.message : String(error)}`, "error");
      throw error;
    }
  }, [sessionId, addLog]);

  // Poll for job status updates
  useEffect(() => {
    if (!sessionJobs.length || !sessionId) return;
    
    const pendingOrProcessingJobs = sessionJobs.filter(
      job => job.status === 'pending' || job.status === 'processing'
    );
    
    if (pendingOrProcessingJobs.length > 0) {
      // Start polling if there are jobs in progress
      setIsPolling(true);
      
      const pollInterval = setInterval(async () => {
        let updatedJobs = [...sessionJobs];
        let hasUpdates = false;
        let statusChanges: JobUpdateStatus[] = [];
        
        for (const job of pendingOrProcessingJobs) {
          try {
            const latestStatus = await checkTranscriptionJobStatus(job.id);
            
            if (latestStatus && (latestStatus.status !== job.status || latestStatus.status_message !== job.status_message)) {
              const jobIndex = updatedJobs.findIndex(j => j.id === job.id);
              
              if (jobIndex !== -1) {
                // Track status change
                statusChanges.push({
                  id: job.id,
                  status: latestStatus.status,
                  previousStatus: job.status,
                  model: job.model
                });
                
                // Update job in our state
                updatedJobs[jobIndex] = {
                  ...updatedJobs[jobIndex],
                  ...latestStatus
                };
                
                hasUpdates = true;
              }
            }
          } catch (error) {
            console.error(`Error checking status for job ${job.id}:`, error);
          }
        }
        
        if (hasUpdates) {
          setSessionJobs(updatedJobs);
          setJobsUpdated(statusChanges);
          
          // Show toast notifications for completed jobs
          statusChanges.forEach(change => {
            if (change.status === 'completed' && change.previousStatus !== 'completed') {
              toast({
                title: "Transcription completed",
                description: `${getModelDisplayName(change.model)} model has finished processing`,
              });
            } else if (change.status === 'failed' && change.previousStatus !== 'failed') {
              toast({
                title: "Transcription failed",
                description: `${getModelDisplayName(change.model)} model encountered an error`,
                variant: "destructive"
              });
            }
          });
        }
        
        // Check if we should stop polling
        const stillHavePendingJobs = updatedJobs.some(
          job => job.status === 'pending' || job.status === 'processing'
        );
        
        if (!stillHavePendingJobs) {
          setIsPolling(false);
          clearInterval(pollInterval);
        }
      }, 5000); // Poll every 5 seconds
      
      return () => {
        clearInterval(pollInterval);
        setIsPolling(false);
      };
    }
  }, [sessionJobs, sessionId, toast]);

  // Helper function for model display names
  const getModelDisplayName = (model: string) => {
    switch (model) {
      case "openai":
        return "OpenAI Whisper";
      case "gemini-2.0-flash":
        return "Gemini 2.0 Flash";
      case "phi4":
        return "Microsoft Phi-4";
      default:
        return model;
    }
  };

  return {
    sessionJobs,
    setSessionJobs,
    loadedSessionId,
    setLoadedSessionId,
    refreshJobs,
    addLog,
    isPolling,
    jobsUpdated
  };
}
