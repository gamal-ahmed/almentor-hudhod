
import { RefObject, useRef } from 'react';
import { parseTimeToSeconds } from '../utils/timeUtils';
import { VTTSegment } from '../types';

interface UseSegmentPlaybackProps {
  audioRef: RefObject<HTMLAudioElement>;
  vttSegments: VTTSegment[];
  addLog: (message: string, level: string, options?: any) => void;
}

export const useSegmentPlayback = ({ audioRef, vttSegments, addLog }: UseSegmentPlaybackProps) => {
  const segmentPlaybackRef = useRef<{
    active: boolean;
    segmentIndex: number | null;
    endTime: number | null;
    cleanupTimer: number | null;
    isPaused: boolean;
  }>({
    active: false,
    segmentIndex: null,
    endTime: null,
    cleanupTimer: null,
    isPaused: false
  });

  const safeParseTimeToSeconds = (timeString: string): number | null => {
    try {
      if (!timeString.match(/^\d{2}:\d{2}:\d{2}\.\d{3}$/)) {
        addLog(`Invalid time format: ${timeString}`, "warning", {
          source: "TranscriptionCard"
        });
        return null;
      }
      
      const seconds = parseTimeToSeconds(timeString);
      
      if (!Number.isFinite(seconds) || seconds < 0) {
        addLog(`Invalid time value after parsing: ${timeString} -> ${seconds}`, "warning", {
          source: "TranscriptionCard"
        });
        return null;
      }
      
      return seconds;
    } catch (error: any) {
      addLog(`Error parsing time: ${timeString} - ${error.message}`, "error", {
        source: "TranscriptionCard",
        details: error.stack
      });
      return null;
    }
  };

  const stopSegmentPlayback = () => {
    if (segmentPlaybackRef.current.active && segmentPlaybackRef.current.cleanupTimer) {
      window.clearTimeout(segmentPlaybackRef.current.cleanupTimer);
      segmentPlaybackRef.current = {
        active: false,
        segmentIndex: null,
        endTime: null,
        cleanupTimer: null,
        isPaused: false
      };
    }
  };

  return {
    segmentPlaybackRef,
    safeParseTimeToSeconds,
    stopSegmentPlayback
  };
};
