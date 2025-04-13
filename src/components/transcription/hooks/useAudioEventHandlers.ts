
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
      
      // Find which segment the current time falls within
      const index = vttSegments.findIndex((segment) => {
        const startSeconds = parseTimeToSeconds(segment.startTime);
        const endSeconds = parseTimeToSeconds(segment.endTime);
        return currentTime >= startSeconds && currentTime <= endSeconds;
      });
      
      if (index !== -1) {
        setActiveSegment(index);
      } else {
        // If no segment is active, find the upcoming segment
        const nextSegmentIndex = vttSegments.findIndex((segment) => {
          const startSeconds = parseTimeToSeconds(segment.startTime);
          return currentTime < startSeconds;
        });
        
        // If we're near the beginning or between segments, show the closest one
        if (nextSegmentIndex === 0 && currentTime < parseTimeToSeconds(vttSegments[0].startTime)) {
          setActiveSegment(0); // Show first segment if we're before it
        } else if (nextSegmentIndex > 0) {
          // We're between segments, highlight the previous one
          setActiveSegment(nextSegmentIndex - 1);
        } else {
          // We're past the last segment
          setActiveSegment(vttSegments.length > 0 ? vttSegments.length - 1 : null);
        }
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
