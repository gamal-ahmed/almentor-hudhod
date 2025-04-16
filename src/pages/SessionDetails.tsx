
import React from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import { useSessionDetails } from "@/hooks/useSessionDetails";
import { useComparisonMode } from "@/hooks/useComparisonMode";
import { useTranscriptionExport } from "@/hooks/useTranscriptionExport";
import { useJobOperations } from "@/hooks/useJobOperations";
import { useBrightcovePublishing } from "@/hooks/useBrightcovePublishing";
import { extractVttContent, getModelDisplayName } from "@/utils/transcriptionUtils";
import SessionHeader from "@/components/session/SessionHeader";
import SessionActionHeader from "@/components/session/SessionActionHeader";
import SessionTitle from "@/components/session/SessionTitle";
import SessionMainContent from "@/components/session/SessionMainContent";
import PublishDialog from "@/components/session/PublishDialog";
import { TranscriptionJob } from "@/lib/api/types/transcription";

const SessionDetails = () => {
  const { sessionId } = useParams<{ sessionId?: string }>();
  
  const {
    loading,
    sessionJobs,
    selectedJob,
    setSelectedJob,
    audioUrl,
    fetchError,
    loadedSessionId,
    selectedModelId,
    setSelectedModelId,
    acceptedModelId,
    setAcceptedModelId,
    refreshJobs,
    isPolling,
    saveEditedTranscription
  } = useSessionDetails(sessionId);
  
  const {
    comparisonMode,
    jobsToCompare,
    viewMode,
    setViewMode,
    toggleComparisonMode,
    startComparison,
    isJobSelectedForComparison,
    handleSelectJob
  } = useComparisonMode(setSelectedJob);
  
  const { exportTranscription } = useTranscriptionExport();
  
  const {
    handleMarkAsAccepted,
    handleRetryJob
  } = useJobOperations(
    loadedSessionId || sessionId,
    selectedModelId,
    setSelectedModelId,
    acceptedModelId,
    setAcceptedModelId,
    setSelectedJob,
    addLog
  );
  
  const {
    videoId,
    setVideoId,
    isPublishing,
    publishDialogOpen,
    setPublishDialogOpen,
    handlePublishDialogOpen,
    publishToBrightcove
  } = useBrightcovePublishing(sessionId, selectedJob, selectedModelId, sessionJobs);
  
  const displaySessionId = loadedSessionId || sessionId;
  
  const handleTextEdit = async (job: TranscriptionJob, editedContent: string) => {
    if (!displaySessionId) return null;
    return await saveEditedTranscription(displaySessionId, job, editedContent);
  };

  const handleComparisonExport = (job: TranscriptionJob) => {
    return (format: ExportFormat) => {
      exportTranscription(format, job);
    };
  };

  const failedJobsCount = sessionJobs.filter(job => job.status === 'failed').length;

  return (
    <>
      <Header />
      <div className="container py-6">
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
    </>
  );
};

export default SessionDetails;
