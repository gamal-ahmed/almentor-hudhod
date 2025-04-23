
import React from "react";
import { Container } from "@/components/ui/container";
import SessionHeader from "@/components/session/SessionHeader";
import SessionActionHeader from "@/components/session/SessionActionHeader";
import SessionTitle from "@/components/session/SessionTitle";
import SessionMainContent from "@/components/session/SessionMainContent";
import PublishDialog from "@/components/session/PublishDialog";
import { TranscriptionJob } from "@/lib/api/types/transcription";
import { AudioPreview } from "@/components/session/components";
import { extractVttContent, getModelDisplayName } from "@/utils/transcriptionUtils";

interface SessionContainerProps {
  sessionId?: string;
  loading: boolean;
  sessionJobs: TranscriptionJob[];
  selectedJob: TranscriptionJob | null;
  audioUrl: string | null;
  fetchError: string | null;
  loadedSessionId: string | null;
  selectedModelId: string | null;
  acceptedModelId: string | null;
  refreshJobs: () => void;
  isPolling: boolean;
  jobsUpdated: any[];
  comparisonMode: boolean;
  jobsToCompare: TranscriptionJob[];
  viewMode: 'single' | 'compare';
  toggleComparisonMode: () => void;
  startComparison: () => void;
  isJobSelectedForComparison: (id: string) => boolean;
  handleSelectJob: (job: TranscriptionJob) => void;
  handleMarkAsAccepted: (job: TranscriptionJob) => void;
  handleRetryJob: (job: TranscriptionJob) => void;
  handleTextEdit: (job: TranscriptionJob, editedContent: string) => Promise<string | null>;
  handleComparisonExport: (job: TranscriptionJob) => (format: any) => void;
  setViewMode: (mode: 'single' | 'compare') => void;
  videoId: string;
  setVideoId: (id: string) => void;
  isPublishing: boolean;
  publishDialogOpen: boolean;
  setPublishDialogOpen: (open: boolean) => void;
  handlePublishDialogOpen: () => void;
  publishToBrightcove: () => Promise<void>;
}

const SessionContainer: React.FC<SessionContainerProps> = ({
  sessionId,
  loading,
  sessionJobs,
  selectedJob,
  audioUrl,
  fetchError,
  loadedSessionId,
  selectedModelId,
  acceptedModelId,
  refreshJobs,
  isPolling,
  comparisonMode,
  jobsToCompare,
  viewMode,
  toggleComparisonMode,
  startComparison,
  isJobSelectedForComparison,
  handleSelectJob,
  handleMarkAsAccepted,
  handleRetryJob,
  handleTextEdit,
  handleComparisonExport,
  setViewMode,
  videoId,
  setVideoId,
  isPublishing,
  publishDialogOpen,
  setPublishDialogOpen,
  handlePublishDialogOpen,
  publishToBrightcove
}) => {
  const displaySessionId = loadedSessionId || sessionId;
  const failedJobsCount = sessionJobs.filter(job => job.status === 'failed').length;

  return (
    <Container className="py-6">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex flex-col gap-4 mb-6">
          <SessionHeader 
            sessionId={displaySessionId}
            loading={loading}
            comparisonMode={comparisonMode}
            toggleComparisonMode={toggleComparisonMode}
            handleRefreshJobs={refreshJobs}
            selectedJob={selectedJob}
          />
          
          <SessionTitle 
            displaySessionId={displaySessionId}
            isPolling={isPolling}
            failedJobsCount={failedJobsCount}
          />
          
          <SessionActionHeader 
            selectedModelId={selectedModelId}
            selectedJob={selectedJob}
            handlePublishDialogOpen={handlePublishDialogOpen}
          />
          
          {audioUrl && (
            <div className="mb-4">
              <AudioPreview audioUrl={audioUrl} />
            </div>
          )}
          
          <SessionMainContent 
            loading={loading}
            fetchError={fetchError}
            sessionJobs={sessionJobs}
            selectedJob={selectedJob}
            audioUrl={audioUrl}
            comparisonMode={comparisonMode}
            viewMode={viewMode}
            jobsToCompare={jobsToCompare}
            handleSelectJob={handleSelectJob}
            isJobSelectedForComparison={isJobSelectedForComparison}
            selectedModelId={selectedModelId}
            acceptedModelId={acceptedModelId}
            handleMarkAsAccepted={handleMarkAsAccepted}
            handleRetryJob={handleRetryJob}
            isPolling={isPolling}
            refreshJobs={refreshJobs}
            displaySessionId={displaySessionId}
            extractVttContent={extractVttContent}
            getModelDisplayName={getModelDisplayName}
            handleComparisonExport={handleComparisonExport}
            setViewMode={setViewMode}
            handleTextEdit={handleTextEdit}
          />
        </div>
      </div>
      
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
    </Container>
  );
};

export default SessionContainer;
