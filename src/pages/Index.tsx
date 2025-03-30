import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast, toast } from "@/components/ui/use-toast";
import { Check, Loader2, Upload, FileAudio, Cog, Send, Info, FileText, PlayCircle, PauseCircle, Bell, BellOff, History } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import ModelSelector, { TranscriptionModel } from "@/components/ModelSelector";
import TranscriptionCard from "@/components/TranscriptionCard";
import LogsPanel from "@/components/LogsPanel";
import VideoIdInput from "@/components/VideoIdInput";
import PromptOptions from "@/components/PromptOptions";
import SharePointDownloader from "@/components/SharePointDownloader";
import FileQueue from "@/components/FileQueue";
import { useLogsStore } from "@/lib/useLogsStore";
import { 
  transcribeAudio, 
  fetchBrightcoveKeys,
  getBrightcoveAuthToken,
  addCaptionToBrightcove,
  getLatestTranscriptionsByModel,
  saveTranscriptionSession,
  getLatestTranscriptionSession
} from "@/lib/api";
import { requestNotificationPermission, showNotification } from "@/lib/notifications";
import Header from '@/components/Header';
import TranscriptionHistory from "@/components/TranscriptionHistory";
import { useAuth } from "@/lib/AuthContext";

const DEFAULT_TRANSCRIPTION_PROMPT = "Please preserve all English words exactly as spoken";

const Index = () => {
  // Auth context
  const { isAuthenticated, user } = useAuth();
  
  // Main state
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedModels, setSelectedModels] = useState<TranscriptionModel[]>(["openai", "gemini-2.0-flash", "phi4"]);
  const [videoId, setVideoId] = useState<string>("");
  const [selectedTranscription, setSelectedTranscription] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [transcriptionPrompt, setTranscriptionPrompt] = useState<string>(DEFAULT_TRANSCRIPTION_PROMPT);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  
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
  const [isLoadingStoredTranscriptions, setIsLoadingStoredTranscriptions] = useState<boolean>(false);
  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(false);
  
  // Logs and notification
  const { logs, addLog, startTimedLog } = useLogsStore();

  // Session persistence - save session state when it changes
  useEffect(() => {
    // Only save session if the user is authenticated and we have some data worth saving
    if (isAuthenticated && (file || selectedTranscription || Object.values(transcriptions).some(t => t.vtt))) {
      const saveSession = async () => {
        try {
          await saveTranscriptionSession(
            file?.name || null,
            selectedModels,
            transcriptions,
            selectedModel,
            selectedTranscription,
            videoId
          );
          
          addLog("Session state saved", "info", {
            source: "Session",
            details: "Saved current transcription state to database"
          });
        } catch (error) {
          console.error("Error saving session:", error);
          addLog("Failed to save session state", "error", {
            source: "Session",
            details: error instanceof Error ? error.message : String(error)
          });
        }
      };
      
      // Use debounce to avoid saving on every small change
      const timeoutId = setTimeout(saveSession, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, file, selectedModels, transcriptions, selectedModel, selectedTranscription, videoId]);

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
  }, [notificationsEnabled]);
  
  // Load stored transcriptions and restore session on component mount
  useEffect(() => {
    if (isAuthenticated) {
      loadStoredTranscriptions();
      restoreSession();
    }
  }, [isAuthenticated]);
  
  // Restore session from database
  const restoreSession = async () => {
    if (!isAuthenticated) return;
    
    setIsRestoringSession(true);
    try {
      addLog("Attempting to restore previous session", "info", {
        source: "Session",
        details: "Fetching saved transcription session"
      });
      
      const session = await getLatestTranscriptionSession();
      
      if (session) {
        addLog("Found saved session", "info", {
          source: "Session",
          details: `Last updated: ${new Date(session.last_updated).toLocaleString()}`
        });
        
        // Restore state from session
        setSelectedModels(session.selected_models || ["openai", "gemini-2.0-flash", "phi4"]);
        setTranscriptions(session.transcriptions || {
          openai: { vtt: "", prompt: "", loading: false },
          "gemini-2.0-flash": { vtt: "", prompt: "", loading: false },
          phi4: { vtt: "", prompt: "", loading: false }
        });
        setSelectedModel(session.selected_model || null);
        setSelectedTranscription(session.selected_transcription || null);
        setVideoId(session.video_id || "");
        
        toast({
          title: "Session Restored",
          description: "Your previous transcription session has been restored.",
        });
        
        addLog("Session restored successfully", "success", {
          source: "Session",
          details: `Restored transcriptions for models: ${Object.keys(session.transcriptions || {}).join(", ")}`
        });
      } else {
        addLog("No previous session found", "info", {
          source: "Session"
        });
      }
    } catch (error) {
      console.error("Error restoring session:", error);
      addLog("Failed to restore session", "error", {
        source: "Session",
        details: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsRestoringSession(false);
    }
  };
  
  // Load stored transcriptions from the server
  const loadStoredTranscriptions = async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingStoredTranscriptions(true);
    try {
      addLog("Loading stored transcriptions", "info", {
        source: "Database",
        details: "Fetching previous transcription results"
      });
      
      const latestTranscriptionsByModel = await getLatestTranscriptionsByModel();
      
      // If we have stored transcriptions, update the state
      if (Object.keys(latestTranscriptionsByModel).length > 0) {
        const updatedTranscriptions = { ...transcriptions };
        
        for (const [model, transcription] of Object.entries(latestTranscriptionsByModel)) {
          const typedTranscription = transcription as any; // Type assertion to avoid TS errors
          if (typedTranscription.result?.vttContent) {
            updatedTranscriptions[model as TranscriptionModel] = {
              vtt: typedTranscription.result.vttContent,
              prompt: typedTranscription.result.prompt || DEFAULT_TRANSCRIPTION_PROMPT,
              loading: false
            };
          }
        }
        
        setTranscriptions(updatedTranscriptions);
        
        addLog(`Loaded ${Object.keys(latestTranscriptionsByModel).length} stored transcriptions`, "success", {
          source: "Database",
          details: `Models: ${Object.keys(latestTranscriptionsByModel).join(", ")}`
        });
      } else {
        addLog("No stored transcriptions found", "info", {
          source: "Database"
        });
      }
    } catch (error) {
      console.error("Error loading stored transcriptions:", error);
      addLog("Error loading stored transcriptions", "error", {
        source: "Database",
        details: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setIsLoadingStoredTranscriptions(false);
    }
  };
  
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
      
      // Don't clear transcriptions if we just restored them
      if (!isRestoringSession) {
        setSelectedTranscription(null);
        setSelectedModel(null);
      }
      
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
      
      // Save session after file upload
      if (isAuthenticated) {
        await saveTranscriptionSession(
          uploadedFile.name,
          selectedModels,
          transcriptions,
          selectedModel,
          selectedTranscription,
          videoId
        );
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
  
  // Process transcriptions with selected models
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
  
  // When a transcription is selected
  const handleSelectTranscription = (model: string, vtt: string) => {
    setSelectedTranscription(vtt);
    setSelectedModel(model);
    addLog(`Selected ${model.toUpperCase()} transcription for publishing`, "info", {
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
  
  // Toggle transcription history panel
  const toggleHistoryPanel = () => {
    setShowHistory(!showHistory);
  };
  
  // Load a transcription from history
  const handleLoadTranscription = (transcription: any) => {
    if (transcription && transcription.result?.vttContent) {
      const model = transcription.model as TranscriptionModel;
      const updatedTranscriptions = { ...transcriptions };
      
      updatedTranscriptions[model] = {
        vtt: transcription.result.vttContent,
        prompt: transcription.result.prompt || DEFAULT_TRANSCRIPTION_PROMPT,
        loading: false
      };
      
      setTranscriptions(updatedTranscriptions);
      setSelectedModel(model);
      setSelectedTranscription(transcription.result.vttContent);
      
      addLog(`Loaded saved transcription from history`, "success", {
        source: "History",
        details: `Model: ${model} | File: ${transcription.file_path}`
      });
      
      toast({
        title: "Transcription Loaded",
        description: `Loaded ${model} transcription from your history.`,
      });
      
      setShowHistory(false);
    }
  };
  
  return (
    <>
      <Header />
      <div className="container py-6">
        {isRestoringSession && (
          <div className="max-w-[1440px] mx-auto bg-yellow-50 dark:bg-yellow-900/30 p-3 mb-4 rounded-md flex items-center">
            <Loader2 className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mr-2 animate-spin" />
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              Restoring your previous transcription session...
            </p>
          </div>
        )}
        
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
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold flex items-center">
                      <FileAudio className="mr-1 h-4 w-4 text-blue-500" />
                      Upload Audio
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 w-7 p-0" 
                      onClick={toggleHistoryPanel}
                      title="View Transcription History"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  </div>
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
                  
                  {isLoadingStoredTranscriptions && (
                    <div className="mt-2 flex items-center justify-center text-xs text-muted-foreground py-2">
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Loading saved transcriptions...
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
              {showHistory ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold flex items-center">
                      <History className="mr-2 h-5 w-5 text-violet-500" />
                      Transcription History
                    </h2>
                    <Button variant="outline" size="sm" onClick={toggleHistoryPanel}>
                      Back to Results
                    </Button>
                  </div>
                  <TranscriptionHistory onLoadTranscription={handleLoadTranscription} />
                </div>
              ) : (
                <div className="space-y-3">
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
                            onSelect={() => handleSelectTranscription(model, transcription.vtt)}
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
                </div>
              )}
              
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
