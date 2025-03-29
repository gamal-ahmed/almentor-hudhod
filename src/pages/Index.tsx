import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Check, Loader2, Upload, FileAudio, Cog, Send, Upload as UploadIcon } from "lucide-react";

import FileUpload from "@/components/FileUpload";
import ModelSelector, { TranscriptionModel } from "@/components/ModelSelector";
import TranscriptionCard from "@/components/TranscriptionCard";
import LogsPanel from "@/components/LogsPanel";
import VideoIdInput from "@/components/VideoIdInput";
import { useLogsStore } from "@/lib/useLogsStore";
import { 
  transcribeAudio, 
  uploadToS3, 
  fetchS3Keys, 
  fetchBrightcoveKeys,
  getBrightcoveAuthToken,
  addCaptionToBrightcove,
  getPresignedUrl,
  uploadToS3Direct
} from "@/lib/api";

const Index = () => {
  // Main state
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedModels, setSelectedModels] = useState<TranscriptionModel[]>(["openai", "gemini"]);
  const [videoId, setVideoId] = useState<string>("");
  const [selectedTranscription, setSelectedTranscription] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  
  // Processing state
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDirectPublishing, setIsDirectPublishing] = useState(false);
  const [transcriptions, setTranscriptions] = useState<Record<string, { vtt: string, loading: boolean }>>({
    openai: { vtt: "", loading: false },
    gemini: { vtt: "", loading: false }
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
      setTranscriptions({
        openai: { vtt: "", loading: false },
        gemini: { vtt: "", loading: false }
      });
      
      addLog(`File selected: ${uploadedFile.name}`, "info", {
        details: `Size: ${Math.round(uploadedFile.size / 1024)} KB | Type: ${uploadedFile.type}`,
        source: "FileUpload"
      });
      
      toast.toast({
        title: "File Selected",
        description: "Your audio file has been selected successfully.",
      });
    } catch (error) {
      console.error("Error selecting file:", error);
      addLog(`Error selecting file`, "error", {
        details: error instanceof Error ? error.message : String(error),
        source: "FileUpload"
      });
      
      toast.toast({
        title: "Selection Failed",
        description: "There was a problem selecting your file.",
        variant: "destructive",
      });
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
        updatedTranscriptions[model] = { vtt: "", loading: true };
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
          modelLog.update(`Sending audio to ${model} API...`);
          const vttContent = await transcribeAudio(file, model);
          
          const wordCount = vttContent.split(/\s+/).length;
          modelLog.complete(
            `${model.toUpperCase()} transcription successful`, 
            `Generated ${wordCount} words | VTT format | Length: ${vttContent.length} characters`
          );
          
          return { model, vtt: vttContent };
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
          const { model, vtt } = result.value;
          finalTranscriptions[model] = { vtt, loading: false };
        } else {
          // Find the model that failed
          const failedModelIndex = results.findIndex(r => r === result);
          if (failedModelIndex >= 0 && failedModelIndex < selectedModels.length) {
            const model = selectedModels[failedModelIndex];
            finalTranscriptions[model] = { vtt: "", loading: false };
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
  
  // Publish caption to Brightcove through edge function
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
      
      // Create VTT file
      const vttBlob = new Blob([selectedTranscription], { type: 'text/vtt' });
      const vttFile = new File([vttBlob], `caption-${Date.now()}.vtt`, { type: 'text/vtt' });
      
      // Upload VTT to S3
      const s3Log = startTimedLog("VTT S3 Upload", "info", "AWS S3");
      const vttKey = `captions/${Date.now()}/caption.vtt`;
      
      // Get S3 credentials
      const s3CredentialsLog = startTimedLog("Fetching S3 credentials", "info", "API");
      try {
        const s3Keys = await fetchS3Keys();
        s3CredentialsLog.complete("S3 credentials retrieved successfully");
      } catch (error) {
        s3CredentialsLog.error("Failed to fetch S3 credentials", error instanceof Error ? error.message : String(error));
        throw error;
      }
      
      let vttUrl;
      try {
        vttUrl = await uploadToS3(vttFile, vttKey);
        s3Log.complete(`Caption file uploaded to S3`, `URL: ${vttUrl}`);
      } catch (error) {
        s3Log.error("Failed to upload caption to S3", error instanceof Error ? error.message : String(error));
        throw error;
      }
      
      // Get Brightcove credentials
      const brightcoveCredentialsLog = startTimedLog("Brightcove Authentication", "info", "Brightcove API");
      
      let brightcoveKeys;
      try {
        brightcoveKeys = await fetchBrightcoveKeys();
        brightcoveCredentialsLog.update("Retrieving Brightcove auth token...");
        
        // Get Brightcove authentication token
        const authToken = await getBrightcoveAuthToken(
          brightcoveKeys.brightcove_client_id,
          brightcoveKeys.brightcove_client_secret
        );
        
        brightcoveCredentialsLog.complete("Brightcove authentication successful", 
          `Account ID: ${brightcoveKeys.brightcove_account_id} | Token obtained`);
        
        // Add caption to Brightcove video
        publishLog.update(`Adding caption to Brightcove video ID: ${videoId}`);
        
        await addCaptionToBrightcove(
          videoId,
          vttUrl,
          'ar',
          'Arabic',
          brightcoveKeys.brightcove_account_id,
          authToken
        );
        
        publishLog.complete(
          "Caption published successfully", 
          `Video ID: ${videoId} | Language: Arabic | Caption URL: ${vttUrl}`
        );
        
        toast.toast({
          title: "Caption Published",
          description: "Your caption has been successfully published to the Brightcove video.",
        });
      } catch (error) {
        brightcoveCredentialsLog.error("Brightcove authentication failed", error instanceof Error ? error.message : String(error));
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
  
  // Publish caption to Brightcove through client-side upload
  const publishCaptionDirect = async () => {
    if (!selectedTranscription || !videoId) {
      toast.toast({
        title: "Missing Information",
        description: "Please select a transcription and enter a video ID.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsDirectPublishing(true);
      const publishLog = startTimedLog("Direct Caption Publishing", "info", "Client-S3");
      
      publishLog.update(`Preparing caption for direct upload - video ID: ${videoId}`);
      
      // Create VTT file
      const vttBlob = new Blob([selectedTranscription], { type: 'text/vtt' });
      const fileName = `caption-${Date.now()}.vtt`;
      const vttFile = new File([vttBlob], fileName, { type: 'text/vtt' });
      
      // Get a pre-signed URL for direct upload
      const s3DirectLog = startTimedLog("Getting pre-signed URL", "info", "Client-S3");
      let presignedUrlData;
      
      try {
        presignedUrlData = await getPresignedUrl(fileName, 'text/vtt');
        s3DirectLog.complete("Pre-signed URL obtained successfully");
      } catch (error) {
        s3DirectLog.error("Failed to get pre-signed URL", error instanceof Error ? error.message : String(error));
        throw error;
      }
      
      // Upload directly to S3 using the pre-signed URL
      const uploadLog = startTimedLog("Direct S3 Upload", "info", "Client-S3");
      let vttUrl;
      
      try {
        await uploadToS3Direct(vttFile, presignedUrlData.presignedUrl);
        vttUrl = presignedUrlData.publicUrl;
        uploadLog.complete(`Caption file directly uploaded to S3`, `URL: ${vttUrl}`);
      } catch (error) {
        uploadLog.error("Failed to upload caption directly to S3", error instanceof Error ? error.message : String(error));
        throw error;
      }
      
      // Get Brightcove credentials
      const brightcoveCredentialsLog = startTimedLog("Brightcove Authentication", "info", "Brightcove API");
      
      let brightcoveKeys;
      try {
        brightcoveKeys = await fetchBrightcoveKeys();
        brightcoveCredentialsLog.update("Retrieving Brightcove auth token...");
        
        // Get Brightcove authentication token
        const authToken = await getBrightcoveAuthToken(
          brightcoveKeys.brightcove_client_id,
          brightcoveKeys.brightcove_client_secret
        );
        
        brightcoveCredentialsLog.complete("Brightcove authentication successful", 
          `Account ID: ${brightcoveKeys.brightcove_account_id} | Token obtained`);
        
        // Add caption to Brightcove video
        publishLog.update(`Adding caption to Brightcove video ID: ${videoId}`);
        
        await addCaptionToBrightcove(
          videoId,
          vttUrl,
          'ar',
          'Arabic',
          brightcoveKeys.brightcove_account_id,
          authToken
        );
        
        publishLog.complete(
          "Caption published successfully via direct upload", 
          `Video ID: ${videoId} | Language: Arabic | Caption URL: ${vttUrl}`
        );
        
        toast.toast({
          title: "Caption Published",
          description: "Your caption has been successfully published to the Brightcove video via direct upload.",
        });
      } catch (error) {
        brightcoveCredentialsLog.error("Brightcove authentication failed", error instanceof Error ? error.message : String(error));
        publishLog.error("Direct caption publishing failed", error instanceof Error ? error.message : String(error));
        throw error;
      }
    } catch (error) {
      console.error("Error publishing caption directly:", error);
      addLog(`Error in direct publishing`, "error", {
        details: error instanceof Error ? error.message : String(error),
        source: "Client-S3"
      });
      
      toast.toast({
        title: "Direct Publishing Failed",
        description: "There was a problem publishing your caption via direct upload.",
        variant: "destructive",
      });
    } finally {
      setIsDirectPublishing(false);
    }
  };
  
  return (
    <div className="min-h-screen max-w-7xl mx-auto p-4 md:p-6">
      <header className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Transcription Pipeline</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Upload an MP3 file, generate transcriptions with multiple models, and publish captions to Brightcove.
        </p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Upload */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FileAudio className="mr-2 h-5 w-5" />
                Step 1: Upload Audio File
              </h2>
              <FileUpload onFileUpload={handleFileUpload} isUploading={isUploading} />
              
              {file && (
                <div className="mt-4">
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    File uploaded: <span className="font-medium ml-1">{file.name}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Step 2: Select Models & Process */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Cog className="mr-2 h-5 w-5" />
                Step 2: Generate Transcriptions
              </h2>
              
              <div className="space-y-4">
                <ModelSelector 
                  selectedModels={selectedModels} 
                  onModelChange={setSelectedModels}
                  disabled={isProcessing || !file}
                />
                
                <Button 
                  onClick={processTranscriptions} 
                  disabled={isProcessing || !file || selectedModels.length === 0}
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Generate Transcriptions</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Step 3: Review & Select */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-2">Step 3: Review & Select</h2>
            
            {selectedModels.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedModels.map((model) => (
                  <TranscriptionCard
                    key={model}
                    modelName={model === "openai" ? "OpenAI Whisper" : "Google Gemini"}
                    vttContent={transcriptions[model].vtt}
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
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Send className="mr-2 h-5 w-5" />
                Step 4: Publish to Brightcove
              </h2>
              
              <div className="space-y-4">
                <VideoIdInput 
                  videoId={videoId} 
                  onChange={setVideoId}
                  disabled={isPublishing || isDirectPublishing}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={publishCaption} 
                    disabled={isPublishing || isDirectPublishing || !selectedTranscription || !videoId}
                    className="w-full"
                    variant="default"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Publishing via Edge...
                      </>
                    ) : (
                      <>Publish via Edge Function</>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={publishCaptionDirect} 
                    disabled={isPublishing || isDirectPublishing || !selectedTranscription || !videoId}
                    className="w-full"
                    variant="secondary"
                  >
                    {isDirectPublishing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Direct Publishing...
                      </>
                    ) : (
                      <>
                        <UploadIcon className="mr-2 h-4 w-4" />
                        Publish Direct to S3
                      </>
                    )}
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground mt-2">
                  <span className="font-medium">Edge Function:</span> Upload through Supabase Edge Function. More reliable but slightly slower.<br/>
                  <span className="font-medium">Direct to S3:</span> Upload directly from browser to S3. Faster but may have CORS limitations.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Log Panel */}
        <div className="lg:row-span-2 h-[600px]">
          <h2 className="text-xl font-semibold mb-4">System Logs</h2>
          <LogsPanel logs={logs} />
        </div>
      </div>
    </div>
  );
};

export default Index;
