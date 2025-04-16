
import React from "react";
import { Button } from "@/components/ui/button";
import { FileSymlink, RefreshCw } from "lucide-react";
import { TranscriptionJob } from "@/lib/api/types/transcription";

interface SessionActionHeaderProps {
  selectedModelId: string | null;
  selectedJob: TranscriptionJob | null;
  handlePublishDialogOpen: () => void;
  refreshJobs?: () => void;
}

const SessionActionHeader: React.FC<SessionActionHeaderProps> = ({
  selectedModelId,
  selectedJob,
  handlePublishDialogOpen,
  refreshJobs
}) => {
  return (
    <div className="flex justify-end mb-2 gap-2">
      {refreshJobs && (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={refreshJobs}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Jobs
        </Button>
      )}
      
      <Button 
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={handlePublishDialogOpen}
        disabled={!selectedModelId && !selectedJob}
      >
        <FileSymlink className="h-4 w-4" />
        {selectedModelId ? 'Publish Selected to Brightcove' : 'Publish to Brightcove'}
      </Button>
    </div>
  );
};

export default SessionActionHeader;
