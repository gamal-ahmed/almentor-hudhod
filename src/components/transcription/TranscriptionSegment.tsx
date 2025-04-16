
import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface TranscriptionSegmentProps {
  segment: {
    startTime: string;
    endTime: string;
    text: string;
  };
  isActive: boolean;
  audioSrc: string | null;
  onSegmentClick: () => void;
  onPlaySegment: () => void;
  isPlayingSegment?: boolean;
  currentSegmentIndex?: number;
  index: number;
}

const TranscriptionSegment: React.FC<TranscriptionSegmentProps> = ({
  segment,
  isActive,
  audioSrc,
  onSegmentClick,
  onPlaySegment,
  isPlayingSegment = false,
  currentSegmentIndex = -1,
  index,
}) => {
  const isCurrentlyPlaying = isPlayingSegment && currentSegmentIndex === index;
  
  return (
    <div 
      className={`vtt-segment p-2 rounded-md mb-2 transition-colors ${
        isCurrentlyPlaying 
          ? 'bg-primary/30 dark:bg-primary/50 border border-primary' 
          : isActive 
          ? 'bg-primary/20 dark:bg-primary/40' 
          : 'bg-muted/30 hover:bg-muted/50'
      }`}
    >
      <div className="flex justify-between items-center">
        <div className="vtt-timestamp text-xs text-muted-foreground">{segment.startTime} → {segment.endTime}</div>
        {audioSrc && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={(e) => {
              e.stopPropagation();
              onPlaySegment();
            }}
          >
            {isCurrentlyPlaying ? (
              <Pause className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
          </Button>
        )}
      </div>
      <div 
        className={`vtt-content text-sm mt-1 cursor-pointer ${
          isCurrentlyPlaying ? 'font-medium' : ''
        }`}
        onClick={onSegmentClick}
      >
        {segment.text}
      </div>
    </div>
  );
};

export default TranscriptionSegment;
