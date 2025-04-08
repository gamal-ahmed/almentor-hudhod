
import React from "react";
import TranscriptionSegment from "./TranscriptionSegment";
import { useLogsStore } from "@/lib/useLogsStore";

interface TranscriptionContentProps {
  vttSegments: { startTime: string; endTime: string; text: string }[];
  activeSegment: number | null;
  audioSrc: string | null;
  isLoading: boolean;
  vttContent: string;
  modelName: string;
  onSegmentClick: (index: number) => void;
  onPlaySegment: (index: number) => void;
}

const TranscriptionContent: React.FC<TranscriptionContentProps> = ({
  vttSegments,
  activeSegment,
  audioSrc,
  isLoading,
  vttContent,
  modelName,
  onSegmentClick,
  onPlaySegment
}) => {
  const addLog = useLogsStore(state => state.addLog);

  if (isLoading) {
    return (
      <div className="text-center text-muted-foreground animate-pulse-opacity">
        Generating transcription...
      </div>
    );
  }

  if (vttSegments.length > 0) {
    return (
      <div className="space-y-1">
        {vttSegments.map((segment, index) => (
          <TranscriptionSegment
            key={index}
            segment={segment}
            isActive={activeSegment === index}
            audioSrc={audioSrc}
            onSegmentClick={() => {
              console.log(`Segment clicked: ${index}, Has audio: ${!!audioSrc}`);
              if (audioSrc) onSegmentClick(index);
            }}
            onPlaySegment={() => onPlaySegment(index)}
          />
        ))}
      </div>
    );
  }

  if (vttContent && vttContent.length > 0) {
    return (
      <div className="p-2">
        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-md mb-4 text-xs">
          <p className="font-medium">VTT parsing issue detected</p>
          <p className="mt-1">The transcription was received but couldn't be parsed into segments.</p>
        </div>
        <div className="vtt-content text-sm border border-dashed p-3 rounded-md max-h-[200px] overflow-y-auto">
          {vttContent}
        </div>
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
