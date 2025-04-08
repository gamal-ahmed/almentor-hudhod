
import { useState } from "react";
import { useLogsStore } from "@/lib/useLogsStore";
import { TranscriptionJob } from "@/lib/api/types/transcription";
import { getSessionTranscriptionJobs } from "@/lib/api";

export function useSessionJobs(sessionId?: string) {
  const [sessionJobs, setSessionJobs] = useState<TranscriptionJob[]>([]);
  const [loadedSessionId, setLoadedSessionId] = useState<string | null>(null);
  const { addLog } = useLogsStore();

  const refreshJobs = async () => {
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
  };

  return {
    sessionJobs,
    setSessionJobs,
    loadedSessionId,
    setLoadedSessionId,
    refreshJobs,
    addLog
  };
}
