
import React from "react";
import { Button } from "@/components/ui/button";
import { Check, Copy, Download, Save, Headphones } from "lucide-react";
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
  onExport: () => void;
  onAccept: () => void;
  onSelect: () => void;
  isSelected: boolean;
  showAudioControls: boolean;
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
  showAudioControls
}) => {
  return (
    <div className="flex flex-col border-t pt-4 gap-3">
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
        <Button size="sm" onClick={onSelect} disabled={isLoading || !vttContent} variant={isSelected ? "secondary" : "default"}>
          {isSelected ? "Selected" : "Select"}
        </Button>
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
              onClick={onExport}
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
