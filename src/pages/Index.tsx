import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { 
  Check, Loader2, Upload, FileAudio, Cog, Send, Info, 
  FileText, PlayCircle, PauseCircle, Bell, BellOff,
  Sparkles, ArrowRight, Settings, Activity
} from "lucide-react";
import FileUpload from "@/components/FileUpload";
import ModelSelector, { TranscriptionModel } from "@/components/ModelSelector";
import TranscriptionCard from "@/components/TranscriptionCard";
import LogsPanel from "@/components/LogsPanel";
import VideoIdInput from "@/components/VideoIdInput";
import PromptOptions from "@/components/PromptOptions";
import SharePointDownloader from "@/components/SharePointDownloader";
import FileQueue from "@/components/FileQueue";
import TranscriptionJobs from "@/components/TranscriptionJobs";
import { useLogsStore } from "@/lib/useLogsStore";
import { 
  transcribeAudio, 
  createTranscriptionJob,
  fetchBrightcoveKeys,
  getBrightcoveAuthToken,
  addCaptionToBrightcove
} from "@/lib/api";
import { requestNotificationPermission, showNotification } from "@/lib/notifications";
import Header from '@/components/Header';
import { useAuth } from "@/lib/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExportsList from "@/components/ExportsList";
import ExportMenu from "@/components/ExportMenu";

const DEFAULT_TRANSCRIPTION_PROMPT = "Please preserve all English words exactly as spoken";

const Index = () => {
  // Main state
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedModels, setSelectedModels] = useState<TranscriptionModel[]>(["openai", "gemini-2.0-flash", "phi4"]);
  const [videoId, setVideoId] = useState<string>("");
  const [selectedTranscription, setSelectedTranscription] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [transcriptionPrompt, setTranscriptionPrompt] = useState<string>(DEFAULT_TRANSCRIPTION_PROMPT);
  const [refreshJobsTrigger, setRefreshJobsTrigger] = useState<number>(0);
  
  // SharePoint and Queue state
  const [fileQueue, setFileQueue] = useState<File[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(0);
  
  // Prompt options state
  const [preserveEnglish, setPreserveEnglish] = useState<boolean>(true);
  const [outputFormat, setOutputFormat] = useState<"vtt" | "plain">("vtt");
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Processing state
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [transcriptions, setTranscriptions] = useState<Record<string, { vtt: string, prompt: string, loading: boolean }>>({
    openai: { vtt: "", prompt: "", loading: false },
    "gemini-2.0-flash": { vtt: "", prompt: "", loading: false },
    phi4: { vtt: "", prompt: "", loading: false }
  });
  
  // Logs and notification
  const { logs, addLog, startTimedLog } = useLogsStore();
  const { toast } = useToast();
  
  // Auth state
  const { isAuthenticated } = useAuth();

  // Request notification permission when notifications are enabled
  useEffect(() => {
    if (notificationsEnabled) {
      requestNotificationPermission().then(granted => {
        if (!granted) {
          toast({
            title: "Notification Permission Denied",
            description: "Please enable notifications in your browser settings to receive alerts.",
            variant: "destructive",
          });
          setNotificationsEnabled(false);
        }
      });
    }
  }, [notificationsEnabled, toast]);
  
  // Update prompt based on options
  const updatePromptFromOptions = () => {
    let newPrompt = "";
    
    if (preserveEnglish) {
      newPrompt += "Please preserve all English words exactly as spoken. ";
    }
    
    if (outputFormat === "vtt") {
      newPrompt += "Generate output with timestamps in VTT format. ";
    } else {
      newPrompt += "Generate plain text without timestamps. ";
    }
    
    setTranscriptionPrompt(newPrompt.trim());
  };
  
  // Handle playback of audio file
  const toggleAudioPlayback = () => {
    if (!audioRef.current) return;
    
    if (isAudioPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsAudioPlaying(!isAudioPlaying);
  };
  
  // Handle SharePoint files being queued
  const handleFilesQueued = (files: File[]) => {
    setFileQueue(files);
    setCurrentQueueIndex(0);
    addLog(`Queued ${files.length} files from SharePoint`, "info", {
      details: `Files: ${files.map(f => f.name).join(", ")}`,
      source: "SharePoint"
    });
    
    if (notificationsEnabled) {
      showNotification("Files Queued", {
        body: `${files.length} audio files are ready for sequential processing`,
        tag: "file-queue"
      });
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
    setSelectedTranscription(null);
    setSelectedModel(null);
    
    addLog("File queue reset", "info", {
      source: "FileQueue"
    });
  };
  
  // When a file is uploaded
  const handleFileUpload = async (uploadedFile: File) => {
    try {
      setFile(uploadedFile);
      const newAudioUrl = URL.createObjectURL(uploadedFile);
      setAudioUrl(newAudioUrl);
      setSelectedTranscription(null);
      setSelectedModel(null);
      
      setTranscriptions({
        openai: { vtt: "", prompt: "", loading: false },
        "gemini-2.0-flash": { vtt: "", prompt: "", loading: false },
        phi4: { vtt: "", prompt: "", loading: false }
      });
      
      addLog(`File selected: ${uploadedFile.name}`, "info", {
        details: `Size: ${Math.round(uploadedFile.size / 1024)} KB | Type: ${uploadedFile.type}`,
        source: "FileUpload"
      });
      
      toast({
        title: "File Selected",
        description: "Your audio file is ready for transcription.",
      });
      
      if (notificationsEnabled) {
        showNotification("File Selected", {
          body: "Your audio file is ready for transcription.",
          tag: "file-upload"
        });
      }
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

  // Update options and regenerate prompt
  const handlePreserveEnglishChange = (checked: boolean) => {
    setPreserveEnglish(checked);
    setTimeout(updatePromptFromOptions, 0);
  };
  
  const handleOutputFormatChange = (format: "vtt" | "plain") => {
    setOutputFormat(format);
    setTimeout(updatePromptFromOptions, 0);
  };
  
  const handleNotificationsChange = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      setNotificationsEnabled(granted);
      
      if (granted) {
        toast({
          title: "Notifications Enabled",
          description: "You will receive browser notifications when processes complete.",
        });
      }
    } else {
      setNotificationsEnabled(false);
      toast({
        title: "Notifications Disabled",
        description: "You will no longer receive browser notifications.",
      });
    }
  };
  
  // Process transcriptions with selected models - now creates background jobs
  const processTranscriptions = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please upload an audio file first.",
        variant: "destructive",
      });
      return;
    }
    
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create transcription jobs.",
        variant: "destructive",
      });
      return;
    }
    
    if (!Array.isArray(selectedModels) || selectedModels.length === 0) {
      toast({
        title: "No Models Selected",
        description: "Please select at least one transcription model.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      const mainLog = startTimedLog("Transcription Process", "info", "Transcription");
      
      updatePromptFromOptions();
      
      mainLog.update(`Starting transcription jobs with models: ${selectedModels.join(", ")}`);
      
      addLog(`Creating transcription jobs with models: ${selectedModels.join(", ")}`, "info", {
        details: `File: ${file.name} | Size: ${Math.round(file.size / 1024)} KB | Prompt: "${transcriptionPrompt}"`,
        source: "Transcription"
      });
      
      // Create a job for each selected model
      const jobPromises = selectedModels.map(model => 
        createTranscriptionJob(file, model, transcriptionPrompt)
      );
      
      await Promise.all(jobPromises);
      
      // Trigger refresh of jobs list
      setRefreshJobsTrigger(prev => prev + 1);
      
      mainLog.complete(
        `Transcription jobs created`, 
        `Created ${selectedModels.length} transcription jobs`
      );
      
      toast({
        title: "Transcription Jobs Created",
        description: `Created ${selectedModels.length} transcription jobs. Check the 'Jobs' tab for status.`,
      });
      
      if (notificationsEnabled) {
        showNotification("Transcription Jobs Created", {
          body: `${selectedModels.length} transcription jobs have been started and will continue processing in the background.`,
          tag: "transcription-jobs-created"
        });
      }
    } catch (error) {
      console.error("Error creating transcription jobs:", error);
      addLog(`Error creating transcription jobs`, "error", {
        details: error instanceof Error ? error.message : String(error),
        source: "Transcription"
      });
      
      toast({
        title: "Error Creating Jobs",
        description: "There was a problem creating your transcription jobs.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // When a transcription is selected from jobs or cards
  const handleSelectTranscription = (vtt: string, model: string) => {
    setSelectedTranscription(vtt);
    setSelectedModel(model);
    addLog(`Selected ${model} transcription for publishing`, "info", {
      source: "Selection",
      details: `VTT length: ${vtt.length} characters | Word count: ${vtt.split(/\s+/).length} words`
    });
  };
  
  // Publish caption to Brightcove
  const publishCaption = async () => {
    if (!selectedTranscription || !videoId) {
      toast({
        title: "Missing Information",
        description: "Please select a transcription and enter a video ID.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsPublishing(true);
      const publishLog = startTimedLog("Caption Publishing", "info", "Brightcove");
      
      publishLog.update(`Preparing caption for video ID: ${videoId}`);
      
      const credentialsLog = startTimedLog("Brightcove Authentication", "info", "Brightcove API");
      
      let brightcoveKeys;
      try {
        brightcoveKeys = await fetchBrightcoveKeys();
        credentialsLog.update("Retrieving Brightcove auth token...");
        
        const authToken = await getBrightcoveAuthToken(
          brightcoveKeys.brightcove_client_id,
          brightcoveKeys.brightcove_client_secret
        );
        
        credentialsLog.complete("Brightcove authentication successful", 
          `Account ID: ${brightcoveKeys.brightcove_account_id} | Token obtained`);
        
        publishLog.update(`Adding caption to Brightcove video ID: ${videoId}`);
        
        await addCaptionToBrightcove(
          videoId,
          selectedTranscription,
          'ar',
          'Arabic',
          brightcoveKeys.brightcove_account_id,
          authToken
        );
        
        publishLog.complete(
          "Caption published successfully", 
          `Video ID: ${videoId} | Language: Arabic`
        );
        
        toast({
          title: "Caption Published",
          description: "Your caption has been successfully published to the Brightcove video.",
        });
      } catch (error) {
        credentialsLog.error("Brightcove authentication failed", error instanceof Error ? error.message : String(error));
        publishLog.error("Caption publishing failed", error instanceof Error ? error.message : String(error));
        throw error;
      }
    } catch (error) {
      console.error("Error publishing caption:", error);
      addLog(`Error publishing caption`, "error", {
        details: error instanceof Error ? error.message : String(error),
        source: "Brightcove"
      });
      
      toast({
        title: "Publishing Failed",
        description: "There was a problem publishing your caption.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/30">
      <Header />
      
      <main className="container py-8 px-4 max-w-[1440px] mx-auto">
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Transcription Studio
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Download MP3 files from SharePoint, transcribe with multiple AI models, and publish captions to Brightcove.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar with controls */}
          <div className="lg:col-span-4 space-y-5">
            {/* File Upload Card */}
            <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-card to-background/80 backdrop-blur-sm transition-all hover:shadow-xl">
              <CardContent className="p-5">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <FileAudio className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Audio Source</h3>
                </div>
                
                <div className="space-y-4">
                  <FileUpload onFileUpload={handleFileUpload} isUploading={isUploading} />
                  
                  {file && (
                    <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/10 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <div className="truncate text-sm">
                            <span className="font-medium">{file.name}</span>
                            <span className="ml-1 text-xs text-muted-foreground">
                              ({Math.round(file.size / 1024)} KB)
                            </span>
                          </div>
                        </div>
                        
                        {audioUrl && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={toggleAudioPlayback}
                            className="h-8 w-8 p-0 rounded-full"
                          >
                            {isAudioPlaying ? 
                              <PauseCircle className="h-5 w-5 text-primary" /> : 
                              <PlayCircle className="h-5 w-5 text-primary" />
                            }
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
                  
                  <div className="pt-2">
                    <h4 className="text-sm font-medium mb-2 flex items-center">
                      <Upload className="h-4 w-4 mr-1 text-purple-400" />
                      SharePoint Integration
                    </h4>
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
                          notificationsEnabled={notificationsEnabled}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Transcription Settings Card */}
            <Card className="overflow-hidden border-none shadow-lg bg-gradient-to-br from-card to-background/80 backdrop-blur-sm transition-all hover:shadow-xl">
              <CardContent className="p-5">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center mr-3">
                    <Sparkles className="h-5 w-5 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold">AI Transcription</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Select AI Models</label>
                    <ModelSelector 
                      selectedModels={selectedModels} 
                      onModelChange={setSelectedModels}
                      disabled={isProcessing || !file}
                    />
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium flex items-center">
                        <Settings className="h-4 w-4 mr-1 text-muted-foreground" />
                        Prompt Options
                      </h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-xs px-2"
                        onClick={() => setTranscriptionPrompt(DEFAULT_TRANSCRIPTION_PROMPT)}
                      >
                        Reset
                      </Button>
                    </div>
                    
                    <PromptOptions 
                      preserveEnglish={preserveEnglish}
                      onPreserveEnglishChange={handlePreserveEnglishChange}
                      outputFormat={outputFormat}
                      onOutputFormatChange={handleOutputFormatChange}
                      notificationsEnabled={notificationsEnabled}
                      onNotificationsChange={handleNotificationsChange}
                      disabled={isProcessing}
                    />
                    
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-200">Generated Prompt:</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">{transcriptionPrompt || "No prompt generated yet"}</p>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={processTranscriptions} 
                    disabled={isProcessing || !file || selectedModels.length === 0}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Activity className="mr-2 h-4 w-4" />
                        Generate Transcriptions
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Publishing Card */}
            <Card className={`overflow-hidden border-none shadow-lg transition-all ${
              selectedTranscription 
                ? 'bg-gradient-to-br from-card to-amber-500/5 backdrop-blur-sm hover:shadow-xl' 
                : 'bg-gradient-to-br from-card/80 to-background/60 backdrop-blur-sm opacity-75'
            }`}>
              <CardContent className="p-5">
                <div className="flex items-center mb-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${
                    selectedTranscription 
                      ? 'bg-amber-500/10' 
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    <Send className={`h-5 w-5 ${
                      selectedTranscription 
                        ? 'text-amber-500' 
                        : 'text-gray-400'
                    }`} />
                  </div>
                  <h3 className="text-lg font-semibold">
                    Publish Caption
                    {!selectedTranscription && <span className="text-xs font-normal text-muted-foreground block">Select a transcription first</span>}
                  </h3>
                </div>
                
                <div className="space-y-4">
                  <VideoIdInput 
                    videoId={videoId} 
                    onChange={setVideoId}
                    disabled={isPublishing || !selectedTranscription}
                  />
                  
                  <div className="flex space-x-2">
                    <Button 
                      onClick={publishCaption} 
                      disabled={isPublishing || !selectedTranscription || !videoId}
                      className={`flex-1 ${
                        selectedTranscription 
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md' 
                          : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Publish to Brightcove
                        </>
                      )}
                    </Button>
                    
                    {selectedTranscription && (
                      <ExportMenu 
                        transcriptionContent={selectedTranscription}
                        disabled={!selectedTranscription}
                        fileName={`selected-transcription-${selectedModel || 'unknown'}`}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Exports List Card */}
            <ExportsList />
          </div>
          
          {/* Main content area */}
          <div className="lg:col-span-8 space-y-6">
            {/* Transcription Results Card */}
            <Card className="border-none shadow-lg bg-gradient-to-br from-card to-background/80 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-0">
                <Tabs defaultValue="results" className="w-full">
                  <div className="flex items-center justify-between px-6 pt-5 pb-2">
                    <h3 className="text-lg font-semibold">Transcription Results</h3>
                    <TabsList className="bg-primary/10">
                      <TabsTrigger value="results" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        Results
                      </TabsTrigger>
                      <TabsTrigger value="jobs" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        Background Jobs
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <Separator />
                  
                  <TabsContent value="results" className="p-6 min-h-[60vh]">
                    {selectedModels.length > 0 ? (
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {selectedModels.map((model) => {
                          const transcription = transcriptions[model] || { vtt: "", prompt: "", loading: false };
                          
                          return (
                            <TranscriptionCard
                              key={model}
                              modelName={
                                model === "openai" 
                                  ? "OpenAI Whisper" 
                                  : model === "gemini-2.0-flash" 
                                    ? "Gemini 2.0 Flash" 
                                    : "Microsoft Phi-4"
                              }
                              vttContent={transcription.vtt}
                              prompt={transcription.prompt}
                              onSelect={() => handleSelectTranscription(transcription.vtt, model)}
                              isSelected={selectedModel === model}
                              audioSrc={audioUrl || undefined}
                              isLoading={transcription.loading}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                        <div className="bg-primary/5 h-20 w-20 rounded-full flex items-center justify-center mb-4 animate-pulse-subtle">
                          <FileText className="h-10 w-10 text-primary/60" />
                        </div>
                        <h3 className="text-xl font-medium mb-2">No Transcriptions Yet</h3>
                        <p className="text-muted-foreground max-w-md">
                          Upload an audio file and select at least one transcription model to see results here.
                        </p>
                        
                        <Button 
                          variant="outline" 
                          className="mt-6 group"
                          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                          Start by uploading a file
                          <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="jobs" className="p-6 min-h-[60vh]">
                    <TranscriptionJobs 
                      onSelectTranscription={handleSelectTranscription}
                      refreshTrigger={refreshJobsTrigger}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            {/* System Logs Card */}
            <Card className="border-none shadow-lg bg-gradient-to-br from-card to-background/80 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-0">
                <details className="group">
                  <summary className="p-5 cursor-pointer list-none flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                        <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold">System Logs</h3>
                    </div>
                    <div className="transform transition-transform group-open:rotate-180">
                      <ArrowRight className="h-5 w-5 rotate-90 text-muted-foreground" />
                    </div>
                  </summary>
                  <Separator />
                  <div className="h-[350px] p-5">
                    <LogsPanel logs={logs} />
                  </div>
                </details>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
