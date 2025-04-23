
import { useState, useRef, useEffect } from 'react';
import { useLogsStore } from '@/lib/useLogsStore';
import { useAudioEventHandlers } from './useAudioEventHandlers';
import { useAudioControls } from './useAudioControls';
import { VTTSegment } from '../types';

export const useAudioPlayer = (vttSegments: VTTSegment[], audioSrc: string | null) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const [currentlyPlayingSegment, setCurrentlyPlayingSegment] = useState<number | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const addLog = useLogsStore(state => state.addLog);

  // Set up event handlers
  const { setupEventListeners } = useAudioEventHandlers({
    audioRef,
    vttSegments,
    setIsPlaying,
    setActiveSegment,
    setCurrentTime,
    setDuration,
    setIsAudioLoaded,
  });

  // Initialize audio control functions
  const {
    togglePlay,
    handleSeek,
    handleVolumeChange,
    toggleMute,
    jumpForward,
    jumpBackward,
    jumpToSegment,
    playSegment,
    isPlayingSegment
  } = useAudioControls({
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
  });

  // Set up event listeners when component mounts
  useEffect(() => {
    const cleanup = setupEventListeners();
    return cleanup;
  }, [vttSegments, setupEventListeners]);
  
  // Update audio element when volume or mute state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Update audio src when it changes
  useEffect(() => {
    if (audioRef.current && audioSrc) {
      // Reset play state when audio source changes
      setIsPlaying(false);
      setCurrentTime(0);
      setActiveSegment(null);
      setCurrentlyPlayingSegment(null);
    }
  }, [audioSrc]);

  // Update currentlyPlayingSegment when isPlayingSegment or activeSegment changes
  useEffect(() => {
    if (isPlayingSegment) {
      setCurrentlyPlayingSegment(activeSegment);
    } else {
      setCurrentlyPlayingSegment(null);
    }
  }, [isPlayingSegment, activeSegment]);

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
    currentlyPlayingSegment,
    isPlayingSegment,
    togglePlay,
    handleSeek,
    handleVolumeChange,
    toggleMute,
    jumpForward,
    jumpBackward,
    jumpToSegment,
    playSegment,
    // Aliases for function names used in AudioControls component
    handlePlayPause: togglePlay,
    handleMuteToggle: toggleMute,
    handleForward: jumpForward,
    handleBackward: jumpBackward
  };
};
