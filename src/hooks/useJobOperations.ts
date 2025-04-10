
import { useState } from "react";
import { createTranscriptionJob } from "@/lib/api";
import { TranscriptionJob } from "@/components/session/types/transcription";
import { useToast } from "@/hooks/use-toast";

export function useJobOperations(
  sessionId: string | undefined,
  selectedModelId: string | null | undefined,
  setSelectedModelId: (id: string | null) => void,
  acceptedModelId: string | null | undefined,
  setAcceptedModelId: (id: string | null) => void,
  setSelectedJob: (job: TranscriptionJob | null) => void,
  addLog: (message: string, level: string, details?: any) => void
) {
  const [isRetrying, setIsRetrying] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  
  const handleMarkAsAccepted = async (job: TranscriptionJob) => {
    if (!sessionId) return;
    
    try {
      const wasAlreadyAccepted = acceptedModelId === job.id;
      
      if (wasAlreadyAccepted) {
        setAcceptedModelId(null);
        setSelectedModelId(null);
        addLog(`Unaccepted ${job.model} transcription for session ${sessionId}`, "info");
        
        toast({
          title: "Transcription unaccepted",
          description: `Removed ${job.model} as the accepted transcription`,
        });
      } else {
        setAcceptedModelId(job.id);
        setSelectedModelId(job.id);
        setSelectedJob(job);
        addLog(`Accepted ${job.model} transcription for session ${sessionId}`, "info");
        
        toast({
          title: "Transcription accepted",
          description: `${job.model} is now the accepted transcription`,
        });
      }
    } catch (error) {
      console.error("Error marking transcription as accepted:", error);
      addLog(`Error accepting ${job.model} transcription: ${error instanceof Error ? error.message : String(error)}`, "error");
      
      toast({
        title: "Error accepting transcription",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  const handleRetryJob = async (job: TranscriptionJob) => {
    if (!sessionId || !job.file_path) {
      toast({
        title: "Cannot retry transcription",
        description: "Missing session ID or file path",
        variant: "destructive",
      });
      return;
    }
    
    setIsRetrying({...isRetrying, [job.id]: true});
    
    try {
      // Get the file from storage (this would require a function that fetches from storage)
      const fileResponse = await fetch(job.file_path);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch audio file: ${fileResponse.statusText}`);
      }
      
      const fileBlob = await fileResponse.blob();
      const file = new File([fileBlob], `retry-${job.id}.mp3`, { type: 'audio/mpeg' });
      
      // Create a new transcription job with the same model
      addLog(`Retrying ${job.model} transcription for session ${sessionId}`, "info");
      
      const result = await createTranscriptionJob(
        file,
        job.model as any,
        job.result?.prompt || "Please preserve all English words exactly as spoken",
        sessionId
      );
      
      toast({
        title: "Transcription job restarted",
        description: `Started new ${job.model} transcription job`,
      });
      
      addLog(`Created new ${job.model} transcription job with ID ${result.jobId}`, "success");
    } catch (error) {
      console.error("Error retrying transcription job:", error);
      addLog(`Error retrying ${job.model} transcription: ${error instanceof Error ? error.message : String(error)}`, "error");
      
      toast({
        title: "Error retrying transcription",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsRetrying({...isRetrying, [job.id]: false});
    }
  };
  
  return {
    handleMarkAsAccepted,
    handleRetryJob,
    isRetrying
  };
}
