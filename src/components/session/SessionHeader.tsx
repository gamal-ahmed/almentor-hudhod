
import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, Split, Send, Loader2, XCircle } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

interface SessionHeaderProps {
  sessionId: string | undefined;
  loading: boolean;
  comparisonMode: boolean;
  publishDialogOpen: boolean;
  setPublishDialogOpen: (open: boolean) => void;
  selectedJob: any | null;
  handleRefreshJobs: () => void;
  toggleComparisonMode: () => void;
}

const SessionHeader: React.FC<SessionHeaderProps> = ({
  sessionId,
  loading,
  comparisonMode,
  publishDialogOpen,
  setPublishDialogOpen,
  selectedJob,
  handleRefreshJobs,
  toggleComparisonMode,
}) => {
  return (
    <div className="flex items-center justify-between">
      <Button 
        variant="outline" 
        size="sm"
        className="flex items-center gap-1.5 shadow-soft hover-lift"
        asChild
      >
        <Link to="/app">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline" 
          size="sm"
          onClick={handleRefreshJobs}
          className="flex items-center gap-1.5 shadow-soft hover-lift"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh Jobs
        </Button>
        
        <Button
          variant={comparisonMode ? "default" : "outline"}
          size="sm"
          onClick={toggleComparisonMode}
          className="flex items-center gap-1.5 shadow-soft hover-lift"
        >
          {comparisonMode ? (
            <>
              <XCircle className="h-4 w-4" />
              Exit Comparison
            </>
          ) : (
            <>
              <Split className="h-4 w-4" />
              Compare Results
            </>
          )}
        </Button>
        
        {selectedJob && (
          <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="flex items-center gap-1.5 shadow-soft hover-lift"
              >
                <Send className="h-4 w-4" />
                Publish to Brightcove
              </Button>
            </DialogTrigger>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default SessionHeader;
