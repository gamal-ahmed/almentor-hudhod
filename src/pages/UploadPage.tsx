
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { FileAudio, Upload, Clock, ArrowRight } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import { useLogsStore } from "@/lib/useLogsStore";
import Header from '@/components/Header';
import { createTranscriptionJob } from '@/lib/api';
import SharePointDownloader from "@/components/SharePointDownloader";
import FileQueue from "@/components/FileQueue";
import { TranscriptionModel } from "@/components/ModelSelector";

const UploadPage = () => {
  // Main state
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModels] = useState<TranscriptionModel[]>(["openai", "gemini-2.0-flash", "phi4"]);
  
  // SharePoint Queue state
  const [fileQueue, setFileQueue] = useState<File[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(0);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addLog } = useLogsStore();
  
  // Handle SharePoint files being queued
  const handleFilesQueued = (files: File[]) => {
    setFileQueue(files);
    setCurrentQueueIndex(0);
    addLog(`Queued ${files.length} files from SharePoint`, "info", {
      details: `Files: ${files.map(f => f.name).join(", ")}`,
      source: "SharePoint"
    });
  };
  
  // When a file is uploaded
  const handleFileUpload = async (uploadedFile: File) => {
    try {
      setIsUploading(true);
      setFile(uploadedFile);
      const newAudioUrl = URL.createObjectURL(uploadedFile);
      setAudioUrl(newAudioUrl);
      
      addLog(`File selected: ${uploadedFile.name}`, "info", {
        details: `Size: ${Math.round(uploadedFile.size / 1024)} KB | Type: ${uploadedFile.type}`,
        source: "FileUpload"
      });
      
      toast({
        title: "File Selected",
        description: "Your audio file is ready for transcription.",
      });
    } catch (error) {
      console.error("Error handling file:", error);
      addLog(`Error handling file`, "error", {
        details: error instanceof Error ? error.message : String(error),
        source: "FileUpload"
      });
      
      toast({
        title: "File Error",
        description: "There was a problem with your file.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  // Process the next file in the queue
  const processNextInQueue = async () => {
    if (currentQueueIndex >= fileQueue.length) {
      return;
    }
    
    const nextFile = fileQueue[currentQueueIndex];
    await handleFileUpload(nextFile);
    setCurrentQueueIndex(prev => prev + 1);
  };
  
  // Skip the current file in the queue
  const skipCurrentInQueue = () => {
    addLog(`Skipped file: ${fileQueue[currentQueueIndex]?.name}`, "info", {
      source: "FileQueue"
    });
    setCurrentQueueIndex(prev => prev + 1);
  };
  
  // Reset the queue
  const resetQueue = () => {
    setFileQueue([]);
    setCurrentQueueIndex(0);
    setFile(null);
    setAudioUrl(null);
    
    addLog("File queue reset", "info", {
      source: "FileQueue"
    });
  };
  
  // Create transcription jobs and navigate to history
  const startTranscription = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please upload an audio file first.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      const transcriptionPrompt = "Please preserve all English words exactly as spoken";
      
      // Create a job for each selected model
      const jobPromises = selectedModels.map(model => 
        createTranscriptionJob(file, model, transcriptionPrompt)
      );
      
      await Promise.all(jobPromises);
      
      toast({
        title: "Transcription Jobs Created",
        description: `Created ${selectedModels.length} transcription jobs.`,
      });
      
      // Navigate to the history page
      navigate('/app/history');
      
    } catch (error) {
      console.error("Error creating transcription jobs:", error);
      toast({
        title: "Error Creating Jobs",
        description: "There was a problem creating your transcription jobs.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <Header />
      
      <main className="container py-8 px-4 max-w-[1200px] mx-auto">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Transcription Studio
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload audio files or import from SharePoint to transcribe with AI
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Section */}
          <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-card to-background/80 backdrop-blur-sm transition-all hover:shadow-xl">
            <CardContent className="p-5">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                  <FileAudio className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Upload Audio File</h3>
              </div>
              
              <FileUpload onFileUpload={handleFileUpload} isUploading={isUploading} />
              
              {file && (
                <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10 animate-fade-in">
                  <div className="flex items-center">
                    <div className="truncate text-sm">
                      <span className="font-medium">{file.name}</span>
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({Math.round(file.size / 1024)} KB)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* SharePoint Section */}
          <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-card to-background/80 backdrop-blur-sm transition-all hover:shadow-xl">
            <CardContent className="p-5">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center mr-3">
                  <Upload className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold">Import from SharePoint</h3>
              </div>
              
              <SharePointDownloader 
                onFilesQueued={handleFilesQueued}
                isProcessing={isProcessing}
              />
              
              {fileQueue.length > 0 && (
                <div className="mt-3 animate-fade-in">
                  <FileQueue
                    files={fileQueue}
                    currentIndex={currentQueueIndex}
                    onProcessNext={processNextInQueue}
                    onSkip={skipCurrentInQueue}
                    onReset={resetQueue}
                    isProcessing={isProcessing}
                    notificationsEnabled={false}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Separator className="my-8" />
        
        {/* Action Section */}
        <div className="flex flex-col items-center justify-center mt-6">
          <Button
            onClick={startTranscription}
            disabled={isProcessing || !file}
            className="w-full max-w-md bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md h-12 text-lg"
          >
            {isProcessing ? (
              <>
                <Clock className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Start Transcription
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
          
          <p className="text-sm text-muted-foreground mt-3">
            Your file will be transcribed with 3 different AI models
          </p>
          
          <Button 
            variant="ghost" 
            onClick={() => navigate('/app/history')}
            className="mt-6"
          >
            View Previous Transcriptions
            <Clock className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default UploadPage;
