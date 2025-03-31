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
  FileAudio, 
  Check, 
  ArrowUpRight,
  UploadCloud,
  ListChecks,
  Sliders,
  Sparkles,
  Wand2,
  PanelTop,
  Clock,
  Workflow,
  Zap
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
  const [selectedModels, setSelectedModels] = useState<TranscriptionModel[]>(["openai"]);
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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Header />
      
      <main className="flex-1 container max-w-7xl py-8 px-4">
        <div className="flex flex-col gap-6">
          <div className="text-center mb-6 pt-4 pb-2 animate-fade-in">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Wand2 className="h-3.5 w-3.5" />
              <span>AI-Powered Audio Transcription</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">
              Audio Transcription Studio
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Convert speech to text with our state-of-the-art AI models
            </p>
          </div>
          
          <Tabs defaultValue="transcribe" className="w-full animate-slide-up">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-1 mb-8 p-1 shadow-soft">
              <TabsTrigger value="transcribe" className="text-base py-3 data-[state=active]:shadow-soft">
                <FileAudio className="mr-2 h-4 w-4" />
                Transcribe Audio
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="transcribe" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 space-y-6">
                  <Card className="border shadow-soft overflow-hidden bg-card/95 backdrop-blur-sm hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="bg-primary/5 border-b border-border/50 pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center text-xl font-medium">
                          <UploadCloud className="mr-2 h-5 w-5 text-primary" />
                          Audio Processing
                        </CardTitle>
                        <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 font-medium">
                          Step 1
                        </Badge>
                      </div>
                      <CardDescription>
                        Upload your audio files and configure transcription settings
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-6 space-y-6">
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
                            isUploading={processing}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
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
                            selectedModel={selectedModels[0] || "openai"}
                            selectedModels={selectedModels}
                            onModelChange={handleModelChange}
                            disabled={processing}
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
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="p-4 border-t bg-background/80 animate-slide-up">
                            <PromptOptions 
                              prompt={transcriptionPrompt}
                              onPromptChange={setTranscriptionPrompt}
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
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Badge variant="outline" className="rounded-full px-3 bg-green-500/10 text-green-500 border-green-500/20">4</Badge>
                          <h3 className="flex items-center font-medium">
                            Processing Queue
                            <span className="inline-flex ml-2 items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              Final Step
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
                                <p>Manage your audio file queue and start processing</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <div className="bg-muted/40 border border-border/50 rounded-lg p-4 transition-all duration-300 hover:border-primary/30 hover:bg-muted/60">
                          <div className="flex items-center mb-3">
                            <ListChecks className="h-4 w-4 text-green-500 mr-2" />
                            <h3 className="font-medium text-sm">Files Ready for Processing</h3>
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
                  
                  <Card className="border shadow-soft overflow-hidden bg-card/95 backdrop-blur-sm hover:shadow-md transition-shadow duration-300">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-500/10 p-2 rounded-full mt-0.5">
                          <Workflow className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="font-medium text-sm mb-1">Pro Tips</h3>
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground inline-block mb-0.5">🔍 Compare models:</span> Use multiple AI models to get the best transcription quality.
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground inline-block mb-0.5">⚡ Process faster:</span> Smaller audio files (under 10 minutes) process more quickly.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="lg:col-span-7 space-y-6">
                  <Card className="border shadow-soft bg-card/95 backdrop-blur-sm h-full hover:shadow-md transition-shadow duration-300">
                    <CardHeader className="bg-green-500/5 border-b border-border/50 pb-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-medium flex items-center">
                          <Check className="mr-2 h-5 w-5 text-green-500" />
                          Transcription Results
                        </CardTitle>
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 font-medium">
                          Step 2
                        </Badge>
                      </div>
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 animate-slide-up">
            <div className="bg-card border rounded-lg p-5 shadow-soft hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-full bg-blue-500/10">
                  <Zap className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="font-medium">Fast Processing</h3>
              </div>
              <p className="text-sm text-muted-foreground">Advanced AI models process your audio quickly and accurately.</p>
            </div>
            
            <div className="bg-card border rounded-lg p-5 shadow-soft hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-full bg-green-500/10">
                  <PanelTop className="h-5 w-5 text-green-500" />
                </div>
                <h3 className="font-medium">Multiple Formats</h3>
              </div>
              <p className="text-sm text-muted-foreground">Export transcriptions in VTT, SRT, or plain text formats.</p>
            </div>
            
            <div className="bg-card border rounded-lg p-5 shadow-soft hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-full bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <h3 className="font-medium">Session History</h3>
              </div>
              <p className="text-sm text-muted-foreground">Access your previous transcriptions anytime from your dashboard.</p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="py-6 border-t bg-gradient-to-r from-background to-secondary/30 backdrop-blur-sm mt-auto">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <FileAudio className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">VoiceScribe — Advanced Audio Transcription</span>
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
