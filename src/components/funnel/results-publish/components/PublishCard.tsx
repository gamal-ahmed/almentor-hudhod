
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, AlertCircle, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import VideoIdInput from "@/components/VideoIdInput";
import { ExportFormat } from "@/components/transcription/types";

interface PublishCardProps {
  selectedTranscription: string | null;
  selectedModel: string | null;
  videoId: string;
  setVideoId: (id: string) => void;
  isPublishing: boolean;
  onPublishClick: () => void;
  exportFormat: ExportFormat;
  setExportFormat: (format: ExportFormat) => void;
  onExportClick: () => void;
}

const PublishCard: React.FC<PublishCardProps> = ({
  selectedTranscription,
  selectedModel,
  videoId,
  setVideoId,
  isPublishing,
  onPublishClick,
  exportFormat,
  setExportFormat,
  onExportClick
}) => {
  const getModelDisplayName = (model: string) => {
    return model === "openai" 
      ? "OpenAI Whisper" 
      : model === "gemini-2.0-flash" 
        ? "Gemini 2.0 Flash" 
        : "Microsoft Phi-4";
  };

  return (
    <Card className={`p-5 border-l-4 ${selectedTranscription ? 'border-l-amber-500' : 'border-l-gray-300'} shadow-md transition-colors duration-300 ${!selectedTranscription ? 'opacity-90' : ''}`}>
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <Send className={`mr-2 h-5 w-5 ${selectedTranscription ? 'text-amber-500' : 'text-gray-400'}`} />
        Publish to Brightcove
      </h2>
      
      {!selectedTranscription && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md mb-4 text-sm flex items-start">
          <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
          <p>Select a transcription from the transcription jobs or results tab to continue.</p>
        </div>
      )}
      
      <div className="space-y-4">
        <VideoIdInput 
          videoId={videoId} 
          onChange={setVideoId}
          disabled={isPublishing || !selectedTranscription}
        />
        
        <Button 
          className={`w-full ${selectedTranscription 
            ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700' 
            : 'bg-gray-200 dark:bg-gray-700'}`}
          disabled={isPublishing || !selectedTranscription || !videoId}
          onClick={onPublishClick}
        >
          <Send className="mr-2 h-4 w-4" />
          Publish Caption
        </Button>
        
        <div className="border-t pt-4 space-y-3">
          <h3 className="text-sm font-medium">Export Options</h3>
          <div className="flex gap-2">
            <Select 
              value={exportFormat} 
              onValueChange={(value) => setExportFormat(value as ExportFormat)}
              disabled={!selectedTranscription}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vtt">VTT Format</SelectItem>
                <SelectItem value="srt">SRT Format</SelectItem>
                <SelectItem value="text">Plain Text</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            variant="outline"
            onClick={onExportClick}
            disabled={!selectedTranscription}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Transcription
          </Button>
        </div>
        
        {selectedTranscription && selectedModel && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md text-sm">
            <p className="font-medium">Selected Transcription:</p>
            <p className="text-muted-foreground mt-1">
              {getModelDisplayName(selectedModel)}
            </p>
            <p className="mt-2 font-medium">Transcription Length:</p>
            <p className="text-muted-foreground">{selectedTranscription.length} characters</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PublishCard;
