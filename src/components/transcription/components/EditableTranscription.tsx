
import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VTTSegment } from "../types";

interface EditableTranscriptionProps {
  editedSegments: VTTSegment[];
  handleSegmentTextChange: (index: number, newText: string) => void;
  handleSaveEdits: () => void;
  handleCancelEdits: () => void;
}

const EditableTranscription: React.FC<EditableTranscriptionProps> = ({
  editedSegments,
  handleSegmentTextChange,
  handleSaveEdits,
  handleCancelEdits,
}) => {
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
};

export default EditableTranscription;
