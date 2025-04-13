
import React from "react";

interface EmptyTranscriptionStateProps {
  modelName: string;
}

const EmptyTranscriptionState: React.FC<EmptyTranscriptionStateProps> = ({ modelName }) => {
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

export default EmptyTranscriptionState;
