
import React from "react";
import TranscriptionCardContainer from "./components/TranscriptionCardContainer";
import { TranscriptionCardProps } from "./types";

const TranscriptionCard: React.FC<TranscriptionCardProps> = ({
  modelName = "",
  vttContent = "",
  prompt,
  onSelect,
  isSelected = false,
  audioSrc = null,
  isLoading = false,
  className,
  showPagination,
  showExportOptions = false,
  showAudioControls = false,
  onExport = () => {},
  onAccept = () => {},
  onTextEdit,
  isEditable = false,
  onRetry,
  isRetrying = false,
  showRetryButton = false
}) => {
  return (
    <TranscriptionCardContainer
      modelName={modelName}
      vttContent={vttContent}
      prompt={prompt}
      onSelect={onSelect}
      isSelected={isSelected}
      audioSrc={audioSrc}
      isLoading={isLoading}
      className={className}
      showPagination={showPagination}
      showExportOptions={showExportOptions}
      showAudioControls={showAudioControls}
      onExport={onExport}
      onAccept={onAccept}
      onTextEdit={onTextEdit}
      isEditable={isEditable}
      onRetry={onRetry}
      isRetrying={isRetrying}
      showRetryButton={showRetryButton}
    />
  );
};

export default TranscriptionCard;
