
import React from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Rewind, FastForward, Volume2, VolumeX } from "lucide-react";
import { formatTime } from "./utils/timeUtils";

interface AudioControlsProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isAudioLoaded: boolean;
  onPlayPause: () => void;
  onSeek: (value: number[]) => void;
  onVolumeChange: (value: number[]) => void;
  onMuteToggle: () => void;
  onForward: () => void;
  onBackward: () => void;
}

const AudioControls: React.FC<AudioControlsProps> = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isAudioLoaded,
  onPlayPause,
  onSeek,
  onVolumeChange,
  onMuteToggle,
  onForward,
  onBackward
}) => {
  return (
    <div className="audio-player space-y-2">
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
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMuteToggle}
            className="h-8 w-8"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          
          <div className="w-20">
            <Slider
              value={[isMuted ? 0 : volume]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={onVolumeChange}
              className="cursor-pointer"
            />
          </div>
        </div>
        
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
        
        <div className="w-24"></div>
      </div>
    </div>
  );
};

export default AudioControls;
