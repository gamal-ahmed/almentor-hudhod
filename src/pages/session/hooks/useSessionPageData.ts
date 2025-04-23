
import { useSessionDetails } from "@/hooks/useSessionDetails";
import { useComparisonMode } from "@/hooks/useComparisonMode";
import { useTranscriptionExport } from "@/hooks/useTranscriptionExport";
import { useJobOperations } from "@/hooks/useJobOperations";
import { useBrightcovePublishing } from "@/hooks/useBrightcovePublishing";
import { TranscriptionJob } from "@/lib/api/types/transcription";

export function useSessionPageData(sessionId?: string) {
  const sessionDetails = useSessionDetails(sessionId);
  
  const {
    comparisonMode,
    jobsToCompare,
    viewMode,
    setViewMode,
    toggleComparisonMode,
    startComparison,
    isJobSelectedForComparison,
    handleSelectJob
  } = useComparisonMode(sessionDetails.setSelectedJob);
  
  const { exportTranscription } = useTranscriptionExport();
  
  const jobOperations = useJobOperations(
    sessionDetails.loadedSessionId || sessionId,
    sessionDetails.selectedModelId,
    sessionDetails.setSelectedModelId,
    sessionDetails.acceptedModelId,
    sessionDetails.setAcceptedModelId,
    sessionDetails.setSelectedJob,
    sessionDetails.addLog
  );
  
  const publishingOperations = useBrightcovePublishing(
    sessionId, 
    sessionDetails.selectedJob, 
    sessionDetails.selectedModelId,
    sessionDetails.sessionJobs
  );

  const handleComparisonExport = (job: TranscriptionJob) => {
    return (format: any) => {
      exportTranscription(format, job);
    };
  };

  const handleTextEdit = async (job: TranscriptionJob, editedContent: string) => {
    if (!sessionDetails.loadedSessionId && !sessionId) return null;
    return await sessionDetails.saveEditedTranscription(
      sessionDetails.loadedSessionId || sessionId || '', 
      job, 
      editedContent
    );
  };

  return {
    ...sessionDetails,
    ...jobOperations,
    ...publishingOperations,
    comparisonMode,
    jobsToCompare,
    viewMode,
    setViewMode,
    toggleComparisonMode,
    startComparison,
    isJobSelectedForComparison,
    handleSelectJob,
    handleComparisonExport,
    handleTextEdit
  };
}
