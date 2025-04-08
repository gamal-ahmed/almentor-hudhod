
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TranscriptionJob, TranscriptionJobListProps } from "./types/transcription";
import TranscriptionJobItem from "./components/TranscriptionJobItem";
import PollingIndicator from "./components/PollingIndicator";
import EmptyJobList from "./components/EmptyJobList";

const TranscriptionJobList: React.FC<TranscriptionJobListProps> = ({
  jobs,
  selectedJob,
  comparisonMode,
  jobsToCompare,
  onSelectJob,
  isJobSelectedForComparison,
  selectedModelId,
  acceptedModelId,
  onMarkAsAccepted,
  isPolling = false
}) => {
  if (!jobs || jobs.length === 0) {
    return <EmptyJobList />;
  }

  return (
    <>
      <PollingIndicator isPolling={isPolling} />
      
      <ScrollArea className="h-[500px] pr-4 -mr-4">
        <div className="space-y-3">
          {jobs.map((job) => {
            const isSelected = selectedModelId === job.id;
            const isAccepted = acceptedModelId === job.id;
            const isComparisonSelected = selectedJob?.id === job.id && !comparisonMode ? true : isJobSelectedForComparison(job.id);
            
            return (
              <TranscriptionJobItem
                key={job.id}
                job={job}
                isSelected={isSelected}
                isAccepted={isAccepted}
                isComparisonSelected={isComparisonSelected}
                isPolling={isPolling}
                onSelectJob={onSelectJob}
                onMarkAsAccepted={onMarkAsAccepted}
              />
            );
          })}
        </div>
      </ScrollArea>
    </>
  );
};

export default TranscriptionJobList;
