
import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface RawVttViewProps {
  vttContent: string;
  editMode: boolean;
  isEditable: boolean;
  editedContent: string;
  setEditMode: (editMode: boolean) => void;
  setEditedContent: (content: string) => void;
  handleSaveEdits: () => void;
  handleCancelEdits: () => void;
}

const RawVttView: React.FC<RawVttViewProps> = ({
  vttContent,
  editMode,
  isEditable,
  editedContent,
  setEditMode,
  setEditedContent,
  handleSaveEdits,
  handleCancelEdits,
}) => {
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
};

export default RawVttView;
