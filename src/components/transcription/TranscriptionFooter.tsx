import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, Copy, Download, Save, Headphones } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExportFormat } from "./types";

interface TranscriptionFooterProps {
  showAudioPlayer: boolean;
  setShowAudioPlayer: (show: boolean) => void;
  copied: boolean;
  handleCopy: () => void;
  isLoading: boolean;
  vttContent: string;
  audioSrc: string | null;
  showExportOptions: boolean;
  exportFormat: ExportFormat;
  setExportFormat: (format: ExportFormat) => void;
  onExport: (format: ExportFormat) => void;
  onAccept: () => void;
  onSelect: () => void;
  isSelected: boolean;
  showAudioControls: boolean;
  onRetry?: () => void;
  isRetrying?: boolean;
  showRetryButton?: boolean;
}

const TranscriptionFooter: React.FC<TranscriptionFooterProps> = ({
  showAudioPlayer,
  setShowAudioPlayer,
  copied,
  handleCopy,
  isLoading,
  vttContent,
  audioSrc,
  showExportOptions,
  exportFormat,
  setExportFormat,
  onExport,
  onAccept,
  onSelect,
  isSelected,
  showAudioControls,
  onRetry,
  isRetrying = false,
  showRetryButton = false
}) => {
  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between w-full">
        <div className="flex space-x-2">
          {audioSrc && !showAudioControls && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowAudioPlayer(!showAudioPlayer)}
              className="flex items-center gap-1.5"
            >
              <Headphones className="h-4 w-4" />
              {showAudioPlayer ? "Hide Player" : "Show Player"}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleCopy} disabled={isLoading || !vttContent}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {showRetryButton && onRetry && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={onRetry}
              disabled={isRetrying}
              className="text-xs border-red-200 hover:border-red-300 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Retry'}
            </Button>
          )}
          
          <Button size="sm" onClick={onSelect} disabled={isLoading || !vttContent} variant={isSelected ? "secondary" : "default"}>
            {isSelected ? "Selected" : "Select"}
          </Button>
        </div>
      </div>

      {showExportOptions && vttContent && !isLoading && (
        <div className="w-full space-y-3 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Select 
              value={exportFormat}
              onValueChange={(value) => setExportFormat(value as ExportFormat)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vtt">VTT Subtitles</SelectItem>
                <SelectItem value="srt">SRT Subtitles</SelectItem>
                <SelectItem value="text">Plain Text</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onExport(exportFormat)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={onAccept}
            >
              <Save className="h-4 w-4 mr-2" />
              Accept
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptionFooter;
