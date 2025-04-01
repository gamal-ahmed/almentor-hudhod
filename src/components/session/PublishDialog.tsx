
import React from "react";
import { 
  Dialog,
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Video, FileSymlink, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PublishDialogProps {
  videoId: string;
  setVideoId: (id: string) => void;
  isPublishing: boolean;
  publishToBrightcove: () => Promise<void>;
  selectedJob: any;
  getModelDisplayName: (model: string) => string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PublishDialog: React.FC<PublishDialogProps> = ({
  videoId,
  setVideoId,
  isPublishing,
  publishToBrightcove,
  selectedJob,
  getModelDisplayName,
  open,
  onOpenChange
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="shadow-soft border-2 max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Publish Caption to Brightcove
          </DialogTitle>
          <DialogDescription>
            This will publish the selected transcription as a caption to a Brightcove video.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {/* Video ID input section */}
          <div className="space-y-2">
            <Label htmlFor="videoId" className="font-medium">Brightcove Video ID</Label>
            <Input 
              id="videoId"
              value={videoId}
              onChange={(e) => setVideoId(e.target.value)}
              placeholder="e.g. 1234567890"
              className="shadow-inner-soft focus:ring-2 focus:ring-primary/30"
              disabled={isPublishing}
            />
            <p className="text-xs text-muted-foreground">
              Enter the ID of the video where you want to add this caption.
            </p>
          </div>
          
          {/* Selected Transcription info */}
          <div className="space-y-2">
            <Label className="font-medium">Selected Transcription</Label>
            <div className="p-3 bg-muted rounded-md text-sm border flex items-center gap-2">
              <span className="font-medium">{selectedJob && getModelDisplayName(selectedJob.model)}</span>
              <span className="text-xs px-2 py-0.5 bg-primary/10 rounded-full">Arabic</span>
            </div>
          </div>
          
          {/* Information alert */}
          <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-700 dark:text-blue-400" />
            <AlertDescription className="text-sm text-blue-700 dark:text-blue-400">
              This will add a caption track to your video. The caption will be set as Arabic 
              and marked as the default caption track.
            </AlertDescription>
          </Alert>
        </div>
        
        <DialogFooter className="space-x-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isPublishing}
          >
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
    </Dialog>
  );
};

export default PublishDialog;
