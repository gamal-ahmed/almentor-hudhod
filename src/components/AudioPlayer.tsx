
import React, { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, VolumeX, Volume2, Rewind, FastForward, SkipBack, SkipForward } from "lucide-react";

interface AudioPlayerProps {
  src: string | null;
  onTimeUpdate?: (currentTime: number) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, onTimeUpdate }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audioElement.currentTime);
      if (onTimeUpdate) {
        onTimeUpdate(audioElement.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audioElement.duration);
    };

    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
      audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [onTimeUpdate]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.play().catch((error) => {
        console.error("Error playing audio:", error);
        setIsPlaying(false);
      });
    } else {
      audioElement.pause();
    }
  }, [isPlaying]);

  // Reset player when src changes
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
  }, [src]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (value: number[]) => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    audioElement.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      audioRef.current.muted = newVolume === 0;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    if (isMuted && volume === 0) {
      setVolume(0.5);
      if (audioRef.current) {
        audioRef.current.volume = 0.5;
      }
    }
  };

  const jumpForward = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    audioElement.currentTime = Math.min(audioElement.currentTime + 10, duration);
  };

  const jumpBackward = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    audioElement.currentTime = Math.max(audioElement.currentTime - 10, 0);
  };

  const skipForward = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    audioElement.currentTime = Math.min(audioElement.currentTime + 30, duration);
  };

  const skipBackward = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;
    audioElement.currentTime = Math.max(audioElement.currentTime - 30, 0);
  };

  if (!src) return null;

  return (
    <div className="audio-player space-y-2">
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <div className="flex items-center justify-between space-x-2">
        <div className="text-xs text-muted-foreground w-10">{formatTime(currentTime)}</div>
        
        <div className="flex-1">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            disabled={!duration}
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
            onClick={toggleMute}
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
              onValueChange={handleVolumeChange}
              className="cursor-pointer"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={skipBackward}
            className="h-8 w-8 md:flex hidden"
            disabled={!duration}
            title="Back 30 seconds"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={jumpBackward}
            className="h-8 w-8"
            disabled={!duration}
            title="Back 10 seconds"
          >
            <Rewind className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={togglePlay}
            className="h-10 w-10 rounded-full"
            disabled={!duration}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={jumpForward}
            className="h-8 w-8"
            disabled={!duration}
            title="Forward 10 seconds"
          >
            <FastForward className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={skipForward}
            className="h-8 w-8 md:flex hidden"
            disabled={!duration}
            title="Forward 30 seconds"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="w-24"></div>
      </div>
    </div>
  );
};

export default AudioPlayer;
