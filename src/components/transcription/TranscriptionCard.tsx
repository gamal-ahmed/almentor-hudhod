
import React from "react";
import TranscriptionCardContainer from "./components/TranscriptionCardContainer";

interface TranscriptionCardProps {
  modelName: string;
  vttContent: string;
  audioSrc: string | null;
  isSelected: boolean;
  showExportOptions: boolean;
  showAudioControls: boolean;
  onExport: (format: string) => void;
  onAccept: () => void;
  isEditable: boolean;
  onTextEdit?: (editedContent: string) => Promise<string | null>;
  isLoading: boolean;
  onRetry?: () => void;
  isRetrying?: boolean; 
  showRetryButton?: boolean;
}

const TranscriptionCard: React.FC<TranscriptionCardProps> = ({
  modelName,
  vttContent,
  audioSrc,
  isSelected,
  showExportOptions,
  showAudioControls,
  onExport,
  onAccept,
  isEditable,
  onTextEdit,
  isLoading,
  onRetry,
  isRetrying = false,
  showRetryButton = false
}) => {
  return (
    <TranscriptionCardContainer
      modelName={modelName}
      vttContent={vttContent}
      audioSrc={audioSrc}
      isSelected={isSelected}
      showExportOptions={showExportOptions}
      showAudioControls={showAudioControls}
      onExport={onExport}
      onAccept={onAccept}
      isEditable={isEditable}
      onTextEdit={onTextEdit}
      isLoading={isLoading}
      onRetry={onRetry}
      isRetrying={isRetrying}
      showRetryButton={showRetryButton}
    />
  );
};

export default TranscriptionCard;
