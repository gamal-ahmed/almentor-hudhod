
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { TranscriptionCard } from "@/components/transcription";
import { TranscriptionJob } from "@/lib/api/types/transcription";
import { useToast } from "@/hooks/use-toast";
import { ExportFormat } from "@/hooks/useTranscriptionExport";
import { createTranscriptionJob } from "@/lib/api";

interface SingleJobViewProps {
  selectedJob: TranscriptionJob;
  audioUrl: string | null;
  extractVttContent: (job: TranscriptionJob) => string | undefined;
  getModelDisplayName: (model: string) => string;
  onExport?: (format: ExportFormat) => void;
  onAccept?: () => void;
  onTextEdit?: (job: TranscriptionJob, editedContent: string) => Promise<string | null>;
  isPolling?: boolean;
}

const SingleJobView: React.FC<SingleJobViewProps> = ({
  selectedJob,
  audioUrl,
  extractVttContent,
  getModelDisplayName,
  onExport,
  onAccept,
  onTextEdit,
  isPolling = false
}) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const vttContent = extractVttContent(selectedJob);
  const modelDisplayName = getModelDisplayName(selectedJob.model);
  
  const handleExport = (format: ExportFormat) => {
    if (onExport) {
      onExport(format);
    }
  };
  
  const handleAccept = () => {
    if (onAccept) {
      onAccept();
    }
  };

  const handleTextEdit = async (editedContent: string) => {
    if (!onTextEdit) return;
    
    try {
      setIsSaving(true);
      const result = await onTextEdit(selectedJob, editedContent);
      if (result) {
        console.log("Transcription edited successfully", result);
      }
    } catch (error) {
      toast({
        title: "Error saving edited transcription",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetry = async () => {
    if (!selectedJob.file_path || !selectedJob.session_id) {
      toast({
        title: "Cannot retry transcription",
        description: "Missing file path or session ID",
        variant: "destructive",
      });
      return;
    }
    
    setIsRetrying(true);
    
    try {
      // Get the file from storage
      const fileResponse = await fetch(selectedJob.file_path);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch audio file: ${fileResponse.statusText}`);
      }
      
      const fileBlob = await fileResponse.blob();
      const file = new File([fileBlob], `retry-${selectedJob.id}.mp3`, { type: 'audio/mpeg' });
      
      // Create a new transcription job with the same model
      await createTranscriptionJob(
        file,
        selectedJob.model as any,
        selectedJob.result?.prompt || "Please preserve all English words exactly as spoken",
        selectedJob.session_id
      );
      
      toast({
        title: "Transcription job restarted",
        description: `Started new ${modelDisplayName} transcription job`,
      });
    } catch (error) {
      console.error("Error retrying transcription job:", error);
      toast({
        title: "Error retrying transcription",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsRetrying(false);
    }
  };
  
  return (
    <Card className="shadow-soft border-2">
      <TranscriptionCard
        modelName={modelDisplayName}
        vttContent={vttContent}
        audioSrc={audioUrl}
        isSelected={true}
        showExportOptions={true}
        showAudioControls={true}
        onExport={handleExport}
        onAccept={handleAccept}
        isEditable={selectedJob.status === 'completed'}
        onTextEdit={handleTextEdit}
        onRetry={handleRetry}
        isRetrying={isRetrying}
        showRetryButton={selectedJob.status === 'failed'}
        isLoading={isSaving || selectedJob.status === 'processing' || selectedJob.status === 'pending' || isPolling}
      />
    </Card>
  );
};

export default SingleJobView;
