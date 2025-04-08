
import { RefObject, useCallback } from 'react';
import { parseTimeToSeconds } from '../utils/timeUtils';
import { VTTSegment } from '../types';

interface UseAudioEventHandlersProps {
  audioRef: RefObject<HTMLAudioElement>;
  vttSegments: VTTSegment[];
  setIsPlaying: (isPlaying: boolean) => void;
  setActiveSegment: (segment: number | null) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsAudioLoaded: (isLoaded: boolean) => void;
}

export const useAudioEventHandlers = ({
  audioRef,
  vttSegments,
  setIsPlaying,
  setActiveSegment,
  setCurrentTime,
  setDuration,
  setIsAudioLoaded
}: UseAudioEventHandlersProps) => {
  
  const setupEventListeners = useCallback(() => {
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
  }, [vttSegments, setIsPlaying, setActiveSegment, setCurrentTime, setDuration, setIsAudioLoaded, audioRef]);

  return { setupEventListeners };
};
