
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import TranscriptionJobList from "./TranscriptionJobList";
import SingleJobView from "./SingleJobView";
import ComparisonView from "./ComparisonView";
import { LoadingState, ErrorState, EmptyState } from "./SessionStatusStates";
import { TranscriptionJob } from "@/lib/api/types/transcription";
import { AudioPreview } from "./components";

interface SessionMainContentProps {
  loading: boolean;
  fetchError: string | null;
  sessionJobs: TranscriptionJob[];
  selectedJob: TranscriptionJob | null;
  audioUrl: string | null;
  comparisonMode: boolean;
  viewMode: 'single' | 'compare';
  jobsToCompare: TranscriptionJob[];
  handleSelectJob: (job: TranscriptionJob) => void;
  isJobSelectedForComparison: (id: string) => boolean;
  selectedModelId: string | null;
  acceptedModelId: string | null;
  handleMarkAsAccepted: (job: TranscriptionJob) => void;
  handleRetryJob: (job: TranscriptionJob) => void;
  isPolling: boolean;
  refreshJobs: () => void;
  displaySessionId: string | undefined;
  extractVttContent: (job: TranscriptionJob) => string;
  getModelDisplayName: (model: string) => string;
  handleComparisonExport: (job: TranscriptionJob) => void;
  setViewMode: (mode: 'single' | 'compare') => void;
  handleTextEdit: (job: TranscriptionJob, editedContent: string) => Promise<string | null>;
}

const SessionMainContent: React.FC<SessionMainContentProps> = ({
  loading,
  fetchError,
  sessionJobs,
  selectedJob,
  audioUrl,
  comparisonMode,
  viewMode,
  jobsToCompare,
  handleSelectJob,
  isJobSelectedForComparison,
  selectedModelId,
  acceptedModelId,
  handleMarkAsAccepted,
  handleRetryJob,
  isPolling,
  refreshJobs,
  displaySessionId,
  extractVttContent,
  getModelDisplayName,
  handleComparisonExport,
  setViewMode,
  handleTextEdit
}) => {
  if (loading) {
    return <LoadingState />;
  }

  if (fetchError) {
    return <ErrorState error={fetchError} onRetry={refreshJobs} sessionId={displaySessionId} />;
  }

  if (sessionJobs.length === 0) {
    return <EmptyState onRefresh={refreshJobs} />;
  }

  return (
    <div className="grid md:grid-cols-3 gap-6 mt-4">
      <div className="md:col-span-1">
        <Card className="shadow-soft border-2">
          <CardContent className="p-4">
            <TranscriptionJobList 
              jobs={sessionJobs}
              selectedJob={selectedJob}
              comparisonMode={comparisonMode}
              jobsToCompare={jobsToCompare}
              onSelectJob={handleSelectJob}
              isJobSelectedForComparison={isJobSelectedForComparison}
              selectedModelId={selectedModelId}
              acceptedModelId={acceptedModelId}
              onMarkAsAccepted={handleMarkAsAccepted}
              onRetryJob={handleRetryJob}
              isPolling={isPolling}
            />
          </CardContent>
        </Card>
      </div>
      
      <div className="md:col-span-2">
        {viewMode === 'single' ? (
          selectedJob ? (
            <SingleJobView 
              selectedJob={selectedJob}
              audioUrl={audioUrl}
              extractVttContent={extractVttContent}
              getModelDisplayName={getModelDisplayName}
              onExport={handleComparisonExport}
              onAccept={() => handleMarkAsAccepted(selectedJob)}
              onTextEdit={handleTextEdit}
            />
          ) : (
            <Card className="shadow-soft border-2 h-full flex items-center justify-center">
              <CardContent className="text-center py-10">
                <NoJobSelectedState />
              </CardContent>
            </Card>
          )
        ) : (
          <ComparisonView 
            jobsToCompare={jobsToCompare}
            extractVttContent={extractVttContent}
            getModelDisplayName={getModelDisplayName}
            setViewMode={setViewMode}
            onExport={handleComparisonExport}
            onAccept={handleMarkAsAccepted}
            audioUrl={audioUrl}
          />
        )}
      </div>
    </div>
  );
};

export default SessionMainContent;
