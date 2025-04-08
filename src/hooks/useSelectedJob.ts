
import { useState, useEffect } from "react";
import { TranscriptionJob } from "@/lib/api/types/transcription";
import { JobUpdateStatus } from "@/components/transcription/types";
import { saveSelectedTranscription } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from 'uuid';
import { toast as sonnerToast } from "sonner";

export function useSelectedJob(
  sessionJobs: TranscriptionJob[],
  jobsUpdated: JobUpdateStatus[] = []
) {
  const [selectedJob, setSelectedJob] = useState<TranscriptionJob | null>(null);
  const [selectedTranscriptionUrl, setSelectedTranscriptionUrl] = useState<string | null>(null);
  const { toast } = useToast();

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

  // Function to save edited transcription
  const saveEditedTranscription = async (
    sessionId: string | undefined, 
    job: TranscriptionJob, 
    editedVttContent: string
  ) => {
    if (!job || !sessionId) {
      toast({
        title: "Cannot save changes",
        description: "Missing job or session information",
        variant: "destructive"
      });
      return null;
    }

    try {
      // Use Sonner toast for better visibility
      sonnerToast.loading("Saving transcription changes...");

      const fileName = `edited_${job.model}_${uuidv4()}.vtt`;
      
      const result = await saveSelectedTranscription(
        sessionId,
        editedVttContent,
        fileName,
        job.model
      );

      if (result && result.transcriptionUrl) {
        setSelectedTranscriptionUrl(result.transcriptionUrl);
        
        // Update the local job with edited content
        const updatedJob = {
          ...job,
          result: {
            ...job.result,
            vttContent: editedVttContent
          }
        };
        setSelectedJob(updatedJob);
        
        sonnerToast.success("Transcription changes saved successfully");
        
        return result.transcriptionUrl;
      }
      
      return null;
    } catch (error) {
      console.error("Error saving edited transcription:", error);
      
      sonnerToast.error(
        "Error saving changes", 
        { description: error instanceof Error ? error.message : "Unknown error occurred" }
      );
      
      return null;
    }
  };

  return {
    selectedJob,
    setSelectedJob,
    selectedTranscriptionUrl,
    setSelectedTranscriptionUrl,
    saveEditedTranscription
  };
}
