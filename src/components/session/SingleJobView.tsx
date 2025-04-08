
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { TranscriptionCard } from "@/components/transcription";
import { TranscriptionJob } from "@/lib/api/types/transcription";
import { useToast } from "@/hooks/use-toast";
import { ExportFormat } from "@/components/transcription/types";

interface SingleJobViewProps {
  selectedJob: TranscriptionJob;
  audioUrl: string | null;
  extractVttContent: (job: TranscriptionJob) => string | undefined;
  getModelDisplayName: (model: string) => string;
  onExport?: (format: ExportFormat, job: TranscriptionJob) => void;
  onAccept?: (job: TranscriptionJob) => void;
  onTextEdit?: (job: TranscriptionJob, editedContent: string) => Promise<string | null>;
}

const SingleJobView: React.FC<SingleJobViewProps> = ({
  selectedJob,
  audioUrl,
  extractVttContent,
  getModelDisplayName,
  onExport,
  onAccept,
  onTextEdit
}) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const vttContent = extractVttContent(selectedJob);
  const modelDisplayName = getModelDisplayName(selectedJob.model);
  
  const handleExport = (format: ExportFormat) => {
    if (onExport) {
      onExport(format, selectedJob);
    }
  };
  
  const handleAccept = () => {
    if (onAccept) {
      onAccept(selectedJob);
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
        isLoading={isSaving || selectedJob.status === 'processing' || selectedJob.status === 'pending'}
      />
    </Card>
  );
};

export default SingleJobView;
