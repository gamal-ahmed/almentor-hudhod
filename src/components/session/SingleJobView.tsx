
import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { CopyIcon, Download, FileSymlink } from "lucide-react";
import TranscriptionCard from "@/components/TranscriptionCard";
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

    const vttContent = extractVttContent(selectedJob);
    if (!vttContent) {
      toast({
        title: "No Content",
        description: "No transcription content to publish",
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

      // Publish caption to Brightcove using Ingest API
      publishLog.update(`Adding caption to Brightcove video ID: ${videoId} via Ingest API`);
      const result = await addCaptionToBrightcove(
        videoId,
        vttContent,
        'ar', // Language code (Arabic)
        'Arabic', // Language label
        brightcoveKeys.brightcove_account_id,
        authToken
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

  return (
    <div className="space-y-4">
      {/* Session-level actions */}
      <div className="flex justify-end">
        <Button 
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={handlePublishToBrightcove}
        >
          <FileSymlink className="h-4 w-4" />
          Publish to Brightcove
        </Button>
      </div>
      
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
        modelName={getModelDisplayName(selectedJob.model)}
        vttContent={extractVttContent(selectedJob)}
        prompt={selectedJob.result?.prompt || ""}
        isSelected={true}
        audioSrc={audioUrl}
        showExportOptions={true}
        onExport={() => onExport(selectedJob)}
        onAccept={() => onAccept(selectedJob)}
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
