
import React from "react";
import { VTTSegment } from "../types";
import SegmentsList from "./SegmentsList";
import EditableTranscription from "./EditableTranscription";
import RawVttView from "./RawVttView";
import EmptyTranscriptionState from "./EmptyTranscriptionState";

interface TranscriptionViewProps {
  editMode: boolean;
  vttSegments: VTTSegment[];
  activeSegment: number | null;
  audioSrc: string | null;
  vttContent: string;
  onSegmentClick: (index: number) => void;
  onPlaySegment: (index: number) => void;
  isEditable?: boolean;
  setEditMode: (editMode: boolean) => void;
  editedContent: string;
  setEditedContent: (content: string) => void;
  handleSaveEdits: () => void;
  handleCancelEdits: () => void;
  isPlayingSegment?: boolean;
  currentlyPlayingSegment?: number | null;
}

const TranscriptionView: React.FC<TranscriptionViewProps> = ({
  editMode,
  vttSegments,
  activeSegment,
  audioSrc,
  vttContent,
  onSegmentClick,
  onPlaySegment,
  isEditable,
  setEditMode,
  editedContent,
  setEditedContent,
  handleSaveEdits,
  handleCancelEdits,
  isPlayingSegment,
  currentlyPlayingSegment,
}) => {
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

  if (editMode && vttSegments.length > 0) {
    return (
      <EditableTranscription 
        editedSegments={vttSegments}
        handleSegmentTextChange={() => {}}
        handleSaveEdits={handleSaveEdits}
        handleCancelEdits={handleCancelEdits}
      />
    );
  }

  if (vttContent && vttContent.length > 0) {
    return (
      <RawVttView 
        vttContent={vttContent}
        editMode={editMode}
        isEditable={isEditable || false}
        editedContent={editedContent}
        setEditMode={setEditMode}
        setEditedContent={setEditedContent}
        handleSaveEdits={handleSaveEdits}
        handleCancelEdits={handleCancelEdits}
      />
    );
  }

  return <EmptyTranscriptionState modelName="" />;
};

export default TranscriptionView;
