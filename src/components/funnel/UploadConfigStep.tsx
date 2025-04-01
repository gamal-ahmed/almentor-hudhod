import React, { useState, useRef } from 'react';
import { useLogsStore } from '@/lib/useLogsStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Upload, FileAudio, Pause, Play, UploadCloud, ListChecks, Sliders, Sparkles, Wand2, Link2 } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import UrlAudioProcessor from '@/components/UrlAudioProcessor';
import ModelSelector, { TranscriptionModel } from '@/components/ModelSelector';
import PromptOptions from '@/components/PromptOptions';
import { createTranscriptionJob } from '@/lib/api';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UploadConfigStepProps {
  onJobCreated: (jobId: string) => void;
}

const UploadConfigStep: React.FC<UploadConfigStepProps> = ({ onJobCreated }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<TranscriptionModel>('openai');
  const [promptText, setPromptText] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { addLog } = useLogsStore();
  const navigate = useNavigate();

  const handleFileUpload = (files: File[] | File) => {
    const file = Array.isArray(files) ? files[0] : files;
    if (!file) return;
    
    console.log("File uploaded:", file.name);
    setUploadedFile(file);
    addLog(`File uploaded: ${file.name}`, "info", {
      source: "FileUpload",
      details: `Type: ${file.type}, Size: ${Math.round(file.size / 1024)} KB`
    });
  };
  
  const handleUrlProcessedAudio = (file: File) => {
    console.log("URL-processed audio:", file.name);
    setUploadedFile(file);
    addLog(`URL-processed audio: ${file.name}`, "info", {
      source: "UrlAudioProcessor",
      details: `Type: ${file.type}, Size: ${Math.round(file.size / 1024)} KB`
    });
    setShowUrlInput(false);
  };
  
  const toggleAudioPlayback = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleModelChange = (models: TranscriptionModel[]) => {
    if (models.length > 0) {
      setSelectedModel(models[0]);
    }
  };

  const handlePromptChange = (prompt: string) => {
    setPromptText(prompt);
  };

  const handleSubmit = async () => {
    if (!uploadedFile) {
      toast.error("No file selected", {
        description: "Please upload an audio file to transcribe."
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      addLog(`Starting transcription job`, "info", {
        source: "TranscriptionJob",
        details: `Model: ${selectedModel}, File: ${uploadedFile.name}`
      });
      
      const { jobId } = await createTranscriptionJob(
        uploadedFile,
        selectedModel,
        promptText
      );
      
      if (jobId) {
        addLog(`Transcription job created: ${jobId}`, "success", {
          source: "TranscriptionJob",
          details: `The job has been queued for processing.`
        });
        
        toast.success("Transcription started", {
          description: "Your audio is being processed."
        });
        
        onJobCreated(jobId);
      } else {
        throw new Error("No job ID returned");
      }
    } catch (error) {
      console.error("Error starting transcription:", error);
      addLog(`Transcription job failed to start`, "error", {
        source: "TranscriptionJob",
        details: (error as Error).message || "Unknown error"
      });
      
      toast.error("Failed to start transcription", {
        description: (error as Error).message || "Please try again or contact support."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleUrlInput = () => {
    setShowUrlInput(!showUrlInput);
  };

  return (
    <Card className="border-border/50 shadow-soft">
      <CardHeader>
        <CardTitle>Transcribe Audio</CardTitle>
        <CardDescription>
          Upload an audio file or use a URL to transcribe
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Badge variant="outline" className="rounded-full px-3 bg-blue-500/10 text-blue-500 border-blue-500/20">1</Badge>
            <h3 className="flex items-center font-medium">
              Upload Audio File
              <span className="inline-flex ml-2 items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                Required
              </span>
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full">
                    <span className="sr-only">Info</span>
                    ?
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Upload audio files to be transcribed. Supported formats: MP3, WAV, M4A, FLAC</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="bg-muted/40 rounded-lg border border-border/50 p-4 transition-all duration-300 hover:border-primary/30 hover:bg-muted/60">
            <FileUpload 
              onFileUpload={handleFileUpload}
              isUploading={isProcessing}
            />
          </div>
          
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-muted-foreground">
              MP3, M4A, or WAV files (max 100MB)
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1 h-7"
              onClick={toggleUrlInput}
            >
              <Link2 className="h-3.5 w-3.5" />
              {showUrlInput ? "Hide URL Option" : "Or Use URL"}
            </Button>
          </div>
          
          {showUrlInput && (
            <div className="mt-2">
              <UrlAudioProcessor 
                onAudioProcessed={handleUrlProcessedAudio}
                isProcessing={isProcessing}
              />
            </div>
          )}
        </div>
        
        {uploadedFile && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Selected File</div>
            <div className="flex items-center gap-2 p-3 bg-accent/50 rounded-md">
              <div className="p-2 bg-primary/10 rounded-full">
                <FileAudio className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{uploadedFile.name}</div>
                <div className="text-xs text-muted-foreground">
                  {Math.round(uploadedFile.size / 1024)} KB
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={toggleAudioPlayback}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <audio 
                ref={audioRef} 
                src={uploadedFile ? URL.createObjectURL(uploadedFile) : ''} 
                onEnded={handleAudioEnded}
                className="hidden"
              />
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Badge variant="outline" className="rounded-full px-3 bg-indigo-500/10 text-indigo-500 border-indigo-500/20">2</Badge>
            <h3 className="flex items-center font-medium">
              Select AI Models
              <span className="inline-flex ml-2 items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                Required
              </span>
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full">
                    <span className="sr-only">Info</span>
                    ?
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Choose one or more AI models to compare transcription results</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="bg-muted/40 rounded-lg border border-border/50 p-4 transition-all duration-300 hover:border-primary/30 hover:bg-muted/60">
            <div className="flex items-center mb-3">
              <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
              <h3 className="font-medium text-sm">Transcription AI Models</h3>
            </div>
            <ModelSelector 
              selectedModel={selectedModel}
              selectedModels={[selectedModel]}
              onModelChange={handleModelChange}
              disabled={isProcessing}
            />
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Badge variant="outline" className="rounded-full px-3 bg-primary/10 text-primary border-primary/20">3</Badge>
            <h3>Configuration Options</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full">
                    <span className="sr-only">Info</span>
                    ?
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Configure advanced settings for transcription</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Collapsible 
            open={showAdvancedOptions}
            onOpenChange={setShowAdvancedOptions}
            className="border rounded-lg overflow-hidden bg-muted/40 transition-all duration-300 hover:border-primary/30 hover:bg-muted/60"
          >
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full flex items-center justify-between p-3 h-auto rounded-none border-0"
              >
                <div className="flex items-center">
                  <Sliders className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>Advanced Options</span>
                </div>
                {showAdvancedOptions ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 border-t bg-background/80 animate-slide-up">
              <PromptOptions 
                prompt={promptText}
                onPromptChange={handlePromptChange}
                disabled={isProcessing}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>
        
        {!uploadedFile && (
          <Alert variant="default" className="bg-primary/5 border-primary/20">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription>
              Please upload an audio file or provide a URL to begin transcription.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      
      <CardFooter>
        <Button
          onClick={handleSubmit}
          disabled={!uploadedFile || isProcessing}
          className="w-full shine-effect bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300"
        >
          {isProcessing ? 'Processing...' : 'Start Transcription'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UploadConfigStep;
