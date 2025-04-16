
import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, Rewind, FastForward } from "lucide-react";

interface PlaybackControlsProps {
  isPlaying: boolean;
  isAudioLoaded: boolean;
  onPlayPause: () => void;
  onForward: () => void;
  onBackward: () => void;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  isAudioLoaded,
  onPlayPause,
  onForward,
  onBackward
}) => {
  return (
    <div className="flex items-center space-x-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={onBackward}
        className="h-8 w-8"
        disabled={!isAudioLoaded}
      >
        <Rewind className="h-4 w-4" />
      </Button>
      
      <Button
        variant="outline"
        size="icon"
        onClick={onPlayPause}
        className="h-10 w-10 rounded-full"
        disabled={!isAudioLoaded}
      >
        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onForward}
        className="h-8 w-8"
        disabled={!isAudioLoaded}
      >
        <FastForward className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default PlaybackControls;
