
import React from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import TranscriptionCardHeader from "./TranscriptionCardHeader";
import TranscriptionContent from "../TranscriptionContent";
import TranscriptionFooter from "../TranscriptionFooter";
import AudioControls from "../AudioControls";
import LoadingState from "./LoadingState";
import { useVttParser } from "../hooks/useVttParser";
import { TranscriptionCardProps } from "../types";

const TranscriptionCardContainer: React.FC<TranscriptionCardProps> = ({
  modelName = "",
  vttContent = "",
  prompt = "",
  onSelect = () => {},
  isSelected = false,
  audioSrc = null,
  isLoading = false,
  className = "",
  showExportOptions = false,
  showAudioControls = false,
  onExport = () => {},
  onAccept = () => {},
  onTextEdit,
  isEditable = false
}) => {
  const { segments: vttSegments, wordCount } = useVttParser(vttContent, modelName);
  
  if (isLoading) {
    return (
      <Card className="shadow-soft border-2">
        <CardContent className="p-6">
          <LoadingState />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`transition-all ${isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'} ${className}`}>
      <CardHeader className="pb-2">
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
      
      <CardContent className="h-[300px] overflow-y-auto">
        <TranscriptionContent
          vttSegments={vttSegments}
          audioSrc={audioSrc}
          isLoading={isLoading}
          vttContent={vttContent}
          modelName={modelName}
          onTextEdit={onTextEdit}
          isEditable={isEditable}
        />
      </CardContent>
      
      {audioSrc && showAudioControls && (
        <div className="px-6 pt-2 pb-0 border-t">
          <AudioControls />
        </div>
      )}
      
      <CardFooter className="flex flex-col border-t pt-4 gap-3">
        <TranscriptionFooter
          showExportOptions={showExportOptions}
          onExport={onExport}
          onAccept={onAccept}
          onSelect={onSelect}
          isSelected={isSelected}
          showAudioControls={showAudioControls}
          vttContent={vttContent}
          audioSrc={audioSrc}
          isLoading={isLoading}
        />
      </CardFooter>
    </Card>
  );
};

export default TranscriptionCardContainer;
