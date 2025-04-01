
import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { CopyIcon, Download, FileSymlink } from "lucide-react";
import TranscriptionCard from "@/components/TranscriptionCard";
import AudioPlayer from "@/components/AudioPlayer";
import PublishDialog from "@/components/session/PublishDialog";

interface SingleJobViewProps {
  selectedJob: any;
  audioUrl: string | null;
  extractVttContent: (job: any) => string;
  getModelDisplayName: (model: string) => string;
  onExport: (job: any) => void;
  onSave: (job: any) => void;
}

const SingleJobView: React.FC<SingleJobViewProps> = ({
  selectedJob,
  audioUrl,
  extractVttContent,
  getModelDisplayName,
  onExport,
  onSave
}) => {
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [videoId, setVideoId] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublishToBrightcove = () => {
    setPublishDialogOpen(true);
  };

  const publishToBrightcove = async () => {
    setIsPublishing(true);
    try {
      // The actual implementation will call the parent component's publishToBrightcove method
      // This is just a placeholder for now
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setPublishDialogOpen(false);
      setVideoId('');
    } catch (error) {
      console.error("Error publishing to Brightcove:", error);
    } finally {
      setIsPublishing(false);
    }
  };

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
        modelName={getModelDisplayName(selectedJob.model)}
        vttContent={extractVttContent(selectedJob)}
        prompt={selectedJob.result?.prompt || ""}
        isSelected={true}
        audioSrc={audioUrl}
        showExportOptions={true}
        onExport={() => onExport(selectedJob)}
        onSave={() => onSave(selectedJob)}
        onPublish={handlePublishToBrightcove} // Add the handler for publishing
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
