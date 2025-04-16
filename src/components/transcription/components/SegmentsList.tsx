
import React from "react";
import TranscriptionSegment from "../TranscriptionSegment";
import { VTTSegment } from "../types";
import { Button } from "@/components/ui/button";

interface SegmentsListProps {
  vttSegments: VTTSegment[];
  activeSegment: number | null;
  audioSrc: string | null;
  onSegmentClick: (index: number) => void;
  onPlaySegment: (index: number) => void;
  isEditable?: boolean;
  setEditMode: (editMode: boolean) => void;
  isPlayingSegment?: boolean;
  currentlyPlayingSegment?: number | null;
  isSegmentPaused?: boolean;
}

const SegmentsList: React.FC<SegmentsListProps> = ({
  vttSegments,
  activeSegment,
  audioSrc,
  onSegmentClick,
  onPlaySegment,
  isEditable = false,
  setEditMode,
  isPlayingSegment = false,
  currentlyPlayingSegment = null,
  isSegmentPaused = false,
}) => {
  return (
    <div className="space-y-1">
      {isEditable && (
        <div className="flex justify-end mb-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setEditMode(true)}
            className="text-xs"
          >
            Edit Transcription
          </Button>
        </div>
      )}
      {vttSegments.map((segment, index) => (
        <TranscriptionSegment
          key={index}
          index={index}
          segment={segment}
          isActive={activeSegment === index}
          audioSrc={audioSrc}
          onSegmentClick={() => {
            if (audioSrc) onSegmentClick(index);
          }}
          onPlaySegment={() => onPlaySegment(index)}
          isPlayingSegment={isPlayingSegment}
          currentSegmentIndex={currentlyPlayingSegment !== null ? currentlyPlayingSegment : -1}
          isSegmentPaused={isSegmentPaused}
        />
      ))}
    </div>
  );
};

export default SegmentsList;
