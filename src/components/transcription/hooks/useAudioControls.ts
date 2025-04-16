
import { RefObject } from 'react';
import { useSegmentPlayback } from './useSegmentPlayback';
import { usePlaybackControls } from './usePlaybackControls';
import { VTTSegment } from '../types';

interface UseAudioControlsProps {
  audioRef: RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  duration: number;
  volume: number;
  isMuted: boolean;
  vttSegments: VTTSegment[];
  setVolume: (volume: number) => void;
  setIsMuted: (isMuted: boolean) => void;
  setCurrentTime: (time: number) => void;
  addLog: (message: string, level: string, options?: any) => void;
}

export const useAudioControls = ({
  audioRef,
  isPlaying,
  duration,
  volume,
  isMuted,
  vttSegments,
  setVolume,
  setIsMuted,
  setCurrentTime,
  addLog
}: UseAudioControlsProps) => {
  const { segmentPlaybackRef, safeParseTimeToSeconds, stopSegmentPlayback } = useSegmentPlayback({
    audioRef,
    vttSegments,
    addLog
  });

  const {
    handleSeek,
    jumpForward,
    jumpBackward,
    jumpToSegment
  } = usePlaybackControls({
    audioRef,
    duration,
    vttSegments,
    setCurrentTime,
    stopSegmentPlayback,
    safeParseTimeToSeconds,
    addLog
  });

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (segmentPlaybackRef.current.active) {
      segmentPlaybackRef.current.isPaused = !segmentPlaybackRef.current.isPaused;
      if (segmentPlaybackRef.current.isPaused) {
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
      return;
    }
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

  const playSegment = (index: number) => {
    if (!audioRef.current || !vttSegments[index]) return;
    
    try {
      stopSegmentPlayback();
      
      const startTime = safeParseTimeToSeconds(vttSegments[index].startTime);
      const endTime = safeParseTimeToSeconds(vttSegments[index].endTime);
      
      if (startTime === null || endTime === null) {
        addLog(`Could not play segment ${index + 1} due to invalid timestamps: start=${vttSegments[index].startTime}, end=${vttSegments[index].endTime}`, "warning", {
          source: "TranscriptionCard"
        });
        return;
      }
      
      segmentPlaybackRef.current = {
        active: true,
        segmentIndex: index,
        endTime: endTime,
        cleanupTimer: null,
        isPaused: false
      };
      
      audioRef.current.currentTime = startTime;
      
      const handleSegmentTimeUpdate = () => {
        if (!audioRef.current || !segmentPlaybackRef.current.active) return;
        
        if (audioRef.current.currentTime >= (segmentPlaybackRef.current.endTime || 0)) {
          audioRef.current.pause();
          audioRef.current.removeEventListener('timeupdate', handleSegmentTimeUpdate);
          stopSegmentPlayback();
        }
      };
      
      audioRef.current.addEventListener('timeupdate', handleSegmentTimeUpdate);
      
      audioRef.current.play().catch(error => {
        console.error('Error playing audio segment:', error);
        addLog(`Error playing audio segment: ${error.message}`, "error", {
          source: "TranscriptionCard"
        });
        audioRef.current?.removeEventListener('timeupdate', handleSegmentTimeUpdate);
        stopSegmentPlayback();
      });
      
      const safetyDuration = (endTime - startTime) * 1000 + 500;
      
      const timerId = window.setTimeout(() => {
        if (audioRef.current && segmentPlaybackRef.current.active) {
          audioRef.current.pause();
          audioRef.current.removeEventListener('timeupdate', handleSegmentTimeUpdate);
          stopSegmentPlayback();
        }
      }, safetyDuration);
      
      segmentPlaybackRef.current.cleanupTimer = timerId as unknown as number;
      
      addLog(`Playing segment ${index + 1}`, "debug", {
        source: "TranscriptionCard",
        details: `Start: ${vttSegments[index].startTime}, End: ${vttSegments[index].endTime}`
      });
    } catch (error: any) {
      console.error('Error playing segment:', error);
      addLog(`Error playing segment: ${error.message}`, "error", {
        source: "TranscriptionCard",
        details: error.stack
      });
    }
  };

  return {
    togglePlay,
    handleSeek,
    handleVolumeChange,
    toggleMute,
    jumpForward,
    jumpBackward,
    jumpToSegment,
    playSegment,
    isPlayingSegment: segmentPlaybackRef.current.active,
    isSegmentPaused: segmentPlaybackRef.current.isPaused
  };
};
