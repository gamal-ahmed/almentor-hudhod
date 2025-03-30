import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Check, Loader2, Upload, FileAudio, Cog, Send, Info, FileText, PlayCircle, PauseCircle, Bell, BellOff, ListFilter, Clock } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import ModelSelector, { TranscriptionModel } from "@/components/ModelSelector";
import TranscriptionCard from "@/components/TranscriptionCard";
import LogsPanel from "@/components/LogsPanel";
import VideoIdInput from "@/components/VideoIdInput";
import PromptOptions from "@/components/PromptOptions";
import SharePointDownloader from "@/components/SharePointDownloader";
import FileQueue from "@/components/FileQueue";
import AsyncTranscriber from "@/components/AsyncTranscriber";
import { useLogsStore } from "@/lib/useLogsStore";
import { 
  transcribeAudio, 
  queueTranscriptionJob,
  checkTranscriptionStatus,
  getMyTranscriptionJobs,
  getMyLatestTranscriptionJob,
  fetchBrightcoveKeys,
  getBrightcoveAuthToken,
  addCaptionToBrightcove
} from "@/lib/api";
import { requestNotificationPermission, showNotification } from "@/lib/notifications";
import Header from '@/components/Header';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/AuthContext";

const DEFAULT_TRANSCRIPTION_PROMPT = "Please preserve all English words exactly as spoken";

const Index = () => {
  const { isAuthenticated } = useAuth();
  
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedModels, setSelectedModels] = useState<TranscriptionModel[]>(["openai", "gemini-2.0-flash", "phi4"]);
  const [videoId, setVideoId] = useState<string>("");
  const [selectedTranscription, setSelectedTranscription] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [transcriptionPrompt, setTranscriptionPrompt] = useState<string>(DEFAULT_TRANSCRIPTION_PROMPT);
  const [processingMode, setProcessingMode] = useState<"sync" | "async">("sync");
  const [transcriptionJobs, setTranscriptionJobs] = useState<any[]>([]);
  
  const [fileQueue, setFileQueue] = useState<File[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(0);
  
  const [preserveEnglish, setPreserveEnglish] = useState<boolean>(true);
  const [outputFormat, setOutputFormat] = useState<"vtt" | "plain">("vtt");
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [transcriptions, setTranscriptions] = useState<Record<string, { vtt: string, prompt: string, loading: boolean }>>({
    openai: { vtt: "", prompt: "", loading: false },
    "gemini-2.0-flash": { vtt: "", prompt: "", loading: false },
    phi4: { vtt: "", prompt: "", loading: false }
  });
  
  const { logs, addLog, startTimedLog } = useLogsStore();
  const { toast } = useToast();

  const [loadingExistingTranscription, setLoadingExistingTranscription] = useState<boolean>(false);

  useEffect(() => {
    const loadJobsAndCheckLatest = async () => {
      try {
        const jobs = await getMyTranscriptionJobs();
        setTranscriptionJobs(jobs);
        
        if (!file) {
          setLoadingExistingTranscription(true);
          try {
            const latestJob = await getMyLatestTranscriptionJob();
            
            if (latestJob && latestJob.status === 'completed' && latestJob.result?.vttContent) {
              const model = latestJob.model as TranscriptionModel;
              
              const updatedTranscriptions = { ...transcriptions };
              updatedTranscriptions[model] = { 
                vtt: latestJob.result.vttContent, 
                prompt: latestJob.result.prompt || DEFAULT_TRANSCRIPTION_PROMPT, 
                loading: false 
              };
              
              setTranscriptions(updatedTranscriptions);
              
              setSelectedTranscription(latestJob.result.vttContent);
              setSelectedModel(model);
              
              if (latestJob.file_path) {
                try {
                  const { data: fileData, error: downloadError } = await supabase.storage
                    .from('transcription-files')
                    .download(latestJob.file_path);
                  
                  if (fileData && !downloadError) {
                    const restoredFile = new File([fileData], latestJob.file_name || 'audio.mp3', {
                      type: 'audio/mpeg'
                    });
                    
                    setFile(restoredFile);
                    const newAudioUrl = URL.createObjectURL(restoredFile);
                    setAudioUrl(newAudioUrl);
                    
                    toast({
                      title: "Previous Work Restored",
                      description: `Restored your previous transcription of "${latestJob.file_name}"`,
                    });
                  }
                } catch (downloadErr) {
                  console.error("Failed to download audio file:", downloadErr);
                }
              }
              
              addLog(`Restored previous transcription from job ${latestJob.id}`, "info", {
                source: "StateRestoration",
                details: `Model: ${model}, VTT content length: ${latestJob.result.vttContent.length}`
              });
            } else if (latestJob && (latestJob.status === 'pending' || latestJob.status === 'processing')) {
              toast({
                title: "Transcription In Progress",
                description: "You have a transcription job currently in progress. Check the Jobs tab to see its status.",
              });
              
              document.querySelector('[value="jobs"]')?.dispatchEvent(new Event('click'));
            }
          } catch (err) {
            console.error("Error fetching latest job:", err);
          } finally {
            setLoadingExistingTranscription(false);
          }
        }
      } catch (error) {
        console.error('Error loading transcription jobs:', error);
      }
    };
    
    if (isAuthenticated) {
      loadJobsAndCheckLatest();
    }
  }, [isAuthenticated]);
  
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
  
  const toggleAudioPlayback = () => {
    if (!audioRef.current) return;
    
    if (isAudioPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsAudioPlaying(!isAudioPlaying);
  };
  
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
  
  const processNextInQueue = async () => {
    if (currentQueueIndex >= fileQueue.length) {
      return;
    }
    
    const nextFile = fileQueue[currentQueueIndex];
    await handleFileUpload(nextFile);
    setCurrentQueueIndex(prev => prev + 1);
  };
  
  const skipCurrentInQueue = () => {
    addLog(`Skipped file: ${fileQueue[currentQueueIndex]?.name}`, "info", {
      source: "FileQueue"
    });
    setCurrentQueueIndex(prev => prev + 1);
  };
  
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
  
  const processTranscriptions = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please upload an audio file first.",
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
      
      const updatedTranscriptions = { ...transcriptions };
      selectedModels.forEach(model => {
        updatedTranscriptions[model] = { vtt: "", prompt: transcriptionPrompt, loading: true };
      });
      setTranscriptions(updatedTranscriptions);
      
      addLog(`Processing transcriptions with models: ${selectedModels.join(", ")}`, "info", {
        details: `File: ${file.name} | Size: ${Math.round(file.size / 1024)} KB | Prompt: "${transcriptionPrompt}"`,
        source: "Transcription"
      });
      
      const transcriptionPromises = selectedModels.map(async (model) => {
        const modelLog = startTimedLog(`${model.toUpperCase()} Transcription`, "info", model.toUpperCase());
        
        try {
          modelLog.update(`Sending audio to ${model} with prompt: "${transcriptionPrompt}"`);
          const result = await transcribeAudio(file, model, transcriptionPrompt);
          
          if (model === 'gemini-2.0-flash') {
            addLog(`Gemini transcription result received`, "debug", {
              source: "gemini-2.0-flash",
              details: `VTT Content length: ${result.vttContent.length}, First 100 chars: ${result.vttContent.substring(0, 100)}...`
            });
          }
          
          const wordCount = result.vttContent.split(/\s+/).length;
          modelLog.complete(
            `${model.toUpperCase()} transcription successful`, 
            `Generated ${wordCount} words | VTT format | Length: ${result.vttContent.length} characters`
          );
          
          return { model, vtt: result.vttContent, prompt: result.prompt || transcriptionPrompt };
        } catch (error) {
          modelLog.error(
            `${model.toUpperCase()} transcription failed`,
            error instanceof Error ? error.message : String(error)
          );
          throw error;
        }
      });
      
      const results = await Promise.allSettled(transcriptionPromises);
      
      const finalTranscriptions = { ...transcriptions };
      
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          const { model, vtt, prompt } = result.value;
          
          if (model === 'gemini-2.0-flash') {
            addLog(`Updating Gemini transcription in state`, "debug", {
              source: "gemini-2.0-flash",
              details: `VTT length: ${vtt.length}, First 100 chars: ${vtt.substring(0, 100)}...`
            });
          }
          
          finalTranscriptions[model] = { vtt, prompt, loading: false };
        } else {
          const failedModelIndex = results.findIndex(r => r === result);
          if (failedModelIndex >= 0 && failedModelIndex < selectedModels.length) {
            const model = selectedModels[failedModelIndex];
            finalTranscriptions[model] = { vtt: "", prompt: transcriptionPrompt, loading: false };
          }
        }
      });
      
      addLog(`Updating transcriptions state with results`, "debug", {
        source: "Transcription",
        details: `Models processed: ${selectedModels.join(', ')}`
      });
      
      setTranscriptions(finalTranscriptions);
      
      if (selectedModels.includes('gemini-2.0-flash')) {
        addLog(`Gemini state after update: ${finalTranscriptions['gemini-2.0-flash']?.vtt ? 'Has content' : 'No content'}`, "debug", {
          source: "gemini-2.0-flash",
          details: `VTT length: ${finalTranscriptions['gemini-2.0-flash']?.vtt?.length || 0}`
        });
      }
      
      const successfulTranscriptions = results.filter(r => r.status === "fulfilled").length;
      
      if (successfulTranscriptions > 0) {
        mainLog.complete(
          `Transcription process completed`, 
          `${successfulTranscriptions} out of ${selectedModels.length} transcriptions successful`
        );
        
        toast({
          title: "Transcription Complete",
          description: `${successfulTranscriptions} out of ${selectedModels.length} transcriptions completed successfully.`,
        });
        
        if (notificationsEnabled) {
          showNotification("Transcription Complete", {
            body: `${successfulTranscriptions} out of ${selectedModels.length} transcriptions completed successfully.`,
            tag: "transcription-complete"
          });
        }
      } else {
        mainLog.error(
          `Transcription process failed`,
          `All ${selectedModels.length} transcription attempts failed`
        );
        
        toast({
          title: "Transcription Failed",
          description: "All transcription attempts failed. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error processing transcriptions:", error);
      addLog(`Error in transcription process`, "error", {
        details: error instanceof Error ? error.message : String(error),
        source: "Transcription"
      });
      
      toast({
        title: "Processing Error",
        description: "There was a problem processing your transcriptions.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleSelectTranscription = (model: string, vtt: string) => {
    setSelectedTranscription(vtt);
    setSelectedModel(model);
    addLog(`Selected ${model.toUpperCase()} transcription for publishing`, "info", {
      source: "Selection",
      details: `VTT length: ${vtt.length} characters | Word count: ${vtt.split(/\s+/).length} words`
    });
  };
  
  const handleAsyncTranscriptionComplete = (vttContent: string, jobId: string) => {
    setSelectedTranscription(vttContent);
    setSelectedModel(`job-${jobId}`);
    
    addLog(`Selected async transcription result for publishing`, "info", {
      source: "AsyncTranscriber",
      details: `Job ID: ${jobId} | VTT length: ${vttContent.length} characters`
    });
  };
  
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
  
  const refreshTranscriptionJobs = async () => {
    try {
      const jobs = await getMyTranscriptionJobs();
      setTranscriptionJobs(jobs);
      
      toast({
        title: "Jobs Refreshed",
        description: `Found ${jobs.length} transcription jobs`,
      });
    } catch (error) {
      console.error('Error refreshing transcription jobs:', error);
      
      toast({
        title: "Refresh Failed",
        description: "Could not refresh transcription jobs",
        variant: "destructive",
      });
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
          
          {loadingExistingTranscription && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md flex items-center justify-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-sm text-blue-700 dark:text-blue-400">Checking for previous transcriptions...</span>
            </div>
          )}
          
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
                    <div className="mb-3">
                      <div className="text-sm font-medium mb-1.5">Processing Mode:</div>
                      <div className="flex">
                        <Button 
                          variant={processingMode === "sync" ? "default" : "outline"} 
                          size="sm"
                          className="flex-1 mr-2"
                          onClick={() => setProcessingMode("sync")}
                        >
                          Synchronous
                        </Button>
                        <Button 
                          variant={processingMode === "async" ? "default" : "outline"} 
                          size="sm"
                          className="flex-1"
                          onClick={() => setProcessingMode("async")}
                        >
                          Asynchronous
                        </Button>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">
                        {processingMode === "sync" ? (
                          "Process in real-time. Wait for results."
                        ) : (
                          "Queue job for background processing. Track progress, can close browser."
                        )}
                      </div>
                    </div>
                    
                    {processingMode === "sync" && (
                      <>
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
                      </>
                    )}
                    
                    {processingMode === "async" && file && (
                      <AsyncTranscriber 
                        file={file}
                        model="openai" 
                        onComplete={handleAsyncTranscriptionComplete}
                      />
                    )}
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
              <Tabs defaultValue="transcriptions" className="w-full">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="transcriptions" className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Transcription Results
                  </TabsTrigger>
                  <TabsTrigger value="jobs" className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Transcription Jobs
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="transcriptions" className="space-y-4">
                  {selectedModels.length > 0 && processingMode === "sync" ? (
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
                            onSelect={() => handleSelectTranscription(model, transcription.vtt)}
                            isSelected={selectedModel === model}
                            audioSrc={audioUrl || undefined}
                            isLoading={transcription.loading}
                          />
                        );
                      })}
                    </div>
                  ) : processingMode === "async" ? (
                    <Card className="p-8 flex flex-col items-center justify-center text-center">
                      <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Async Transcription Mode</h3>
                      <p className="text-muted-foreground max-w-md">
                        In this mode, your transcription will be processed in the background. You can check the "Transcription Jobs" tab to see the status of your jobs.
                      </p>
                    </Card>
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
                
                <TabsContent value="jobs" className="space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-semibold">Transcription Jobs</h2>
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={refreshTranscriptionJobs}
                    >
                      <ListFilter className="h-4 w-4 mr-2" />
                      Refresh Jobs
                    </Button>
                  </div>
                  
                  {transcriptionJobs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {transcriptionJobs.map(job => (
                        <Card key={job.id} className="overflow-hidden">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-lg flex items-center">
                                Job: {job.id.slice(0, 8)}...
                              </CardTitle>
                              <Badge 
                                variant={job.status === "completed" ? "default" : 
                                        job.status === "failed" ? "destructive" : 
                                        "secondary"}
                              >
                                {job.status_message}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              <span className="font-medium">Model:</span> {job.model} | 
                              <span className="font-medium ml-1">Created:</span> {new Date(job.created_at).toLocaleString()}
                            </div>
                          </CardHeader>
                          <CardContent className="pb-4">
                            {job.status === "completed" && job.result ? (
                              <div className="flex flex-col space-y-2">
                                <div className="text-sm text-muted-foreground">
                                  Transcription completed successfully
                                </div>
                                <Button 
                                  size="sm" 
                                  onClick={() => {
                                    if (job.result.vttContent) {
                                      handleAsyncTranscriptionComplete(job.result.vttContent, job.id);
                                    }
                                  }}
                                  disabled={!job.result.vttContent}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Use this transcription
                                </Button>
                              </div>
                            ) : job.status === "failed" ? (
                              <div className="text-sm text-red-500">
                                <span className="font-medium">Error:</span> {job.error || "Unknown error"}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                Job is {job.status}...
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-8 flex flex-col items-center justify-center text-center">
                      <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Transcription Jobs</h3>
                      <p className="text-muted-foreground max-w-md">
                        You haven't created any async transcription jobs yet. Upload an audio file and use the Async mode to create jobs.
                      </p>
                    </Card>
                  )}
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
