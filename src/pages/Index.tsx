import React, { useState } from 'react';
import Header from "@/components/Header";
import FileUpload from "@/components/FileUpload";
import ModelSelector from "@/components/ModelSelector";
import FileQueue from "@/components/FileQueue";
import LogsPanel from "@/components/LogsPanel";
import PromptOptions from "@/components/PromptOptions";
import TranscriptionJobs from "@/components/TranscriptionJobs";
import TranscriptionCard from "@/components/TranscriptionCard";
import VideoIdInput from "@/components/VideoIdInput";
import SessionHistory from "@/components/SessionHistory";
import SharePointDownloader from "@/components/SharePointDownloader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const Index = () => {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [selectedTranscription, setSelectedTranscription] = useState<string | null>(null);
  const [selectedTranscriptionModel, setSelectedTranscriptionModel] = useState<string | null>(null);
  const [audioFileUrl, setAudioFileUrl] = useState<string | null>(null);
  const [transcriptionPrompt, setTranscriptionPrompt] = useState("Please preserve all English words exactly as spoken");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const handleModelSelection = (models: string[]) => {
    setSelectedModels(models);
  };
  
  const handleFileQueued = (file: File) => {
    setQueuedFiles(prevFiles => [...prevFiles, file]);
  };
  
  const handleRemoveFile = (index: number) => {
    setQueuedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };
  
  const handleProcessFiles = () => {
    setProcessing(true);
    // Placeholder for actual processing logic
    setTimeout(() => {
      setProcessing(false);
      setRefreshTrigger(prev => prev + 1);
    }, 2000);
  };
  
  const handleTranscriptionSelect = (vtt: string, model: string) => {
    setSelectedTranscription(vtt);
    setSelectedTranscriptionModel(model);
    
    // Create a temporary URL for the audio file
    const audioFile = queuedFiles[0]; // Assuming the first file is the audio
    if (audioFile) {
      const url = URL.createObjectURL(audioFile);
      setAudioFileUrl(url);
    }
  };
  
  const handleVideoIdSubmit = (videoId: string) => {
    console.log("Video ID submitted:", videoId);
  };
  
  const handlePromptUpdate = (newPrompt: string) => {
    setTranscriptionPrompt(newPrompt);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <div className="flex-1 container py-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left column */}
          <div className="md:col-span-8 space-y-6">
            <div className="space-y-6">
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="mb-2">
                  <TabsTrigger value="upload">Upload Audio</TabsTrigger>
                  <TabsTrigger value="video-id">Brightcove Video</TabsTrigger>
                  <TabsTrigger value="sharepoint">SharePoint File</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload">
                  <FileUpload onFileQueued={handleFileQueued} />
                </TabsContent>
                
                <TabsContent value="video-id">
                  <VideoIdInput onVideoIdSubmit={handleVideoIdSubmit} />
                </TabsContent>
                
                <TabsContent value="sharepoint">
                  <SharePointDownloader onFileDownloaded={handleFileQueued} />
                </TabsContent>
              </Tabs>
              
              <ModelSelector 
                onModelSelect={handleModelSelection} 
                selectedModels={selectedModels}
              />
              
              <PromptOptions 
                onPromptUpdate={handlePromptUpdate}
                prompt={transcriptionPrompt}
              />
              
              <FileQueue 
                files={queuedFiles} 
                onRemoveFile={handleRemoveFile}
                onProcessFiles={handleProcessFiles}
                processing={processing}
              />
            </div>
            
            {/* Session History Section */}
            <SessionHistory />
            
            {/* Current Transcription jobs */}
            <TranscriptionJobs 
              onSelectTranscription={handleTranscriptionSelect}
              refreshTrigger={refreshTrigger}
            />
          </div>
          
          {/* Right column */}
          <div className="md:col-span-4 md:border-l md:pl-6">
            <div className="sticky top-4 space-y-6">
              <h2 className="text-xl font-semibold mb-2">Transcription Preview</h2>
              
              {selectedTranscription ? (
                <TranscriptionCard
                  modelName={selectedTranscriptionModel || ""}
                  vttContent={selectedTranscription}
                  prompt={transcriptionPrompt}
                  onSelect={() => {}}
                  isSelected={true}
                  audioSrc={audioFileUrl || undefined}
                  isLoading={false}
                />
              ) : (
                <div className="border rounded-lg p-6 text-center bg-muted/30">
                  <p className="text-muted-foreground">
                    Select a completed transcription job to preview
                  </p>
                </div>
              )}
              
              <Separator />
              
              <ScrollArea className="h-[500px] rounded-md border">
                <div className="p-4">
                  <LogsPanel />
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
