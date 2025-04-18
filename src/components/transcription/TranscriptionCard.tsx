import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useLogsStore } from "@/lib/useLogsStore";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import { useVttParser } from "./hooks/useVttParser";
import TranscriptionCardHeader from "./TranscriptionCardHeader";
import TranscriptionContent from "./TranscriptionContent";
import TranscriptionFooter from "./TranscriptionFooter";
import AudioControls from "./AudioControls";
import { ExportFormat, TranscriptionCardProps } from "./types";

const TranscriptionCard = ({ 
  modelName = "", 
  vttContent = "",
  prompt = "",
  onSelect = () => {},
  isSelected = false,
  audioSrc = null,
  isLoading = false,
  className = "",
  showPagination = false,
  showExportOptions = false,
  showAudioControls = false,
  onExport = (format: ExportFormat) => {},
  onAccept = () => {},
  onTextEdit,
  isEditable = false
}: TranscriptionCardProps) => {
  const [copied, setCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('vtt');
  const addLog = useLogsStore(state => state.addLog);
  const [currentlyPlayingSegment, setCurrentlyPlayingSegment] = useState<number | null>(null);
  
  const { segments: vttSegments, wordCount } = useVttParser(vttContent, modelName);
  
  const {
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
    playSegment,
    isPlayingSegment
  } = useAudioPlayer(vttSegments, audioSrc);
  
  useEffect(() => {
    console.log(`TranscriptionCard render for ${modelName}:`, { 
      hasContent: !!vttContent, 
      contentLength: vttContent?.length || 0,
      isLoading, 
      isSelected,
      hasAudio: !!audioSrc,
      segments: vttSegments.length
    });
  }, [vttContent, isLoading, modelName, audioSrc, vttSegments.length, isSelected]);
  
  useEffect(() => {
    if (isPlayingSegment) {
      setCurrentlyPlayingSegment(activeSegment);
    } else {
      setCurrentlyPlayingSegment(null);
    }
  }, [isPlayingSegment, activeSegment]);
  
  const handleCopy = () => {
    if (vttContent) {
      navigator.clipboard.writeText(vttContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      addLog(`Copied ${modelName} transcription to clipboard`, "info", {
        source: "TranscriptionCard",
        details: `Content length: ${vttContent.length} characters`
      });
    }
  };

  const handleTextEdit = (editedVttContent: string) => {
    if (onTextEdit) {
      onTextEdit(editedVttContent);
    }
  };

  const handlePlaySegment = (index: number) => {
    setCurrentlyPlayingSegment(index);
    playSegment(index);
  };

  useEffect(() => {
    if (showAudioControls && audioSrc) {
      setShowAudioPlayer(true);
    }
  }, [showAudioControls, audioSrc, setShowAudioPlayer]);

  return (
    <Card className={`transition-all ${isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'} ${className}`}>
      <CardHeader className={`pb-2`}>
        <TranscriptionCardHeader
          modelName={modelName}
          prompt={prompt}
          isSelected={isSelected}
          wordCount={wordCount}
          segmentCount={vttSegments.length}
          isLoading={isLoading}
          vttContent={vttContent}
        />
      </CardHeader>
      
      <CardContent className={`h-[300px] overflow-y-auto ${isLoading ? 'flex items-center justify-center' : ''}`}>
        <TranscriptionContent
          vttSegments={vttSegments}
          activeSegment={activeSegment}
          audioSrc={audioSrc}
          isLoading={isLoading}
          vttContent={vttContent}
          modelName={modelName}
          onSegmentClick={jumpToSegment}
          onPlaySegment={handlePlaySegment}
          isEditable={isEditable}
          onTextEdit={handleTextEdit}
          isPlayingSegment={isPlayingSegment}
          currentlyPlayingSegment={currentlyPlayingSegment}
        />
      </CardContent>
      
      {audioSrc && (
        <div className={`px-6 pt-2 pb-0 border-t ${showAudioPlayer ? '' : 'hidden'}`}>
          <audio ref={audioRef} src={audioSrc} preload="metadata" />
          <AudioControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            isMuted={isMuted}
            isAudioLoaded={isAudioLoaded}
            onPlayPause={togglePlay}
            onSeek={handleSeek}
            onVolumeChange={handleVolumeChange}
            onMuteToggle={toggleMute}
            onForward={jumpForward}
            onBackward={jumpBackward}
          />
        </div>
      )}
      
      <CardFooter className="flex flex-col border-t pt-4 gap-3">
        <TranscriptionFooter
          showAudioPlayer={showAudioPlayer}
          setShowAudioPlayer={setShowAudioPlayer}
          copied={copied}
          handleCopy={handleCopy}
          isLoading={isLoading}
          vttContent={vttContent}
          audioSrc={audioSrc}
          showExportOptions={showExportOptions}
          exportFormat={exportFormat}
          setExportFormat={setExportFormat}
          onExport={() => onExport(exportFormat)}
          onAccept={onAccept}
          onSelect={onSelect}
          isSelected={isSelected}
          showAudioControls={showAudioControls}
        />
      </CardFooter>
    </Card>
  );
};

export default TranscriptionCard;
