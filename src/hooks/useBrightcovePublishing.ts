
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLogsStore } from "@/lib/useLogsStore";
import { TranscriptionJob } from "@/lib/api/types/transcription";
import { getBrightcoveAuthToken, addCaptionToBrightcove, fetchBrightcoveKeys } from "@/lib/api";
import { getModelDisplayName } from "@/utils/transcriptionUtils";

export function useBrightcovePublishing(sessionId: string | undefined, selectedJob: TranscriptionJob | null, selectedModelId: string | null, sessionJobs: TranscriptionJob[]) {
  const [videoId, setVideoId] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  
  const { toast } = useToast();
  const { addLog } = useLogsStore();
  
  const handlePublishDialogOpen = () => {
    setPublishDialogOpen(true);
  };

  const publishToBrightcove = async () => {
    const jobToPublish = selectedModelId
      ? sessionJobs.find(job => job.id === selectedModelId) || selectedJob
      : selectedJob;
      
    if (!jobToPublish) {
      toast({
        title: "Missing Information",
        description: "Please select a transcription to publish.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsPublishing(true);
      
      const brightcoveKeys = await fetchBrightcoveKeys();
      
      const authToken = await getBrightcoveAuthToken(
        brightcoveKeys.brightcove_client_id,
        brightcoveKeys.brightcove_client_secret
      );
      
      await addCaptionToBrightcove(
        videoId,
        String(sessionId),
        authToken,
        jobToPublish.id,
        jobToPublish.model
      );
      
      addLog(`Published caption to Brightcove video ID: ${videoId}`, "info", {
        source: "SessionDetails",
        details: `Model: ${getModelDisplayName(jobToPublish.model)}`
      });
      
      toast({
        title: "Publishing Successful",
        description: "Caption has been published to Brightcove",
      });
      
      setPublishDialogOpen(false);
      setVideoId('');
    } catch (error) {
      console.error("Error publishing to Brightcove:", error);
      
      toast({
        title: "Publishing Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };
  
  return {
    videoId,
    setVideoId,
    isPublishing,
    publishDialogOpen,
    setPublishDialogOpen,
    handlePublishDialogOpen,
    publishToBrightcove
  };
}
