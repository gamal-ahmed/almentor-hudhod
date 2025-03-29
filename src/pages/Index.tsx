
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/toast";
import { Check, Loader2, Upload, FileAudio, Cog, Send } from "lucide-react";

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
  addCaptionToBrightcove
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
  const [transcriptions, setTranscriptions] = useState<Record<string, { vtt: string, loading: boolean }>>({
    openai: { vtt: "", loading: false },
    gemini: { vtt: "", loading: false }
  });
  
  // Logs and notification
  const { logs, addLog } = useLogsStore();
  const toast = useToast();
  
  // Track if the file has been uploaded to S3
  const fileS3UrlRef = useRef<string | null>(null);
  
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
      
      addLog(`File selected: ${uploadedFile.name} (${Math.round(uploadedFile.size / 1024)} KB)`, "info");
      
      // Upload to S3
      setIsUploading(true);
      addLog("Preparing to upload file to S3...", "info");
      
      const s3Keys = await fetchS3Keys();
      addLog("S3 credentials retrieved successfully", "info");
      
      const fileKey = `audio/${Date.now()}-${uploadedFile.name}`;
      addLog(`Uploading file to S3 with key: ${fileKey}`, "info");
      
      fileS3UrlRef.current = await uploadToS3(uploadedFile, fileKey);
      addLog(`File uploaded to S3 successfully: ${fileS3UrlRef.current}`, "success");
      
      toast.toast({
        title: "File Uploaded",
        description: "Your audio file has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      addLog(`Error uploading file: ${error instanceof Error ? error.message : String(error)}`, "error");
      
      toast.toast({
        title: "Upload Failed",
        description: "There was a problem uploading your file.",
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
      addLog("Starting transcription process", "info");
      
      // Reset transcriptions state for selected models
      const updatedTranscriptions = { ...transcriptions };
      selectedModels.forEach(model => {
        updatedTranscriptions[model] = { vtt: "", loading: true };
      });
      setTranscriptions(updatedTranscriptions);
      
      // Process each selected model in parallel
      const transcriptionPromises = selectedModels.map(async (model) => {
        try {
          addLog(`Starting ${model} transcription...`, "info");
          const vttContent = await transcribeAudio(file, model);
          
          addLog(`${model} transcription completed successfully`, "success");
          
          return { model, vtt: vttContent };
        } catch (error) {
          addLog(`${model} transcription failed: ${error instanceof Error ? error.message : String(error)}`, "error");
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
        toast.toast({
          title: "Transcription Complete",
          description: `${successfulTranscriptions} out of ${selectedModels.length} transcriptions completed successfully.`,
        });
      } else {
        toast.toast({
          title: "Transcription Failed",
          description: "All transcription attempts failed. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error processing transcriptions:", error);
      addLog(`Error in transcription process: ${error instanceof Error ? error.message : String(error)}`, "error");
      
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
    addLog(`Selected ${model} transcription for publishing`, "info");
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
      addLog(`Starting caption publishing process for video ID: ${videoId}`, "info");
      
      // Create VTT file
      const vttBlob = new Blob([selectedTranscription], { type: 'text/vtt' });
      const vttFile = new File([vttBlob], `caption-${Date.now()}.vtt`, { type: 'text/vtt' });
      
      // Upload VTT to S3
      addLog("Uploading caption file to S3...", "info");
      const vttKey = `captions/${Date.now()}/caption.vtt`;
      const vttUrl = await uploadToS3(vttFile, vttKey);
      addLog(`Caption file uploaded to S3: ${vttUrl}`, "success");
      
      // Get Brightcove credentials
      addLog("Retrieving Brightcove credentials...", "info");
      const brightcoveKeys = await fetchBrightcoveKeys();
      
      // Get Brightcove authentication token
      addLog("Authenticating with Brightcove...", "info");
      const authToken = await getBrightcoveAuthToken(
        brightcoveKeys.brightcove_client_id,
        brightcoveKeys.brightcove_client_secret
      );
      addLog("Brightcove authentication successful", "success");
      
      // Add caption to Brightcove video
      addLog(`Adding caption to Brightcove video ID: ${videoId}`, "info");
      await addCaptionToBrightcove(
        videoId,
        vttUrl,
        'ar',
        'Arabic',
        brightcoveKeys.brightcove_account_id,
        authToken
      );
      
      addLog("Caption published successfully to Brightcove video", "success");
      toast.toast({
        title: "Caption Published",
        description: "Your caption has been successfully published to the Brightcove video.",
      });
    } catch (error) {
      console.error("Error publishing caption:", error);
      addLog(`Error publishing caption: ${error instanceof Error ? error.message : String(error)}`, "error");
      
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
                  disabled={isPublishing}
                />
                
                <Button 
                  onClick={publishCaption} 
                  disabled={isPublishing || !selectedTranscription || !videoId}
                  className="w-full"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>Publish Caption</>
                  )}
                </Button>
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
