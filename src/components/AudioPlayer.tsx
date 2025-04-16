
import React, { useRef, useState, useEffect } from 'react';
import AudioProgress from './audio-player/AudioProgress';
import VolumeControl from './audio-player/VolumeControl';
import PlaybackControls from './audio-player/PlaybackControls';

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
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);

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
      setIsAudioLoaded(true);
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

  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
    setIsAudioLoaded(false);
  }, [src]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
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
      
      <AudioProgress
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        isAudioLoaded={isAudioLoaded}
      />
      
      <div className="flex items-center justify-between">
        <VolumeControl
          volume={volume}
          isMuted={isMuted}
          onVolumeChange={handleVolumeChange}
          onMuteToggle={toggleMute}
        />
        
        <PlaybackControls
          isPlaying={isPlaying}
          isAudioLoaded={isAudioLoaded}
          onPlayPause={togglePlay}
          onForward={skipForward}
          onBackward={skipBackward}
        />
        
        <div className="w-24"></div>
      </div>
    </div>
  );
};

export default AudioPlayer;
