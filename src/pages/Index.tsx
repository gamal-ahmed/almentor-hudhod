
import React, { useState, useEffect } from 'react';
import Header from "@/components/Header";
import FileUpload from "@/components/FileUpload";
import ModelSelector from "@/components/ModelSelector";
import FileQueue from "@/components/FileQueue";
import PromptOptions from "@/components/PromptOptions";
import TranscriptionJobs from "@/components/TranscriptionJobs";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TranscriptionModel } from "@/components/ModelSelector";
import { useLogsStore } from "@/lib/useLogsStore";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Settings, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [selectedModels, setSelectedModels] = useState<TranscriptionModel[]>([]);
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
  };
  
  const handleFileUpload = (files: File | File[]) => {
    const fileArray = Array.isArray(files) ? files : [files];
    setQueuedFiles(prevFiles => [...prevFiles, ...fileArray]);
  };
  
  const handleRemoveFile = (index: number) => {
    setQueuedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };
  
  const handleProcessNext = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setCurrentFileIndex(prev => prev + 1);
      setRefreshTrigger(prev => prev + 1);
    }, 2000);
  };
  
  const handleSkip = () => {
    setCurrentFileIndex(prev => prev + 1);
  };
  
  const handleReset = () => {
    setQueuedFiles([]);
    setCurrentFileIndex(0);
  };
  
  const handleTranscriptionSelect = (vtt: string, model: string) => {
    setSelectedTranscription(vtt);
    setSelectedTranscriptionModel(model);
    
    const audioFile = queuedFiles[0];
    if (audioFile) {
      const url = URL.createObjectURL(audioFile);
      setAudioFileUrl(url);
    }
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
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-muted/50">
      <Header />
      
      <main className="flex-1 container py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Side - Input & Control Panel */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            <Card className="overflow-hidden border-none shadow-md bg-card">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent pb-3">
                <CardTitle className="flex items-center text-xl">
                  <FileText className="mr-2 h-5 w-5 text-primary" />
                  New Transcription
                </CardTitle>
                <CardDescription>
                  Upload audio files and configure transcription options
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-5 space-y-5">
                {/* File Upload */}
                <FileUpload 
                  onFileUpload={handleFileUpload}
                  isUploading={processing}
                />
                
                {/* Model Selector */}
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <h3 className="font-medium text-sm flex items-center">
                    <Check className="mr-2 h-4 w-4 text-primary" />
                    Select Transcription Models
                  </h3>
                  <ModelSelector 
                    selectedModels={selectedModels}
                    onModelChange={handleModelChange}
                    disabled={processing}
                  />
                </div>
                
                {/* Advanced Options */}
                <Collapsible 
                  open={showAdvancedOptions}
                  onOpenChange={setShowAdvancedOptions}
                  className="border rounded-lg"
                >
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full flex items-center justify-between p-3 h-auto"
                    >
                      <div className="flex items-center">
                        <Settings className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Advanced Options</span>
                      </div>
                      {showAdvancedOptions ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-4 pt-0 border-t">
                    <PromptOptions 
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
                
                {/* File Queue */}
                <FileQueue 
                  files={queuedFiles}
                  currentIndex={currentFileIndex}
                  onProcessNext={handleProcessNext}
                  onSkip={handleSkip}
                  onReset={handleReset}
                  isProcessing={processing}
                  notificationsEnabled={notificationsEnabled}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Right Side - Results Panel */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Transcription Jobs */}
            <Card className="border-none shadow-md">
              <CardHeader className="bg-gradient-to-r from-green-500/10 to-transparent pb-3">
                <CardTitle className="text-lg">Transcription Jobs</CardTitle>
                <CardDescription>
                  View and select completed transcriptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TranscriptionJobs 
                  onSelectTranscription={handleTranscriptionSelect}
                  refreshTrigger={refreshTrigger}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
