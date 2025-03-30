
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Check, Loader2, Upload, FileAudio, Cog, Send, Info, FileText } from "lucide-react";

import FileUpload from "@/components/FileUpload";
import ModelSelector, { TranscriptionModel } from "@/components/ModelSelector";
import TranscriptionCard from "@/components/TranscriptionCard";
import LogsPanel from "@/components/LogsPanel";
import VideoIdInput from "@/components/VideoIdInput";
import { useLogsStore } from "@/lib/useLogsStore";
import { 
  transcribeAudio, 
  fetchBrightcoveKeys,
  getBrightcoveAuthToken,
  addCaptionToBrightcove
} from "@/lib/api";
import { DEFAULT_TRANSCRIPTION_PROMPT } from "@/lib/phi4TranscriptionService";

const Index = () => {
  // Main state
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedModels, setSelectedModels] = useState<TranscriptionModel[]>(["openai", "gemini", "phi4"]);
  const [videoId, setVideoId] = useState<string>("");
  const [selectedTranscription, setSelectedTranscription] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [transcriptionPrompt, setTranscriptionPrompt] = useState<string>(DEFAULT_TRANSCRIPTION_PROMPT);
  
  // Processing state
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [transcriptions, setTranscriptions] = useState<Record<string, { vtt: string, prompt: string, loading: boolean }>>({
    openai: { vtt: "", prompt: "", loading: false },
    gemini: { vtt: "", prompt: "", loading: false },
    phi4: { vtt: "", prompt: "", loading: false }
  });
  
  // Logs and notification
  const { logs, addLog, startTimedLog } = useLogsStore();
  const toast = useToast();
  
  // When a file is uploaded
  const handleFileUpload = async (uploadedFile: File) => {
    try {
      // Reset state
      setFile(uploadedFile);
      setAudioUrl(URL.createObjectURL(uploadedFile));
      setSelectedTranscription(null);
      setSelectedModel(null);
      
      // Make sure to reset transcriptions for all models
      setTranscriptions({
        openai: { vtt: "", prompt: "", loading: false },
        gemini: { vtt: "", prompt: "", loading: false },
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
  
  // Process transcriptions with selected models
  const processTranscriptions = async () => {
    if (!file) {
      toast.toast({
        title: "No File Selected",
        description: "Please upload an audio file first.",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedModels.length === 0) {
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
      
      // Reset transcriptions state for selected models
      const updatedTranscriptions = { ...transcriptions };
      selectedModels.forEach(model => {
        updatedTranscriptions[model] = { vtt: "", prompt: "", loading: true };
      });
      setTranscriptions(updatedTranscriptions);
      
      addLog(`Processing transcriptions with models: ${selectedModels.join(", ")}`, "info", {
        details: `File: ${file.name} | Size: ${Math.round(file.size / 1024)} KB`,
        source: "Transcription"
      });
      
      // Process each selected model in parallel
      const transcriptionPromises = selectedModels.map(async (model) => {
        const modelLog = startTimedLog(`${model.toUpperCase()} Transcription`, "info", model.toUpperCase());
        
        try {
          modelLog.update(`Sending audio to ${model} with prompt: "${transcriptionPrompt}"`);
          const result = await transcribeAudio(file, model, transcriptionPrompt);
          
          const wordCount = result.vttContent.split(/\s+/).length;
          modelLog.complete(
            `${model.toUpperCase()} transcription successful`, 
            `Generated ${wordCount} words | VTT format | Length: ${result.vttContent.length} characters`
          );
          
          return { model, vtt: result.vttContent, prompt: result.prompt };
        } catch (error) {
          modelLog.error(
            `${model.toUpperCase()} transcription failed`,
            error instanceof Error ? error.message : String(error)
          );
          throw error;
        }
      });
      
      // Wait for all transcriptions to complete
      const results = await Promise.allSettled(transcriptionPromises);
      
      // Update state with results
      const finalTranscriptions = { ...transcriptions };
      
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          const { model, vtt, prompt } = result.value;
          finalTranscriptions[model] = { vtt, prompt, loading: false };
        } else {
          // Find the model that failed
          const failedModelIndex = results.findIndex(r => r === result);
          if (failedModelIndex >= 0 && failedModelIndex < selectedModels.length) {
            const model = selectedModels[failedModelIndex];
            finalTranscriptions[model] = { vtt: "", prompt: "", loading: false };
          }
        }
      });
      
      setTranscriptions(finalTranscriptions);
      
      // Check if any transcriptions succeeded
      const successfulTranscriptions = results.filter(r => r.status === "fulfilled").length;
      
      if (successfulTranscriptions > 0) {
        mainLog.complete(
          `Transcription process completed`, 
          `${successfulTranscriptions} out of ${selectedModels.length} transcriptions successful`
        );
        
        toast.toast({
          title: "Transcription Complete",
          description: `${successfulTranscriptions} out of ${selectedModels.length} transcriptions completed successfully.`,
        });
      } else {
        mainLog.error(
          `Transcription process failed`,
          `All ${selectedModels.length} transcription attempts failed`
        );
        
        toast.toast({
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
      
      toast.toast({
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
      
      // Get Brightcove credentials
      const credentialsLog = startTimedLog("Brightcove Authentication", "info", "Brightcove API");
      
      let brightcoveKeys;
      try {
        brightcoveKeys = await fetchBrightcoveKeys();
        credentialsLog.update("Retrieving Brightcove auth token...");
        
        // Get Brightcove authentication token
        const authToken = await getBrightcoveAuthToken(
          brightcoveKeys.brightcove_client_id,
          brightcoveKeys.brightcove_client_secret
        );
        
        credentialsLog.complete("Brightcove authentication successful", 
          `Account ID: ${brightcoveKeys.brightcove_account_id} | Token obtained`);
        
        // Add caption directly to Brightcove video (without S3)
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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Transcription Pipeline
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload an MP3 file, generate transcriptions with multiple AI models, and publish captions to Brightcove.
          </p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Upload */}
            <Card className="overflow-hidden border-t-4 border-t-blue-500 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <FileAudio className="mr-2 h-5 w-5 text-blue-500" />
                  Step 1: Upload Audio File
                </h2>
                <FileUpload onFileUpload={handleFileUpload} isUploading={isUploading} />
                
                {file && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-sm flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2" />
                      <span className="font-medium">File selected:</span> 
                      <span className="ml-1">{file.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({Math.round(file.size / 1024)} KB)
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Step 2: Select Models & Process */}
            <Card className="overflow-hidden border-t-4 border-t-green-500 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Cog className="mr-2 h-5 w-5 text-green-500" />
                  Step 2: Generate Transcriptions
                </h2>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="prompt" className="text-sm font-medium">
                        Transcription Prompt:
                      </label>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Info className="h-3 w-3 mr-1" />
                        <span>Not all models support prompts</span>
                      </div>
                    </div>
                    <Textarea 
                      id="prompt"
                      value={transcriptionPrompt}
                      onChange={(e) => setTranscriptionPrompt(e.target.value)}
                      className="resize-none"
                      placeholder="Enter instructions for the transcription model..."
                      rows={2}
                    />
                  </div>
                  
                  <ModelSelector 
                    selectedModels={selectedModels} 
                    onModelChange={setSelectedModels}
                    disabled={isProcessing || !file}
                  />
                  
                  <Button 
                    onClick={processTranscriptions} 
                    disabled={isProcessing || !file || selectedModels.length === 0}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Generate Transcriptions
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Step 3: Review & Select */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold mb-2 flex items-center">
                <Check className="mr-2 h-5 w-5 text-violet-500" />
                Step 3: Review & Select
              </h2>
              
              {selectedModels.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {selectedModels.map((model) => (
                    <TranscriptionCard
                      key={model}
                      modelName={
                        model === "openai" 
                          ? "OpenAI Whisper" 
                          : model === "gemini" 
                            ? "Google Gemini" 
                            : "Microsoft Phi-4"
                      }
                      vttContent={transcriptions[model].vtt}
                      prompt={transcriptions[model].prompt}
                      onSelect={() => handleSelectTranscription(model, transcriptions[model].vtt)}
                      isSelected={selectedModel === model}
                      audioSrc={audioUrl || undefined}
                      isLoading={transcriptions[model].loading}
                    />
                  ))}
                </div>
              )}
            </div>
            
            {/* Step 4: Publish */}
            <Card className="overflow-hidden border-t-4 border-t-amber-500 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Send className="mr-2 h-5 w-5 text-amber-500" />
                  Step 4: Publish to Brightcove
                </h2>
                
                <div className="space-y-4">
                  <VideoIdInput 
                    videoId={videoId} 
                    onChange={setVideoId}
                    disabled={isPublishing}
                  />
                  
                  <Button 
                    onClick={publishCaption} 
                    disabled={isPublishing || !selectedTranscription || !videoId}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Publish Caption
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Log Panel */}
          <div className="lg:row-span-1">
            <div className="sticky top-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FileText className="mr-2 h-5 w-5 text-gray-500" />
                System Logs
              </h2>
              <div className="h-[600px] bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900 p-1 rounded-lg">
                <LogsPanel logs={logs} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
