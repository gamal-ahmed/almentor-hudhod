
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { FileSymlink } from "lucide-react";
import { TranscriptionCard } from "@/components/transcription";
import AudioPlayer from "@/components/AudioPlayer";
import PublishDialog from "@/components/session/PublishDialog";
import { useToast } from "@/hooks/use-toast";
import { 
  getBrightcoveAuthToken, 
  addCaptionToBrightcove, 
  fetchBrightcoveKeys
} from "@/lib/api";
import { useLogsStore } from "@/lib/useLogsStore";

interface SingleJobViewProps {
  selectedJob: any;
  audioUrl: string | null;
  extractVttContent: (job: any) => string;
  getModelDisplayName: (model: string) => string;
  onExport: (job: any) => void;
  onAccept: (job: any) => void;
}

const SingleJobView: React.FC<SingleJobViewProps> = ({
  selectedJob,
  audioUrl,
  extractVttContent,
  getModelDisplayName,
  onExport,
  onAccept
}) => {
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [videoId, setVideoId] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();
  const { addLog, startTimedLog } = useLogsStore();

  const handlePublishToBrightcove = () => {
    setPublishDialogOpen(true);
  };

  const publishToBrightcove = async () => {
    if (!selectedJob || !videoId) {
      toast({
        title: "Missing Information",
        description: "Please provide a valid Video ID",
        variant: "destructive",
      });
      return;
    }

    setIsPublishing(true);
    const publishLog = startTimedLog("Caption Publishing", "info", "Brightcove");
    
    try {
      publishLog.update(`Preparing caption for video ID: ${videoId}`);
      
      // Get Brightcove credentials from Supabase
      const brightcoveKeys = await fetchBrightcoveKeys();
      
      // Get authorization token
      publishLog.update("Retrieving Brightcove auth token...");
      const authToken = await getBrightcoveAuthToken(
        brightcoveKeys.brightcove_client_id,
        brightcoveKeys.brightcove_client_secret
      );

      if (!selectedJob.session_id) {
        throw new Error("Transcription job is not associated with a session");
      }

      // Use the simplified API with session ID and model information
      publishLog.update(`Adding caption to Brightcove video ID: ${videoId} via Ingest API`);
      const result = await addCaptionToBrightcove(
        videoId,
        selectedJob.session_id,
        authToken,
        selectedJob.id,
        selectedJob.model
      );
      
      publishLog.complete(
        "Caption ingestion job started successfully", 
        `Video ID: ${videoId} | Ingest Job ID: ${result.ingestJobId}`
      );
      
      toast({
        title: "Success",
        description: "Caption ingestion job started successfully. The caption will be available on the video shortly.",
      });
      
      setPublishDialogOpen(false);
      setVideoId('');
    } catch (error) {
      console.error("Error publishing to Brightcove:", error);
      
      publishLog.error(
        "Caption publishing failed", 
        error instanceof Error ? error.message : String(error)
      );
      
      toast({
        title: "Publishing Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Safely extract VTT content from the job
  const vttContent = extractVttContent(selectedJob);
  const prompt = selectedJob?.result?.prompt || selectedJob?.prompt || "";
  const modelName = getModelDisplayName(selectedJob?.model || "");

  return (
    <div className="space-y-4">
      {/* Audio player section */}
      {audioUrl && (
        <Card className="shadow-soft border-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Audio Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <AudioPlayer src={audioUrl} />
          </CardContent>
        </Card>
      )}
      
      {/* Transcription card */}
      <TranscriptionCard
        modelName={modelName}
        vttContent={vttContent}
        prompt={prompt}
        isSelected={true}
        audioSrc={audioUrl}
        showExportOptions={true}
        onExport={() => onExport(selectedJob)}
        onAccept={() => onAccept(selectedJob)}
        showAudioControls={true}
      />

      {/* Publish dialog */}
      <PublishDialog 
        videoId={videoId}
        setVideoId={setVideoId}
        isPublishing={isPublishing}
        publishToBrightcove={publishToBrightcove}
        selectedJob={selectedJob}
        getModelDisplayName={getModelDisplayName}
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
      />
    </div>
  );
};

export default SingleJobView;
