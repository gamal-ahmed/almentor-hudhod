
import { useState, useEffect } from "react";
import { TranscriptionJob } from "@/lib/api/types/transcription";

export function useSelectedJob(sessionJobs: TranscriptionJob[]) {
  const [selectedJob, setSelectedJob] = useState<TranscriptionJob | null>(null);
  const [selectedTranscriptionUrl, setSelectedTranscriptionUrl] = useState<string | null>(null);

  // Update selected job when jobs change
  useEffect(() => {
    if (sessionJobs.length > 0 && !selectedJob) {
      const completedJobs = sessionJobs.filter(job => job.status === 'completed');
      if (completedJobs.length > 0) {
        setSelectedJob(completedJobs[0]);
      } else {
        setSelectedJob(sessionJobs[0]);
      }
    }
  }, [sessionJobs, selectedJob]);

  return {
    selectedJob,
    setSelectedJob,
    selectedTranscriptionUrl,
    setSelectedTranscriptionUrl
  };
}
