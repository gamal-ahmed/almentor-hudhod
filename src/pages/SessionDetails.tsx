
import React from "react";
import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSymlink, RefreshCw } from "lucide-react";
import { useSessionDetails } from "@/hooks/useSessionDetails";
import { useComparisonMode } from "@/hooks/useComparisonMode";
import { useTranscriptionExport, ExportFormat } from "@/hooks/useTranscriptionExport";
import { useJobOperations } from "@/hooks/useJobOperations";
import { useBrightcovePublishing } from "@/hooks/useBrightcovePublishing";
import { extractVttContent, getModelDisplayName } from "@/utils/transcriptionUtils";

import SessionHeader from "@/components/session/SessionHeader";
import TranscriptionJobList from "@/components/session/TranscriptionJobList";
import ComparisonModeHeader from "@/components/session/ComparisonModeHeader";
import ComparisonView from "@/components/session/ComparisonView";
import SingleJobView from "@/components/session/SingleJobView";
import PublishDialog from "@/components/session/PublishDialog";
import { LoadingState, ErrorState, EmptyState, NoJobSelectedState } from "@/components/session/SessionStatusStates";
import { TranscriptionJob } from "@/lib/api/types/transcription";
import { AudioPreview } from "@/components/session/components";

const SessionDetails = () => {
  const { sessionId } = useParams<{ sessionId?: string }>();
  
  const {
    loading,
    sessionJobs,
    selectedJob,
    setSelectedJob,
    audioUrl,
    selectedTranscriptionUrl,
    fetchError,
    loadedSessionId,
    selectedModelId,
    setSelectedModelId,
    acceptedModelId,
    setAcceptedModelId,
    refreshJobs,
    addLog,
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
  
  const {
    exportTranscription
  } = useTranscriptionExport();
  
  const {
    handleMarkAsAccepted
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

  const handleExportTranscription = (format: ExportFormat) => {
    if (selectedJob) {
      exportTranscription(format, selectedJob);
    }
  };

  const handleComparisonExport = (job: TranscriptionJob) => {
    return (format: ExportFormat) => {
      exportTranscription(format, job);
    };
  };

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
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Transcription Session Details</h1>
              {displaySessionId && displaySessionId !== 'null' && displaySessionId !== 'undefined' && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <p className="font-mono text-sm">Session ID: {displaySessionId}</p>
                  {isPolling && (
                    <div className="flex items-center gap-1 text-sm px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 animate-pulse">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      <span>Auto-updating</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex justify-end mb-2">
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
            
            {/* Add Audio Preview component */}
            {audioUrl && (
              <div className="mb-4">
                <AudioPreview audioUrl={audioUrl} />
              </div>
            )}
            
            {loading ? (
              <LoadingState />
            ) : fetchError ? (
              <ErrorState error={fetchError} onRetry={refreshJobs} sessionId={displaySessionId} />
            ) : sessionJobs.length === 0 ? (
              <EmptyState onRefresh={refreshJobs} />
            ) : (
              <div className="grid md:grid-cols-3 gap-6 mt-4">
                <div className="md:col-span-1">
                  <Card className="shadow-soft border-2">
                    <CardContent className="p-4">
                      {comparisonMode && (
                        <ComparisonModeHeader 
                          jobsToCompare={jobsToCompare}
                          toggleComparisonMode={toggleComparisonMode}
                          startComparison={startComparison}
                        />
                      )}
                      
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
                        onExport={handleExportTranscription}
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
            )}
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
