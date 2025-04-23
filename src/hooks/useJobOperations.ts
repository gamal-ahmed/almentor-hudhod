
import { useState } from "react";
import { createTranscriptionJob } from "@/lib/api";
import { TranscriptionJob } from "@/components/session/types/transcription";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
    if (!sessionId) {
      toast({
        title: "Cannot retry transcription",
        description: "Missing session ID",
        variant: "destructive",
      });
      return;
    }
    
    setIsRetrying({...isRetrying, [job.id]: true});
    
    try {
      // Get signed URL for the file
      if (!job.file_path) {
        throw new Error("Missing file path");
      }
      
      // Create signed URL if it's a storage file path
      let fileUrl = job.file_path;
      if (!fileUrl.startsWith('http')) {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('transcriptions')
          .createSignedUrl(job.file_path, 3600); // 1 hour expiry
          
        if (signedUrlError || !signedUrlData?.signedUrl) {
          throw new Error(`Failed to access audio file: ${signedUrlError?.message || 'File not found'}`);
        }
        
        fileUrl = signedUrlData.signedUrl;
      }
      
      // Fetch the file using the signed URL
      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch audio file: ${fileResponse.statusText}`);
      }
      
      const fileBlob = await fileResponse.blob();
      const fileName = `retry-${job.id}${getFileExtension(job.file_path)}`;
      const file = new File([fileBlob], fileName, { type: fileBlob.type || 'audio/mpeg' });
      
      addLog(`Retrying ${job.model} transcription for session ${sessionId}`, "info", {
        source: job.model,
        details: `File: ${fileName}, Size: ${file.size} bytes`
      });
      
      const result = await createTranscriptionJob(
        file,
        job.model as any,
        job.result?.prompt || "Please preserve all English words exactly as spoken",
        sessionId
      );
      
      toast({
        title: "Transcription job restarted",
        description: `Started new ${getModelDisplayName(job.model)} transcription job`,
      });
      
      addLog(`Created new ${job.model} transcription job`, "success", {
        source: job.model,
        jobId: result.jobId
      });
    } catch (error) {
      console.error("Error retrying transcription job:", error);
      addLog(`Error retrying ${job.model} transcription: ${error instanceof Error ? error.message : String(error)}`, "error", {
        source: job.model,
        details: error instanceof Error ? error.stack : undefined
      });
      
      toast({
        title: "Error retrying transcription",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsRetrying({...isRetrying, [job.id]: false});
    }
  };
  
  // Helper function to get the file extension
  const getFileExtension = (filePath: string): string => {
    const match = filePath.match(/\.[0-9a-z]+$/i);
    return match ? match[0] : '.mp3';
  };
  
  // Helper function to get model display name
  const getModelDisplayName = (model: string): string => {
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
    handleMarkAsAccepted,
    handleRetryJob,
    isRetrying
  };
}
