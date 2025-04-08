
import { useState, useEffect } from "react";
import { TranscriptionJob } from "@/lib/api/types/transcription";
import { JobUpdateStatus } from "@/components/transcription/types";

export function useSelectedJob(
  sessionJobs: TranscriptionJob[],
  jobsUpdated: JobUpdateStatus[] = []
) {
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

  // Auto-select completed jobs when they finish
  useEffect(() => {
    if (jobsUpdated.length > 0) {
      // Find newly completed jobs
      const newlyCompleted = jobsUpdated.filter(update => 
        update.status === 'completed' && 
        update.previousStatus !== 'completed'
      );
      
      if (newlyCompleted.length > 0) {
        // Find the first newly completed job in the session jobs
        const firstCompletedId = newlyCompleted[0].id;
        const completedJob = sessionJobs.find(job => job.id === firstCompletedId);
        
        if (completedJob) {
          console.log(`Auto-selecting newly completed job: ${completedJob.id} (${completedJob.model})`);
          setSelectedJob(completedJob);
        }
      }
    }
  }, [jobsUpdated, sessionJobs]);

  return {
    selectedJob,
    setSelectedJob,
    selectedTranscriptionUrl,
    setSelectedTranscriptionUrl
  };
}
