
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PublishDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  videoId: string;
  selectedModel: string | null;
  selectedTranscription: string | null;
  isPublishing: boolean;
  onPublish: () => void;
}

const PublishDialog: React.FC<PublishDialogProps> = ({
  open,
  setOpen,
  videoId,
  selectedModel,
  selectedTranscription,
  isPublishing,
  onPublish,
}) => {
  const getModelDisplayName = (model: string | null) => {
    if (!model) return "";
    return model === "openai" 
      ? "OpenAI Whisper" 
      : model === "gemini-2.0-flash" 
        ? "Gemini 2.0 Flash" 
        : "Microsoft Phi-4";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Publishing</DialogTitle>
          <DialogDescription>
            You are about to publish a caption to Brightcove video ID: {videoId}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md text-sm">
            <p className="font-medium mb-1">Publication Details:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Video ID: {videoId}</li>
              <li>Language: Arabic</li>
              <li>Transcription model: {getModelDisplayName(selectedModel)}</li>
              <li>Caption length: {selectedTranscription?.length || 0} characters</li>
            </ul>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={onPublish} 
            disabled={isPublishing}
          >
            {isPublishing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              "Confirm Publication"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PublishDialog;
