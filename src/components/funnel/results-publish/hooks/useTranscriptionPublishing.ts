
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLogsStore } from "@/lib/useLogsStore";
import { 
  addCaptionToBrightcove, 
  fetchBrightcoveKeys, 
  getBrightcoveAuthToken 
} from "@/lib/api";

export const useTranscriptionPublishing = (sessionId: string | undefined) => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const { toast } = useToast();
  const { startTimedLog, addLog } = useLogsStore();

  const publishCaption = async (
    videoId: string,
    selectedTranscription: string | null, 
    selectedModel: string | null,
    latestResults: Record<string, any>
  ) => {
    if (!selectedTranscription || !videoId || !sessionId || !selectedModel) {
      toast({
        title: "Missing Information",
        description: "Please select a transcription, enter a video ID, and ensure the session is valid.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsPublishing(true);
      const publishLog = startTimedLog("Caption Publishing", "info", "Brightcove");
      
      publishLog.update(`Preparing caption for video ID: ${videoId}`);
      
      const credentialsLog = startTimedLog("Brightcove Authentication", "info", "Brightcove API");
      
      let brightcoveKeys;
      try {
        brightcoveKeys = await fetchBrightcoveKeys();
        credentialsLog.update("Retrieving Brightcove auth token...");
        
        const authToken = await getBrightcoveAuthToken(
          brightcoveKeys.brightcove_client_id,
          brightcoveKeys.brightcove_client_secret
        );
        
        credentialsLog.complete("Brightcove authentication successful", 
          `Account ID: ${brightcoveKeys.brightcove_account_id} | Token obtained`);
        
        publishLog.update(`Adding caption to Brightcove video ID: ${videoId}`);
        
        const selectedModelJob = latestResults[selectedModel];
        const modelId = selectedModelJob?.id || null;
        
        const result = await addCaptionToBrightcove(
          videoId,
          sessionId,
          authToken,
          modelId,
          selectedModel
        );
        
        publishLog.complete(
          "Caption published successfully", 
          `Video ID: ${videoId} | Language: Arabic`
        );
        
        toast({
          title: "Caption Published",
          description: "Your caption has been successfully published to the Brightcove video.",
        });
        
        setPublishDialogOpen(false);
      } catch (error) {
        credentialsLog.error("Brightcove authentication failed", error instanceof Error ? error.message : String(error));
        publishLog.error("Caption publishing failed", error instanceof Error ? error.message : String(error));
        throw error;
      }
    } catch (error) {
      console.error("Error publishing caption:", error);
      addLog(`Error publishing caption`, "error", {
        details: error instanceof Error ? error.message : String(error),
        source: "Brightcove"
      });
      
      toast({
        title: "Publishing Failed",
        description: "There was a problem publishing your caption.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    isPublishing,
    setIsPublishing,
    publishDialogOpen,
    setPublishDialogOpen,
    publishCaption
  };
};
