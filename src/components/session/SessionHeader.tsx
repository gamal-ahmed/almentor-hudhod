
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowLeftCircle, LayoutPanelLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface SessionHeaderProps {
  sessionId: string | undefined;
  loading: boolean;
  comparisonMode: boolean;
  toggleComparisonMode: () => void;
  handleRefreshJobs: () => void;
  selectedJob: any;
}

const SessionHeader: React.FC<SessionHeaderProps> = ({
  sessionId,
  loading,
  comparisonMode,
  toggleComparisonMode,
  handleRefreshJobs,
  selectedJob
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <Button asChild variant="outline" size="sm">
        <Link to="/app" className="flex items-center gap-1.5">
          <ArrowLeftCircle className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>
      
      <div className="flex items-center gap-2">
        <Button
          variant={comparisonMode ? "default" : "outline"}
          size="sm"
          onClick={toggleComparisonMode}
          className="flex items-center gap-1.5"
        >
          <LayoutPanelLeft className="h-4 w-4" />
          {comparisonMode ? "Exit Comparison" : "Compare Models"}
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefreshJobs}
          disabled={loading}
          className="flex items-center gap-1.5"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Jobs
        </Button>
      </div>
    </div>
  );
};

export default SessionHeader;
