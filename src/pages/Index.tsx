import React, { useState, useEffect, useRef } from 'react';
import Header from "@/components/Header";
import FileUpload from "@/components/FileUpload";
import ModelSelector from "@/components/ModelSelector";
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
  Play,
  Pause,
  Sliders,
  Sparkles,
  Wand2,
  PanelTop,
  Clock,
  Workflow,
  Zap,
  Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
import UrlAudioProcessor from "@/components/UrlAudioProcessor";
import { createTranscriptionJob } from "@/lib/api";

const Index = () => {
  const [selectedModels, setSelectedModels] = useState<TranscriptionModel[]>(["openai"]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [selectedTranscription, setSelectedTranscription] = useState<string | null>(null);
  const [selectedTranscriptionModel, setSelectedTranscriptionModel] = useState<string | null>(null);
  const [audioFileUrl, setAudioFileUrl] = useState<string | null>(null);
  const [transcriptionPrompt, setTranscriptionPrompt] = useState("Please preserve all English words exactly as spoken");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [preserveEnglish, setPreserveEnglish] = useState(true);
  const [outputFormat, setOutputFormat] = useState<"vtt" | "plain">("vtt");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const { addLog } = useLogsStore();
  
  const handleModelChange = (models: TranscriptionModel[]) => {
    setSelectedModels(models);
    if (models.length > 0 && !processing) {
      toast.success("Model selection updated", {
        description: `Selected ${models.length} transcription model${models.length > 1 ? 's' : ''}`
      });
    }
  };
  
  const handleFileUpload = async (files: File | File[]) => {
    const file = Array.isArray(files) ? files[0] : files;
    if (!file) return;
    
    console.log("File uploaded:", file.name);
    setUploadedFile(file);
    addLog(`File uploaded: ${file.name}`, "info", {
      source: "FileUpload",
      details: `Type: ${file.type}, Size: ${Math.round(file.size / 1024)} KB`
    });

    // Start transcription immediately
    await startTranscription(file);
  };
  
  const handleUrlProcessedAudio = async (file: File) => {
    console.log("URL-processed audio:", file.name);
    setUploadedFile(file);
    addLog(`URL-processed audio: ${file.name}`, "info", {
      source: "UrlAudioProcessor",
      details: `Type: ${file.type}, Size: ${Math.round(file.size / 1024)} KB`
    });
    setShowUrlInput(false);
    
    // Start transcription immediately
    await startTranscription(file);
  };

  const startTranscription = async (file: File) => {
    if (selectedModels.length === 0) {
      toast.error("No models selected", {
        description: "Please select at least one transcription model"
      });
      return;
    }
    
    try {
      setProcessing(true);
      addLog(`Starting transcription job`, "info", {
        source: "TranscriptionJob",
        details: `Model: ${selectedModels[0]}, File: ${file.name}`
      });
      
      toast.loading("Processing audio...", {
        id: "processing-toast",
        duration: 100000
      });
      
      const { jobId } = await createTranscriptionJob(
        file,
        selectedModels[0],
        transcriptionPrompt
      );
      
      if (jobId) {
        addLog(`Transcription job created: ${jobId}`, "success", {
          source: "TranscriptionJob",
          details: `The job has been queued for processing.`
        });
        
        toast.success("Transcription started", {
          id: "processing-toast",
          description: "Your audio is being processed."
        });
        
        setRefreshTrigger(prev => prev + 1);
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
        id: "processing-toast",
        description: (error as Error).message || "Please try again or contact support."
      });
    } finally {
      setProcessing(false);
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
  
  const handleTranscriptionSelect = (vtt: string, model: string) => {
    setSelectedTranscription(vtt);
    setSelectedTranscriptionModel(model);
    
    const audioFile = uploadedFile;
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

  const toggleUrlInput = () => {
    setShowUrlInput(!showUrlInput);
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
                          <FileAudio className="mr-2 h-5 w-5 text-primary" />
                          Audio Transcription
                        </CardTitle>
                        <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 font-medium">
                          Instant Processing
                        </Badge>
                      </div>
                      <CardDescription>
                        Upload your audio files for immediate transcription
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="p-6 space-y-6">
                      {/* Section 1: Upload */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Badge variant="outline" className="rounded-full px-3 bg-blue-500/10 text-blue-500 border-blue-500/20">1</Badge>
                            <h3 className="font-medium">Upload Audio</h3>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                                  <span className="sr-only">Info</span>
                                  ?
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>Upload audio files to be transcribed. Transcription will start automatically.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        
                        <div className="bg-muted/40 rounded-lg border border-border/50 p-4 transition-all duration-300 hover:border-primary/30 hover:bg-muted/60">
                          <FileUpload 
                            onFileUpload={handleFileUpload}
                            isUploading={processing}
                            autoProcess={true}
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
                              isProcessing={processing}
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Section 2: AI Models with improved UX */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Badge variant="outline" className="rounded-full px-3 bg-indigo-500/10 text-indigo-500 border-indigo-500/20">2</Badge>
                            <h3 className="font-medium">AI Model Selection</h3>
                          </div>
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                <Sparkles className="h-3.5 w-3.5 mr-1 text-amber-500" />
                                Model Info
                              </Button>
                            </HoverCardTrigger>
                            <HoverCardContent className="w-80">
                              <div className="space-y-2">
                                <h4 className="font-medium">About Models</h4>
                                <p className="text-sm text-muted-foreground">
                                  Each AI model has different strengths. OpenAI Whisper excels with accents, Gemini is faster, and Phi-4 handles technical content better.
                                </p>
                              </div>
                            </HoverCardContent>
                          </HoverCard>
                        </div>
                        
                        <div className="bg-muted/40 rounded-lg border border-border/50 p-4 transition-all duration-300 hover:border-primary/30 hover:bg-muted/60">
                          <ModelSelector 
                            selectedModel={selectedModels[0] || "openai"}
                            selectedModels={selectedModels}
                            onModelChange={handleModelChange}
                            disabled={processing}
                          />
                        </div>
                      </div>
                      
                      {/* Section 3: Advanced Options with improved UX */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Badge variant="outline" className="rounded-full px-3 bg-primary/10 text-primary border-primary/20">3</Badge>
                            <h3 className="font-medium">Configuration Options</h3>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                            className="h-7 px-2 text-xs"
                          >
                            <Sliders className="h-3.5 w-3.5 mr-1" />
                            {showAdvancedOptions ? "Hide Options" : "Show Options"}
                          </Button>
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
                                <span>Advanced Transcription Options</span>
                              </div>
                              {showAdvancedOptions ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="p-4 border-t bg-background/80 animate-slide-up space-y-4">
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
                      
                      {/* Display currently uploaded file if present */}
                      {uploadedFile && (
                        <div className="space-y-2 mt-4">
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
                              <span className="font-medium text-foreground inline-block mb-0.5">🔍 Better accuracy:</span> Add context in advanced options to help the AI understand technical terms.
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground inline-block mb-0.5">⚡ Process faster:</span> Shorter audio files (under 10 minutes) process more quickly.
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
                          Live Updates
                        </Badge>
                      </div>
                      <CardDescription>
                        View completed and in-progress transcriptions
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
