
import React, { useState } from "react";
import TranscriptionSegment from "./TranscriptionSegment";
import { useLogsStore } from "@/lib/useLogsStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VTTSegment } from "./types";

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
  onTextEdit
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

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground animate-pulse-opacity">
        Generating transcription...
      </div>
    );
  }

  if (!editMode && vttSegments.length > 0) {
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
            segment={segment}
            isActive={activeSegment === index}
            audioSrc={audioSrc}
            onSegmentClick={() => {
              if (audioSrc) onSegmentClick(index);
            }}
            onPlaySegment={() => onPlaySegment(index)}
          />
        ))}
      </div>
    );
  }

  if (editMode && editedSegments.length > 0) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Editing Transcription</span>
          <div className="space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCancelEdits}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleSaveEdits}
              className="text-xs"
            >
              Save Changes
            </Button>
          </div>
        </div>
        {editedSegments.map((segment, index) => (
          <div key={index} className="border rounded-md p-2 bg-muted/20">
            <div className="flex text-xs text-muted-foreground mb-1">
              <span>{segment.startTime} → {segment.endTime}</span>
            </div>
            <Textarea
              value={segment.text}
              onChange={(e) => handleSegmentTextChange(index, e.target.value)}
              className="min-h-[60px] text-sm"
            />
          </div>
        ))}
      </div>
    );
  }

  if (vttContent && vttContent.length > 0) {
    // If there's content but no segments, show raw VTT content
    return (
      <div className="p-2">
        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-md mb-4 text-xs">
          <p className="font-medium">VTT parsing issue detected</p>
          <p className="mt-1">The transcription was received but couldn't be parsed into segments.</p>
        </div>
        {isEditable && !editMode ? (
          <div className="flex justify-end mb-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setEditMode(true)}
              className="text-xs"
            >
              Edit Raw VTT
            </Button>
          </div>
        ) : null}
        
        {editMode ? (
          <div>
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[200px] font-mono text-xs"
            />
            <div className="flex justify-end mt-2 space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCancelEdits}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleSaveEdits}
                className="text-xs"
              >
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="vtt-content text-sm border border-dashed p-3 rounded-md max-h-[200px] overflow-y-auto">
            {vttContent}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-full">
      <span className="text-4xl mb-2">📝</span>
      <span>No transcription available yet</span>
      {modelName && modelName.includes("Gemini") && (
        <span className="text-xs mt-2 px-2 py-1 bg-red-100 dark:bg-red-900/20 rounded-md">
            Check logs for Gemini transcription status
        </span>
      )}
    </div>
  );
};

export default TranscriptionContent;
