
import React from "react";
import { Button } from "@/components/ui/button";
import { Columns, XCircle } from "lucide-react";

interface ComparisonModeHeaderProps {
  jobsToCompare: any[];
  toggleComparisonMode: () => void;
  startComparison: () => void;
}

const ComparisonModeHeader: React.FC<ComparisonModeHeaderProps> = ({
  jobsToCompare,
  toggleComparisonMode,
  startComparison,
}) => {
  return (
    <div className="bg-accent/20 rounded-md p-3 mb-4 flex flex-col space-y-2 border border-accent">
      <p className="text-sm font-medium">Comparison Mode</p>
      <p className="text-xs text-muted-foreground">
        Selected: {jobsToCompare.length} transcription{jobsToCompare.length !== 1 ? 's' : ''}
      </p>
      <div className="flex gap-2 mt-2">
        <Button 
          size="sm" 
          variant="default"
          className="text-xs h-8 flex items-center gap-1.5 w-full"
          onClick={startComparison}
          disabled={jobsToCompare.length < 2}
        >
          <Columns className="h-3.5 w-3.5" />
          Compare Selected
        </Button>
        <Button 
          size="sm" 
          variant="outline"
          className="text-xs h-8 flex items-center gap-1.5"
          onClick={toggleComparisonMode}
        >
          <XCircle className="h-3.5 w-3.5" />
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default ComparisonModeHeader;
