
import React, { useState } from "react";
import { useLogsStore } from "@/lib/useLogsStore";
import { VTTSegment } from "./types";
import LoadingState from "./components/LoadingState";
import TranscriptionView from "./components/TranscriptionView";

interface TranscriptionContentProps {
  vttSegments: VTTSegment[];
  activeSegment: number | null;
  audioSrc: string | null;
  isLoading: boolean;
  vttContent: string;
  modelName: string;
  onSegmentClick: (index: number) => void;
  onPlaySegment: (index: number) => void;
  isEditable?: boolean;
  onTextEdit?: (editedVttContent: string) => void;
  isPlayingSegment?: boolean;
  currentlyPlayingSegment?: number | null;
}

const TranscriptionContent: React.FC<TranscriptionContentProps> = ({
  vttSegments,
  activeSegment,
  audioSrc,
  isLoading,
  vttContent,
  modelName,
  onSegmentClick,
  onPlaySegment,
  isEditable = false,
  onTextEdit,
  isPlayingSegment = false,
  currentlyPlayingSegment = null,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState(vttContent);
  const addLog = useLogsStore(state => state.addLog);

  const handleSaveEdits = () => {
    if (onTextEdit && editedContent !== vttContent) {
      onTextEdit(editedContent);
      addLog(`Edited transcription for ${modelName}`, "info", {
        source: "TranscriptionContent",
        details: `Edited ${vttSegments.length} segments`
      });
    }
    setEditMode(false);
  };

  const handleCancelEdits = () => {
    setEditedContent(vttContent);
    setEditMode(false);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <TranscriptionView
      editMode={editMode}
      vttSegments={vttSegments}
      activeSegment={activeSegment}
      audioSrc={audioSrc}
      vttContent={vttContent}
      onSegmentClick={onSegmentClick}
      onPlaySegment={onPlaySegment}
      isEditable={isEditable}
      setEditMode={setEditMode}
      editedContent={editedContent}
      setEditedContent={setEditedContent}
      handleSaveEdits={handleSaveEdits}
      handleCancelEdits={handleCancelEdits}
      isPlayingSegment={isPlayingSegment}
      currentlyPlayingSegment={currentlyPlayingSegment}
    />
  );
};

export default TranscriptionContent;
