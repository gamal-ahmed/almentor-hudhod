
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Check, Loader2, Upload, FileAudio, Cog, Send, Info, FileText, PlayCircle, PauseCircle, Bell, BellOff } from "lucide-react";
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
  const toast = useToast();
  
  // Auth state
  const { isAuthenticated } = useAuth();

  // Request notification permission when notifications are enabled
  useEffect(() => {
    if (notificationsEnabled) {
      requestNotificationPermission().then(granted => {
        if (!granted) {
          toast.toast({
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
      
      toast.toast({
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
      
      toast.toast({
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
        toast.toast({
          title: "Notifications Enabled",
          description: "You will receive browser notifications when processes complete.",
        });
      }
    } else {
      setNotificationsEnabled(false);
      toast.toast({
        title: "Notifications Disabled",
        description: "You will no longer receive browser notifications.",
      });
    }
  };
  
  // Process transcriptions with selected models - now creates background jobs
  const processTranscriptions = async () => {
    if (!file) {
      toast.toast({
        title: "No File Selected",
        description: "Please upload an audio file first.",
        variant: "destructive",
      });
      return;
    }
    
    if (!isAuthenticated) {
      toast.toast({
        title: "Authentication Required",
        description: "Please sign in to create transcription jobs.",
        variant: "destructive",
      });
      return;
    }
    
    if (!Array.isArray(selectedModels) || selectedModels.length === 0) {
      toast.toast({
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
      
      toast.toast({
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
      
      toast.toast({
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
      toast.toast({
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
        
        toast.toast({
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
      
      toast.toast({
        title: "Publishing Failed",
        description: "There was a problem publishing your caption.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };
  
  return (
    <>
      <Header />
      <div className="container py-6">
        <div className="max-w-[1440px] mx-auto p-4 md:p-6">
          <header className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Transcription Pipeline
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm">
              Download MP3 files from SharePoint, transcribe with multiple AI models, and publish captions to Brightcove.
            </p>
          </header>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-3 space-y-4">
              <Card className="overflow-hidden border-l-4 border-l-blue-500 shadow-sm">
                <CardContent className="pt-4 p-3">
                  <h3 className="text-sm font-semibold mb-2 flex items-center">
                    <FileAudio className="mr-1 h-4 w-4 text-blue-500" />
                    Upload Audio
                  </h3>
                  <FileUpload onFileUpload={handleFileUpload} isUploading={isUploading} />
                  
                  {file && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                      <div className="text-xs flex items-center justify-between">
                        <div className="truncate mr-2">
                          <Check className="h-3 w-3 text-green-500 mr-1 inline-block" />
                          <span className="font-medium">File:</span> 
                          <span className="ml-1 truncate">{file.name}</span>
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({Math.round(file.size / 1024)} KB)
                          </span>
                        </div>
                        
                        {audioUrl && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center gap-1 h-6 text-xs"
                            onClick={toggleAudioPlayback}
                          >
                            {isAudioPlaying ? <PauseCircle className="h-3 w-3" /> : <PlayCircle className="h-3 w-3" />}
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
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden border-l-4 border-l-green-500 shadow-sm">
                <CardContent className="pt-4 p-3">
                  <h3 className="text-sm font-semibold mb-2 flex items-center">
                    <Cog className="mr-1 h-4 w-4 text-green-500" />
                    Transcription Settings
                  </h3>
                  
                  <div className="space-y-2">
                    <ModelSelector 
                      selectedModels={selectedModels} 
                      onModelChange={setSelectedModels}
                      disabled={isProcessing || !file}
                    />
                    
                    <Button 
                      onClick={processTranscriptions} 
                      disabled={isProcessing || !file || selectedModels.length === 0}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 h-8 text-xs"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-1 h-3 w-3" />
                          Generate Transcriptions
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className={`overflow-hidden border-l-4 ${selectedTranscription ? 'border-l-amber-500' : 'border-l-gray-300'} shadow-sm transition-colors duration-300 ${!selectedTranscription ? 'opacity-60' : ''}`}>
                <CardContent className="pt-4 p-3">
                  <h3 className={`text-sm font-semibold mb-2 flex items-center ${!selectedTranscription ? 'text-muted-foreground' : ''}`}>
                    <Send className={`mr-1 h-4 w-4 ${selectedTranscription ? 'text-amber-500' : 'text-gray-400'}`} />
                    Publish Options {!selectedTranscription && '(Select a transcription first)'}
                  </h3>
                  
                  <div className="space-y-2">
                    <VideoIdInput 
                      videoId={videoId} 
                      onChange={setVideoId}
                      disabled={isPublishing || !selectedTranscription}
                    />
                    
                    <Button 
                      onClick={publishCaption} 
                      disabled={isPublishing || !selectedTranscription || !videoId}
                      className={`w-full ${selectedTranscription 
                        ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700' 
                        : 'bg-gray-400'} h-8 text-xs`}
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        <>
                          <Send className="mr-1 h-3 w-3" />
                          Publish Caption
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <details className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                <summary className="cursor-pointer font-medium flex items-center text-sm">
                  <Cog className="h-4 w-4 mr-2" />
                  Advanced Settings
                </summary>
                <div className="pt-3 space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="prompt" className="text-xs font-medium">
                        Transcription Prompt Options:
                      </label>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Info className="h-3 w-3 mr-1" />
                        <span>Not all models support prompts</span>
                      </div>
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
                    
                    <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                      <p className="text-xs font-medium">Generated Prompt:</p>
                      <p className="text-xs text-muted-foreground mt-1">{transcriptionPrompt || "No prompt generated yet"}</p>
                    </div>
                  </div>
                </div>
              </details>
              
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
            
            <div className="lg:col-span-9 space-y-4">
              <Tabs defaultValue="results" className="w-full">
                <TabsList className="mb-2">
                  <TabsTrigger value="results">Transcription Results</TabsTrigger>
                  <TabsTrigger value="jobs">Background Jobs</TabsTrigger>
                </TabsList>
                
                <TabsContent value="results" className="space-y-3">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Check className="mr-2 h-5 w-5 text-violet-500" />
                    Transcription Results
                  </h2>
                  
                  {selectedModels.length > 0 ? (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
                    <Card className="p-8 flex flex-col items-center justify-center text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Transcriptions Yet</h3>
                      <p className="text-muted-foreground max-w-md">
                        Upload an audio file and select at least one transcription model to see results here.
                      </p>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="jobs">
                  <TranscriptionJobs 
                    onSelectTranscription={handleSelectTranscription}
                    refreshTrigger={refreshJobsTrigger}
                  />
                </TabsContent>
              </Tabs>
              
              <details className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                <summary className="cursor-pointer font-medium flex items-center text-sm">
                  <FileText className="h-4 w-4 mr-2 text-gray-500" />
                  System Logs
                </summary>
                <div className="h-[400px] mt-3">
                  <LogsPanel logs={logs} />
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;
