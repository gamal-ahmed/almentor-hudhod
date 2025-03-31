
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Loader2, Upload, FileAudio, Cog, FileText, PlayCircle, PauseCircle } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import ModelSelector from "@/components/ModelSelector";
import PromptOptions from "@/components/PromptOptions";
import SharePointDownloader from "@/components/SharePointDownloader";
import FileQueue from "@/components/FileQueue";

interface UploadConfigStepProps {
  file: File | null;
  audioUrl: string | null;
  isAudioPlaying: boolean;
  toggleAudioPlayback: () => void;
  audioRef: React.RefObject<HTMLAudioElement>;
  handleFileUpload: (file: File) => void;
  isUploading: boolean;
  selectedModels: string[];
  setSelectedModels: (models: string[]) => void;
  isProcessing: boolean;
  processTranscriptions: (file: File) => void;
  transcriptionPrompt: string;
  preserveEnglish: boolean;
  handlePreserveEnglishChange: (checked: boolean) => void;
  outputFormat: "vtt" | "plain";
  handleOutputFormatChange: (format: "vtt" | "plain") => void;
  notificationsEnabled: boolean;
  handleNotificationsChange: (enabled: boolean) => void;
  fileQueue: File[];
  currentQueueIndex: number;
  handleFilesQueued: (files: File[]) => void;
  processNextInQueue: () => void;
  skipCurrentInQueue: () => void;
  resetQueue: () => void;
  goToNextStep: () => void;
}

const UploadConfigStep: React.FC<UploadConfigStepProps> = ({
  file,
  audioUrl,
  isAudioPlaying,
  toggleAudioPlayback,
  audioRef,
  handleFileUpload,
  isUploading,
  selectedModels,
  setSelectedModels,
  isProcessing,
  processTranscriptions,
  transcriptionPrompt,
  preserveEnglish,
  handlePreserveEnglishChange,
  outputFormat,
  handleOutputFormatChange,
  notificationsEnabled,
  handleNotificationsChange,
  fileQueue,
  currentQueueIndex,
  handleFilesQueued,
  processNextInQueue,
  skipCurrentInQueue,
  resetQueue,
  goToNextStep,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left Column */}
      <Card className="p-6 border-l-4 border-l-blue-500 shadow-md">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FileAudio className="mr-2 h-5 w-5 text-blue-500" />
          Step 1: Upload Audio File
        </h2>
        
        <div className="space-y-4">
          <FileUpload onFileUpload={handleFileUpload} isUploading={isUploading} />
          
          {file && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <div className="truncate mr-2">
                    <span className="font-medium text-sm">File:</span> 
                    <span className="ml-1 text-sm truncate">{file.name}</span>
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({Math.round(file.size / 1024)} KB)
                    </span>
                  </div>
                </div>
                
                {audioUrl && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1 h-7 text-xs"
                    onClick={toggleAudioPlayback}
                  >
                    {isAudioPlaying ? <PauseCircle className="h-3 w-3" /> : <PlayCircle className="h-3 w-3" />}
                    {isAudioPlaying ? "Pause" : "Play"}
                  </Button>
                )}
              </div>
              
              {audioUrl && (
                <audio 
                  ref={audioRef} 
                  src={audioUrl} 
                  onEnded={() => setIsAudioPlaying(false)}
                  onPause={() => setIsAudioPlaying(false)}
                  onPlay={() => setIsAudioPlaying(true)}
                  className="hidden"
                />
              )}
            </div>
          )}
          
          <details className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
            <summary className="cursor-pointer font-medium flex items-center text-sm">
              <Upload className="h-4 w-4 mr-2" />
              SharePoint Files & Queue
            </summary>
            <div className="pt-3 space-y-3">
              <SharePointDownloader 
                onFilesQueued={handleFilesQueued}
                isProcessing={isProcessing}
              />
              
              {fileQueue.length > 0 && (
                <FileQueue
                  files={fileQueue}
                  currentIndex={currentQueueIndex}
                  onProcessNext={processNextInQueue}
                  onSkip={skipCurrentInQueue}
                  onReset={resetQueue}
                  isProcessing={isProcessing}
                  notificationsEnabled={notificationsEnabled}
                />
              )}
            </div>
          </details>
        </div>
      </Card>
      
      {/* Right Column */}
      <Card className="p-6 border-l-4 border-l-green-500 shadow-md">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Cog className="mr-2 h-5 w-5 text-green-500" />
          Step 2: Configure Transcription
        </h2>
        
        <div className="space-y-4">
          <div className="space-y-3">
            <label className="block text-sm font-medium mb-1">
              Select Transcription Models:
            </label>
            <ModelSelector 
              selectedModels={selectedModels} 
              onModelChange={setSelectedModels}
              disabled={isProcessing || !file}
            />
          </div>
          
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-3">
            <details open>
              <summary className="cursor-pointer font-medium text-sm">
                Transcription Options
              </summary>
              <div className="pt-3">
                <PromptOptions 
                  preserveEnglish={preserveEnglish}
                  onPreserveEnglishChange={handlePreserveEnglishChange}
                  outputFormat={outputFormat}
                  onOutputFormatChange={handleOutputFormatChange}
                  notificationsEnabled={notificationsEnabled}
                  onNotificationsChange={handleNotificationsChange}
                  disabled={isProcessing}
                />
                
                <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-medium">Generated Prompt:</p>
                  <p className="text-xs text-muted-foreground mt-1">{transcriptionPrompt || "No prompt generated yet"}</p>
                </div>
              </div>
            </details>
          </div>
          
          <div className="pt-4 space-y-3">
            <Button 
              onClick={() => file && processTranscriptions(file)} 
              disabled={isProcessing || !file || selectedModels.length === 0}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Transcription...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Start Transcription Process
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={goToNextStep}
              disabled={!file}
              className="w-full text-sm"
            >
              {file ? "Skip to Results" : "Please Upload a File First"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UploadConfigStep;
