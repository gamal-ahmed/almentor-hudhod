
import React, { useState, useRef } from 'react';
import { useLogsStore } from '@/lib/useLogsStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Upload, FileAudio, Share, Pause, Play, Cloud } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import SharePointDownloader from '@/components/SharePointDownloader';
import CloudStorageImporter from '@/components/cloud-storage/CloudStorageImporter';
import ModelSelector, { TranscriptionModel } from '@/components/ModelSelector';
import PromptOptions from '@/components/PromptOptions';
import { createTranscriptionJob } from '@/lib/api';
import { toast } from 'sonner';

interface UploadConfigStepProps {
  onJobCreated: (jobId: string) => void;
}

const UploadConfigStep: React.FC<UploadConfigStepProps> = ({ onJobCreated }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<TranscriptionModel>('openai');
  const [promptText, setPromptText] = useState<string>('');
  const [uploadTab, setUploadTab] = useState<string>('direct');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { addLog } = useLogsStore();
  const navigate = useNavigate();

  const handleFileUpload = (file: File) => {
    console.log("File uploaded:", file.name);
    setUploadedFile(file);
    addLog(`File uploaded: ${file.name}`, "info", {
      source: "FileUpload",
      details: `Type: ${file.type}, Size: ${Math.round(file.size / 1024)} KB`
    });
  };
  
  const handleSharePointFileSelect = (file: File) => {
    console.log("SharePoint file selected:", file.name);
    setUploadedFile(file);
    addLog(`SharePoint file selected: ${file.name}`, "info", {
      source: "SharePoint",
      details: `Type: ${file.type}`
    });
  };
  
  const handleCloudStorageFilesSelect = (files: File[]) => {
    if (files.length > 0) {
      console.log("Cloud storage file selected:", files[0].name);
      setUploadedFile(files[0]);
      addLog(`Cloud storage file selected: ${files[0].name}`, "info", {
        source: "CloudStorage",
        details: `Type: ${files[0].type}`
      });
    }
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

  const handleModelChange = (model: TranscriptionModel) => {
    setSelectedModel(model);
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
      
      // Create a transcription job
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
        details: error.message || "Unknown error"
      });
      
      toast.error("Failed to start transcription", {
        description: error.message || "Please try again or contact support."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="border-border/50 shadow-soft">
      <CardHeader>
        <CardTitle>Transcribe Audio</CardTitle>
        <CardDescription>
          Upload an audio file to transcribe or use one from cloud storage
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs defaultValue={uploadTab} onValueChange={setUploadTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="direct" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span>Direct Upload</span>
            </TabsTrigger>
            <TabsTrigger value="sharepoint" className="flex items-center gap-2">
              <Share className="h-4 w-4" />
              <span>SharePoint</span>
            </TabsTrigger>
            <TabsTrigger value="cloud" className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              <span>Cloud Storage</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="direct" className="space-y-4">
            <FileUpload 
              onFileUpload={handleFileUpload}
              isUploading={isProcessing}
            />
          </TabsContent>
          
          <TabsContent value="sharepoint" className="space-y-4">
            <SharePointDownloader 
              onFilesQueued={handleSharePointFileSelect}
              isProcessing={isProcessing}
            />
          </TabsContent>
          
          <TabsContent value="cloud" className="space-y-4">
            <CloudStorageImporter
              onFilesSelected={handleCloudStorageFilesSelect}
              isProcessing={isProcessing}
            />
          </TabsContent>
        </Tabs>
        
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
              {/* Hidden audio element for playback */}
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
          <div className="text-sm font-medium">Transcription Model</div>
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={handleModelChange}
            disabled={isProcessing}
          />
        </div>
        
        <div className="space-y-2">
          <div className="text-sm font-medium">Prompt (Optional)</div>
          <PromptOptions
            prompt={promptText}
            onPromptChange={handlePromptChange}
            disabled={isProcessing}
          />
        </div>
        
        {!uploadedFile && (
          <Alert variant="default" className="bg-primary/5 border-primary/20">
            <AlertCircle className="h-4 w-4 text-primary" />
            <AlertDescription>
              Please upload or select an audio file to begin transcription.
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
