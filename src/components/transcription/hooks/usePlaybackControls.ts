
import { RefObject } from 'react';
import { VTTSegment } from '../types';

interface UsePlaybackControlsProps {
  audioRef: RefObject<HTMLAudioElement>;
  duration: number;
  vttSegments: VTTSegment[];
  setCurrentTime: (time: number) => void;
  stopSegmentPlayback: () => void;
  safeParseTimeToSeconds: (timeString: string) => number | null;
  addLog: (message: string, level: string, options?: any) => void;
}

export const usePlaybackControls = ({
  audioRef,
  duration,
  vttSegments,
  setCurrentTime,
  stopSegmentPlayback,
  safeParseTimeToSeconds,
  addLog
}: UsePlaybackControlsProps) => {
  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    
    stopSegmentPlayback();
    
    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const jumpForward = () => {
    if (!audioRef.current) return;
    
    stopSegmentPlayback();
    
    audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
  };

  const jumpBackward = () => {
    if (!audioRef.current) return;
    
    stopSegmentPlayback();
    
    audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
  };

  const jumpToSegment = (index: number) => {
    if (!audioRef.current || !vttSegments[index]) return;
    
    try {
      stopSegmentPlayback();
      
      const startTime = safeParseTimeToSeconds(vttSegments[index].startTime);
      
      if (startTime === null) {
        addLog(`Could not jump to segment ${index + 1} due to invalid timestamp: ${vttSegments[index].startTime}`, "warning", {
          source: "TranscriptionCard"
        });
        return;
      }
      
      audioRef.current.currentTime = startTime;
    } catch (error: any) {
      console.error('Error jumping to segment:', error);
      addLog(`Error jumping to segment: ${error.message}`, "error", {
        source: "TranscriptionCard",
        details: error.stack
      });
    }
  };

  return {
    handleSeek,
    jumpForward,
    jumpBackward,
    jumpToSegment
  };
};
