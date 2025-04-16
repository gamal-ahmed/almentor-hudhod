
import React from 'react';
import { Slider } from "@/components/ui/slider";
import { formatTime } from "@/components/transcription/utils/timeUtils";

interface AudioProgressProps {
  currentTime: number;
  duration: number;
  onSeek: (value: number[]) => void;
  isAudioLoaded: boolean;
}

const AudioProgress: React.FC<AudioProgressProps> = ({
  currentTime,
  duration,
  onSeek,
  isAudioLoaded
}) => {
  return (
    <div className="flex items-center justify-between space-x-2">
      <div className="text-xs text-muted-foreground w-10">{formatTime(currentTime)}</div>
      
      <div className="flex-1">
        <Slider
          value={[currentTime]}
          min={0}
          max={duration || 100}
          step={0.1}
          onValueChange={onSeek}
          disabled={!isAudioLoaded}
          className="cursor-pointer"
        />
      </div>
      
      <div className="text-xs text-muted-foreground w-10">{formatTime(duration)}</div>
    </div>
  );
};

export default AudioProgress;
