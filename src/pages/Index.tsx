
import React, { useState, useEffect } from 'react';
import Header from "@/components/Header";
import FileUpload from "@/components/FileUpload";
import ModelSelector from "@/components/ModelSelector";
import FileQueue from "@/components/FileQueue";
import PromptOptions from "@/components/PromptOptions";
import TranscriptionJobs from "@/components/TranscriptionJobs";
import { TranscriptionModel } from "@/components/ModelSelector";
import { useLogsStore } from "@/lib/useLogsStore";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ChevronDown, 
  ChevronUp, 
  Settings, 
  FileAudio, 
  Check, 
  ArrowUpRight,
  UploadCloud,
  ListChecks,
  Sliders,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  HoverCard, 
  HoverCardContent, 
  HoverCardTrigger 
} from "@/components/ui/hover-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Index = () => {
  const [selectedModels, setSelectedModels] = useState<TranscriptionModel[]>([]);
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [selectedTranscription, setSelectedTranscription] = useState<string | null>(null);
  const [selectedTranscriptionModel, setSelectedTranscriptionModel] = useState<string | null>(null);
  const [audioFileUrl, setAudioFileUrl] = useState<string | null>(null);
  const [transcriptionPrompt, setTranscriptionPrompt] = useState("Please preserve all English words exactly as spoken");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [preserveEnglish, setPreserveEnglish] = useState(true);
  const [outputFormat, setOutputFormat] = useState<"vtt" | "plain">("vtt");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  const logs = useLogsStore(state => state.logs);
  
  const handleModelChange = (models: TranscriptionModel[]) => {
    setSelectedModels(models);
    if (models.length > 0 && !processing) {
      toast.success("Model selection updated", {
        description: `Selected ${models.length} transcription model${models.length > 1 ? 's' : ''}`
      });
    }
  };
  
  const handleFileUpload = (files: File | File[]) => {
    const fileArray = Array.isArray(files) ? files : [files];
    setQueuedFiles(prevFiles => [...prevFiles, ...fileArray]);
    toast.success("File added to queue", {
      description: `Added ${fileArray.length} file${fileArray.length > 1 ? 's' : ''} to the processing queue`
    });
  };
  
  const handleRemoveFile = (index: number) => {
    setQueuedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    toast.info("File removed from queue");
  };
  
  const handleProcessNext = () => {
    if (selectedModels.length === 0) {
      toast.error("No models selected", {
        description: "Please select at least one transcription model"
      });
      return;
    }
    
    setProcessing(true);
    toast.loading("Processing file...", {
      id: "processing-toast",
      duration: 2000
    });
    
    setTimeout(() => {
      setProcessing(false);
      setCurrentFileIndex(prev => prev + 1);
      setRefreshTrigger(prev => prev + 1);
      toast.success("Transcription complete", {
        id: "processing-toast",
        description: "File has been successfully transcribed"
      });
    }, 2000);
  };
  
  const handleSkip = () => {
    setCurrentFileIndex(prev => prev + 1);
    toast.info("File skipped");
  };
  
  const handleReset = () => {
    setQueuedFiles([]);
    setCurrentFileIndex(0);
    toast.info("Queue reset", {
      description: "All files have been removed from the queue"
    });
  };
  
  const handleTranscriptionSelect = (vtt: string, model: string) => {
    setSelectedTranscription(vtt);
    setSelectedTranscriptionModel(model);
    
    const audioFile = queuedFiles[0];
    if (audioFile) {
      const url = URL.createObjectURL(audioFile);
      setAudioFileUrl(url);
    }
    
    toast.success("Transcription selected", {
      description: `Viewing transcription from ${model}`
    });
  };
  
  const handlePreserveEnglishChange = (checked: boolean) => {
    setPreserveEnglish(checked);
    setTranscriptionPrompt(checked ? "Please preserve all English words exactly as spoken" : "");
  };

  const handleOutputFormatChange = (format: "vtt" | "plain") => {
    setOutputFormat(format);
  };

  const handleNotificationsChange = (enabled: boolean) => {
    setNotificationsEnabled(enabled);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-muted/10">
      <Header />
      
      <main className="flex-1 container max-w-7xl py-8 px-4">
        <div className="flex flex-col gap-6">
          {/* Welcome Section */}
          <div className="text-center mb-4 pt-4 pb-2">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Audio Transcription Studio
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Convert speech to text with our advanced AI models
            </p>
          </div>
          
          {/* Main Content */}
          <Tabs defaultValue="transcribe" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-1 mb-8">
              <TabsTrigger value="transcribe" className="text-base py-3">
                <FileAudio className="mr-2 h-4 w-4" />
                Transcribe Audio
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="transcribe" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Panel - Upload & Config */}
                <div className="lg:col-span-5 space-y-6">
                  <Card className="border shadow-sm overflow-hidden bg-card/95 backdrop-blur-sm">
                    <CardHeader className="bg-primary/5 border-b border-border/50 pb-4">
                      <CardTitle className="flex items-center text-xl font-medium">
                        <UploadCloud className="mr-2 h-5 w-5 text-primary" />
                        Audio Processing
                      </CardTitle>
                      <CardDescription>
                        Upload your audio files and configure transcription settings
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-6 space-y-6">
                      {/* Step 1: File Upload */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Badge variant="outline" className="rounded-full px-3 bg-primary/10 text-primary border-primary/20">1</Badge>
                          <h3>Upload Audio File</h3>
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
                        <div className="bg-muted/40 rounded-lg border border-border/50 p-4">
                          <FileUpload 
                            onFileUpload={handleFileUpload}
                            isUploading={processing}
                          />
                        </div>
                      </div>
                      
                      {/* Step 2: Model Selection */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Badge variant="outline" className="rounded-full px-3 bg-primary/10 text-primary border-primary/20">2</Badge>
                          <h3>Select AI Models</h3>
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
                        <div className="bg-muted/40 rounded-lg border border-border/50 p-4">
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <h3 className="font-medium text-sm flex items-center cursor-help mb-3">
                                <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                                Transcription AI Models
                              </h3>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80">
                              <div className="space-y-2">
                                <h4 className="font-medium">About Models</h4>
                                <p className="text-sm text-muted-foreground">
                                  Select multiple models to compare transcription quality. Each model has different strengths for different types of audio.
                                </p>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                          <ModelSelector 
                            selectedModels={selectedModels}
                            onModelChange={handleModelChange}
                            disabled={processing}
                          />
                        </div>
                      </div>
                      
                      {/* Step 3: Advanced Options */}
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
                          className="border rounded-lg overflow-hidden bg-muted/40"
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
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="p-4 border-t bg-background/80">
                            <PromptOptions 
                              preserveEnglish={preserveEnglish}
                              onPreserveEnglishChange={handlePreserveEnglishChange}
                              outputFormat={outputFormat}
                              onOutputFormatChange={handleOutputFormatChange}
                              notificationsEnabled={notificationsEnabled}
                              onNotificationsChange={handleNotificationsChange}
                              disabled={processing}
                            />
                          </CollapsibleContent>
                        </Collapsible>
                      </div>
                      
                      {/* Step 4: File Queue & Actions */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Badge variant="outline" className="rounded-full px-3 bg-primary/10 text-primary border-primary/20">4</Badge>
                          <h3>File Queue</h3>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full">
                                  <span className="sr-only">Info</span>
                                  ?
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>Manage your audio file queue and start processing</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="bg-muted/40 border border-border/50 rounded-lg p-4">
                          <div className="flex items-center mb-3">
                            <ListChecks className="h-4 w-4 text-primary mr-2" />
                            <h3 className="font-medium text-sm">Processing Queue</h3>
                          </div>
                          <FileQueue 
                            files={queuedFiles}
                            currentIndex={currentFileIndex}
                            onProcessNext={handleProcessNext}
                            onSkip={handleSkip}
                            onReset={handleReset}
                            isProcessing={processing}
                            notificationsEnabled={notificationsEnabled}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Quick Help Card */}
                  <Card className="border shadow-sm overflow-hidden bg-card/95 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-500/10 p-2 rounded-full mt-0.5">
                          <ArrowUpRight className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm mb-1">Pro Tip</h3>
                          <p className="text-xs text-muted-foreground">
                            For best results, compare transcriptions from multiple AI models and use the advanced options to fine-tune the output format.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Right Panel - Results */}
                <div className="lg:col-span-7 space-y-6">
                  <Card className="border shadow-sm bg-card/95 backdrop-blur-sm h-full">
                    <CardHeader className="bg-green-500/5 border-b border-border/50 pb-4">
                      <CardTitle className="text-xl font-medium flex items-center">
                        <Check className="mr-2 h-5 w-5 text-green-500" />
                        Transcription Results
                      </CardTitle>
                      <CardDescription>
                        View and select from completed transcriptions
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-4 lg:p-6">
                      <TranscriptionJobs 
                        onSelectTranscription={handleTranscriptionSelect}
                        refreshTrigger={refreshTrigger}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <footer className="py-6 border-t bg-background/95 backdrop-blur-sm mt-auto">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <FileAudio className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">VoiceScribe - Advanced Audio Transcription</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Support</a>
            <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} VoiceScribe</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
