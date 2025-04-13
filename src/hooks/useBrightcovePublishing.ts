
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { addCaptionToBrightcove, getBrightcoveAuthToken, fetchBrightcoveKeys } from '@/lib/api';

export function useBrightcovePublishing() {
  const [videoId, setVideoId] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState<boolean>(false);

  const handlePublishDialogOpen = () => {
    setPublishDialogOpen(true);
  };

  const publishToBrightcove = async (
    videoId: string, 
    sessionId: string, 
    language: string = 'ar'
  ) => {
    setIsPublishing(true);

    try {
      // Get Brightcove credentials
      const keys = await fetchBrightcoveKeys();
      const token = await getBrightcoveAuthToken(
        keys.brightcove_client_id,
        keys.brightcove_client_secret
      );

      // Publish captions
      await addCaptionToBrightcove(
        videoId,
        sessionId,
        token,
        undefined,
        undefined,
        language
      );

      toast({
        title: "Caption Published",
        description: `Caption successfully published to Brightcove video ${videoId}`,
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Publishing Error",
        description: error.message || "Failed to publish caption to Brightcove",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsPublishing(false);
      setPublishDialogOpen(false);
    }
  };

  return {
    videoId,
    setVideoId,
    isPublishing,
    publishDialogOpen,
    setPublishDialogOpen,
    handlePublishDialogOpen,
    publishToBrightcove,
  };
}
