
import React, { useState, useRef, useEffect } from 'react';
import { TranscriptionModel } from '@/components/ModelSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Upload, FileAudio, Share, Pause, Play, Cloud } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import SharePointDownloader from '@/components/SharePointDownloader';
import CloudStorageImporter from '@/components/cloud-storage/CloudStorageImporter';
import ModelSelector from '@/components/ModelSelector';
import PromptOptions from '@/components/PromptOptions';
import { createTranscriptionJob } from '@/lib/api';
import { toast } from 'sonner';
import { useLogsStore } from '@/lib/useLogsStore';

interface UploadConfigStepProps {
  onTranscriptionsCreated: (jobIdsArray: string[]) => void;
  onStepComplete: () => void;
}

const UploadConfigStep: React.FC<UploadConfigStepProps> = ({ onTranscriptionsCreated, onStepComplete }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModels, setSelectedModels] = useState<TranscriptionModel[]>(['openai', 'gemini-2.0-flash', 'phi4']);
  const [prompt, setPrompt] = useState("Please preserve all English words exactly as spoken");
  const [uploadTab, setUploadTab] = useState('direct');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [preserveEnglish, setPreserveEnglish] = useState(true);
  const [outputFormat, setOutputFormat] = useState<"vtt" | "plain">("vtt");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { addLog, startTimedLog } = useLogsStore();

  const handleFileUpload = (file: File) => {
    console.log("File uploaded in UploadConfigStep:", file.name);
    setUploadedFile(file);
    addLog(`File uploaded: ${file.name}`, "info", {
      source: "FileUpload",
      details: `Type: ${file.type}`
    });
  };
  
  const handleSharePointFileSelect = (files: File[]) => {
    if (files.length > 0) {
      console.log("SharePoint file selected:", files[0].name);
      setUploadedFile(files[0]);
      addLog(`SharePoint file selected: ${files[0].name}`, "info", {
        source: "SharePoint",
        details: `Type: ${files[0].type}`
      });
    }
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
    
    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsAudioPlaying(true);
        })
        .catch(error => {
          console.error("Error playing audio:", error);
          setIsAudioPlaying(false);
        });
    }
  };
  
  const handleAudioEnded = () => {
    setIsAudioPlaying(false);
  };

  useEffect(() => {
    let newPrompt = "";
    
    if (preserveEnglish) {
      newPrompt += "Please preserve all English words exactly as spoken. ";
    }
    
    if (outputFormat === "vtt") {
      newPrompt += "Generate output with timestamps in VTT format.";
    } else {
      newPrompt += "Generate output as plain text without timestamps.";
    }
    
    setPrompt(newPrompt.trim());
  }, [preserveEnglish, outputFormat]);
  
  const startTranscription = async () => {
    if (!uploadedFile) {
      toast("No file selected", {
        description: "Please upload an audio file before starting transcription"
      });
      return;
    }
    
    if (selectedModels.length === 0) {
      toast("No transcription models selected", {
        description: "Please select at least one transcription model"
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      
      const logOperation = startTimedLog(`Starting transcription for ${uploadedFile.name}`, "info");
      
      console.log("Starting transcription with file:", {
        name: uploadedFile.name,
        size: uploadedFile.size,
        type: uploadedFile.type,
        lastModified: uploadedFile.lastModified
      });
      
      const jobPromises = selectedModels.map(model => 
        createTranscriptionJob(uploadedFile, model, prompt)
      );
      
      const results = await Promise.all(jobPromises);
      const jobIds = results.map(result => result.jobId);
      
      console.log("Transcription jobs created:", jobIds);
      
      toast("Transcription jobs created", {
        description: `Started ${jobIds.length} transcription jobs`
      });
      
      logOperation.complete("Transcription jobs created", `Created ${jobIds.length} jobs`);
      
      onTranscriptionsCreated(jobIds);
      onStepComplete();
      
    } catch (error) {
      console.error("Error starting transcription:", error);
      
      toast("Transcription failed", {
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
      
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full shadow-md border-primary/10">
      <CardHeader>
        <CardTitle className="text-2xl">Upload & Configure</CardTitle>
        <CardDescription>
          Upload your audio file and configure transcription options
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
          <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <FileAudio className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{uploadedFile.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={toggleAudioPlayback}
              >
                {isAudioPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <audio
              ref={audioRef}
              src={URL.createObjectURL(uploadedFile)}
              className="w-full"
              controls={false}
              onEnded={handleAudioEnded}
            />
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Transcription Models</h3>
            <ModelSelector 
              selectedModels={selectedModels} 
              onModelChange={setSelectedModels} 
              disabled={isProcessing}
            />
            
            {selectedModels.length === 0 && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please select at least one transcription model
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Transcription Prompt</h3>
            <PromptOptions
              preserveEnglish={preserveEnglish}
              onPreserveEnglishChange={setPreserveEnglish}
              outputFormat={outputFormat}
              onOutputFormatChange={setOutputFormat}
              notificationsEnabled={notificationsEnabled}
              onNotificationsChange={setNotificationsEnabled}
              disabled={isProcessing}
            />
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-6">
        <Button
          variant="default"
          className="w-full"
          onClick={startTranscription}
          disabled={!uploadedFile || selectedModels.length === 0 || isProcessing}
        >
          {isProcessing ? (
            <>
              <span className="animate-pulse">Processing...</span>
            </>
          ) : (
            <>Start Transcription</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default UploadConfigStep;
