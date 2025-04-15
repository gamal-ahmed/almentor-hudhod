
import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { VTTSegment } from "../types";
import { Edit2, Save, X } from "lucide-react";

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
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [tempEdit, setTempEdit] = React.useState("");

  const handleStartEdit = (index: number, text: string) => {
    setEditingIndex(index);
    setTempEdit(text);
  };

  const handleSaveSegment = (index: number) => {
    handleSegmentTextChange(index, tempEdit);
    setEditingIndex(null);
    setTempEdit("");
  };

  const handleCancelSegment = () => {
    setEditingIndex(null);
    setTempEdit("");
  };

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
            Cancel All
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleSaveEdits}
            className="text-xs"
          >
            Save All Changes
          </Button>
        </div>
      </div>
      {editedSegments.map((segment, index) => (
        <div key={index} className="border rounded-md p-2 bg-muted/20">
          <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
            <span>{segment.startTime} → {segment.endTime}</span>
            {editingIndex === index ? (
              <div className="space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleSaveSegment(index)}
                  className="h-6 px-2"
                >
                  <Save className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCancelSegment}
                  className="h-6 px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleStartEdit(index, segment.text)}
                className="h-6 px-2"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          {editingIndex === index ? (
            <Textarea
              value={tempEdit}
              onChange={(e) => setTempEdit(e.target.value)}
              className="min-h-[60px] text-sm"
              autoFocus
            />
          ) : (
            <div className="text-sm break-words">
              {segment.text}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default EditableTranscription;
