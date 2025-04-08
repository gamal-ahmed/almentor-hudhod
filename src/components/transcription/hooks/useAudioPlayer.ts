
import { useState, useRef, useEffect } from 'react';
import { useLogsStore } from '@/lib/useLogsStore';
import { parseTimeToSeconds } from '../utils/timeUtils';

interface VTTSegment {
  startTime: string;
  endTime: string;
  text: string;
}

export const useAudioPlayer = (vttSegments: VTTSegment[], audioSrc: string | null) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const addLog = useLogsStore(state => state.addLog);

  useEffect(() => {
    if (!audioRef.current) return;
    
    const handleTimeUpdate = () => {
      if (!audioRef.current) return;
      
      const currentTime = audioRef.current.currentTime;
      setCurrentTime(currentTime);
      
      const index = vttSegments.findIndex((segment) => {
        const startSeconds = parseTimeToSeconds(segment.startTime);
        const endSeconds = parseTimeToSeconds(segment.endTime);
        return currentTime >= startSeconds && currentTime <= endSeconds;
      });
      
      if (index !== -1) {
        setActiveSegment(index);
      } else {
        setActiveSegment(null);
      }
    };
    
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setActiveSegment(null);
      setCurrentTime(0);
      
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    };
    
    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
        setIsAudioLoaded(true);
      }
    };
    
    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('play', handlePlay);
    audioRef.current.addEventListener('pause', handlePause);
    audioRef.current.addEventListener('ended', handleEnded);
    audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('play', handlePlay);
        audioRef.current.removeEventListener('pause', handlePause);
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
      }
    };
  }, [vttSegments]);
  
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error('Error playing audio:', err);
        addLog(`Error playing audio: ${err.message}`, "error", {
          source: "TranscriptionCard",
          details: err.stack
        });
      });
    }
  };
  
  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    
    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (isMuted && volume === 0) {
      setVolume(0.5);
    }
  };
  
  const jumpForward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
  };
  
  const jumpBackward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
  };
  
  const jumpToSegment = (index: number) => {
    if (!audioRef.current || !vttSegments[index]) return;
    
    try {
      const startTime = parseTimeToSeconds(vttSegments[index].startTime);
      
      audioRef.current.currentTime = startTime;
      
      if (!isPlaying) {
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
          addLog(`Error playing audio after segment click: ${error.message}`, "error", {
            source: "TranscriptionCard"
          });
        });
      }
    } catch (error: any) {
      console.error('Error jumping to segment:', error);
      addLog(`Error jumping to segment: ${error.message}`, "error", {
        source: "TranscriptionCard",
        details: error.stack
      });
    }
  };

  const playSegment = (index: number) => {
    if (!audioRef.current || !vttSegments[index]) return;
    
    try {
      const startTime = parseTimeToSeconds(vttSegments[index].startTime);
      const endTime = parseTimeToSeconds(vttSegments[index].endTime);
      
      audioRef.current.currentTime = startTime;
      
      audioRef.current.play().catch(error => {
        console.error('Error playing audio segment:', error);
      });
      
      const duration = endTime - startTime;
      setTimeout(() => {
        if (audioRef.current && audioRef.current.currentTime >= endTime) {
          audioRef.current.pause();
        }
      }, duration * 1000);
      
      addLog(`Playing segment ${index + 1}`, "debug", {
        source: "TranscriptionCard",
        details: `Start: ${vttSegments[index].startTime}, End: ${vttSegments[index].endTime}`
      });
    } catch (error: any) {
      console.error('Error playing segment:', error);
    }
  };

  return {
    audioRef,
    isPlaying,
    activeSegment,
    currentTime,
    duration,
    volume,
    isMuted,
    isAudioLoaded,
    showAudioPlayer,
    setShowAudioPlayer,
    togglePlay,
    handleSeek,
    handleVolumeChange,
    toggleMute,
    jumpForward,
    jumpBackward,
    jumpToSegment,
    playSegment
  };
};
