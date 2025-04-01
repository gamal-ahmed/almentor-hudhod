
import React from "react";
import { 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Video, FileSymlink } from "lucide-react";

interface PublishDialogProps {
  videoId: string;
  setVideoId: (id: string) => void;
  isPublishing: boolean;
  publishToBrightcove: () => void;
  selectedJob: any;
  getModelDisplayName: (model: string) => string;
}

const PublishDialog: React.FC<PublishDialogProps> = ({
  videoId,
  setVideoId,
  isPublishing,
  publishToBrightcove,
  selectedJob,
  getModelDisplayName
}) => {
  return (
    <DialogContent className="shadow-soft border-2">
      <DialogHeader>
        <DialogTitle className="text-xl flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          Publish to Brightcove
        </DialogTitle>
        <DialogDescription>
          Enter the Brightcove video ID to publish the selected transcription as a caption.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="videoId" className="font-medium">Brightcove Video ID</Label>
          <Input 
            id="videoId"
            value={videoId}
            onChange={(e) => setVideoId(e.target.value)}
            placeholder="e.g. 1234567890"
            className="shadow-inner-soft focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="space-y-2">
          <Label className="font-medium">Selected Transcription</Label>
          <div className="p-3 bg-muted rounded-md text-sm border">
            <span className="font-medium">{selectedJob && getModelDisplayName(selectedJob.model)}</span>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => {}}>
          Cancel
        </Button>
        <Button 
          onClick={publishToBrightcove} 
          disabled={isPublishing || !videoId}
          className="gap-1.5"
        >
          {isPublishing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <FileSymlink className="h-4 w-4" />
              Publish Caption
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default PublishDialog;
