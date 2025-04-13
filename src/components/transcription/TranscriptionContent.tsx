
import React, { useState } from "react";
import { useLogsStore } from "@/lib/useLogsStore";
import { VTTSegment } from "./types";

// Import the new component files
import LoadingState from "./components/LoadingState";
import SegmentsList from "./components/SegmentsList";
import EditableTranscription from "./components/EditableTranscription";
import RawVttView from "./components/RawVttView";
import EmptyTranscriptionState from "./components/EmptyTranscriptionState";

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
  currentlyPlayingSegment = null
}) => {
  const addLog = useLogsStore(state => state.addLog);
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState(vttContent);
  const [editedSegments, setEditedSegments] = useState<VTTSegment[]>(vttSegments);

  const handleSegmentTextChange = (index: number, newText: string) => {
    const updatedSegments = [...editedSegments];
    updatedSegments[index] = { 
      ...updatedSegments[index], 
      text: newText 
    };
    setEditedSegments(updatedSegments);
    
    // Re-construct VTT content from segments
    const newVttContent = constructVttContent(updatedSegments);
    setEditedContent(newVttContent);
  };

  const constructVttContent = (segments: VTTSegment[]): string => {
    let vtt = "WEBVTT\n\n";
    segments.forEach(segment => {
      vtt += `${segment.startTime} --> ${segment.endTime}\n${segment.text}\n\n`;
    });
    return vtt;
  };

  const handleSaveEdits = () => {
    if (onTextEdit && editedContent !== vttContent) {
      onTextEdit(editedContent);
      addLog(`Edited transcription for ${modelName}`, "info", {
        source: "TranscriptionContent",
        details: `Edited ${editedSegments.length} segments`
      });
    }
    setEditMode(false);
  };

  const handleCancelEdits = () => {
    setEditedContent(vttContent);
    setEditedSegments(vttSegments);
    setEditMode(false);
  };

  // Conditional rendering based on state
  if (isLoading) {
    return <LoadingState />;
  }

  if (!editMode && vttSegments.length > 0) {
    return (
      <SegmentsList 
        vttSegments={vttSegments}
        activeSegment={activeSegment}
        audioSrc={audioSrc}
        onSegmentClick={onSegmentClick}
        onPlaySegment={onPlaySegment}
        isEditable={isEditable}
        setEditMode={setEditMode}
        isPlayingSegment={isPlayingSegment}
        currentlyPlayingSegment={currentlyPlayingSegment}
      />
    );
  }

  if (editMode && editedSegments.length > 0) {
    return (
      <EditableTranscription 
        editedSegments={editedSegments}
        handleSegmentTextChange={handleSegmentTextChange}
        handleSaveEdits={handleSaveEdits}
        handleCancelEdits={handleCancelEdits}
      />
    );
  }

  if (vttContent && vttContent.length > 0) {
    // If there's content but no segments, show raw VTT content
    return (
      <RawVttView 
        vttContent={vttContent}
        editMode={editMode}
        isEditable={isEditable}
        editedContent={editedContent}
        setEditMode={setEditMode}
        setEditedContent={setEditedContent}
        handleSaveEdits={handleSaveEdits}
        handleCancelEdits={handleCancelEdits}
      />
    );
  }

  return <EmptyTranscriptionState modelName={modelName} />;
};

export default TranscriptionContent;
