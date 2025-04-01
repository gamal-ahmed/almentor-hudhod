import React, { useState, useRef, useEffect } from 'react';
import { TranscriptionModel } from '@/components/ModelSelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Upload, FileAudio, Pause, Play, Link } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import ModelSelector from '@/components/ModelSelector';
import PromptOptions from '@/components/PromptOptions';
import UrlTranscription from '@/components/UrlTranscription';
import { createTranscriptionJob } from '@/lib/api';
import { toast } from 'sonner';
import { useLogsStore } from '@/lib/useLogsStore';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/AuthContext';

interface UploadConfigStepProps {
  onTranscriptionsCreated: (jobIdsArray: string[], sessionId?: string) => void;
  onStepComplete: () => void;
}

const UploadConfigStep: React.FC<UploadConfigStepProps> = ({ onTranscriptionsCreated, onStepComplete }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModels, setSelectedModels] = useState<TranscriptionModel[]>(['openai', 'gemini-2.0-flash', 'phi4']);
  const [prompt, setPrompt] = useState("Please preserve all English words exactly as spoken");
  const [uploadTab, setUploadTab] = useState('direct');
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [preserveEnglish, setPreserveEnglish] = useState(true);
  const [outputFormat, setOutputFormat] = useState<"vtt" | "plain">("vtt");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { addLog, startTimedLog } = useLogsStore();
  const { user } = useAuth();

  const handleFileUpload = async (file: File) => {
    console.log("File uploaded in UploadConfigStep:", file.name);
    setUploadedFile(file);
    addLog(`File uploaded: ${file.name}`, "info", {
      source: "FileUpload",
      details: `Type: ${file.type}`
    });
    
    // Automatically start transcription after file upload
    await startTranscription(file);
  };
  
  const toggleAudioPlayback = () => {
    if (!audioRef.current) return;
    
    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => {
          setIsAudioPlaying(true);
        })
        .catch(error => {
          console.error("Error playing audio:", error);
          setIsAudioPlaying(false);
        });
    }
  };
  
  const handleAudioEnded = () => {
    setIsAudioPlaying(false);
  };

  useEffect(() => {
    let newPrompt = "";
    
    if (preserveEnglish) {
      newPrompt += "Please preserve all English words exactly as spoken. ";
    }
    
    if (outputFormat === "vtt") {
      newPrompt += "Generate output with timestamps in VTT format.";
    } else {
      newPrompt += "Generate output as plain text without timestamps.";
    }
    
    setPrompt(newPrompt.trim());
  }, [preserveEnglish, outputFormat]);
  
  // Create a session in Supabase and return the session ID
  const createTranscriptionSession = async (fileName: string) => {
    try {
      if (!user) {
        throw new Error("User must be logged in to create a transcription session");
      }
      
      const { data, error } = await supabase
        .from('transcription_sessions')
        .insert({
          audio_file_name: fileName,
          selected_models: selectedModels,
          user_id: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      addLog(`Created transcription session: ${data.id}`, "success", {
        source: "UploadConfigStep",
        details: `File: ${fileName}, Models: ${selectedModels.join(', ')}`
      });
      
      return data.id;
    } catch (error) {
      console.error("Error creating transcription session:", error);
      addLog(`Failed to create transcription session: ${error.message}`, "error", {
        source: "UploadConfigStep",
        details: error.stack
      });
      throw error;
    }
  };
  
  const startTranscription = async (fileToProcess = uploadedFile) => {
    if (!fileToProcess) {
      toast.error("No file selected", {
        description: "Please upload an audio file before starting transcription"
      });
      return;
    }
    
    if (selectedModels.length === 0) {
      toast.error("No transcription models selected", {
        description: "Please select at least one transcription model"
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      
      const timedLogOperation = startTimedLog(`Starting transcription for ${fileToProcess.name}`, "info");
      
      console.log("Starting transcription with file:", {
        name: fileToProcess.name,
        size: fileToProcess.size,
        type: fileToProcess.type,
        lastModified: fileToProcess.lastModified
      });
      
      // Create a session for this transcription batch
      const sessionId = await createTranscriptionSession(fileToProcess.name);
      
      // Create transcription jobs for each selected model
      const jobPromises = selectedModels.map(model => 
        createTranscriptionJob(fileToProcess, model, prompt, sessionId)
          .catch(error => {
            console.error(`Error creating job for model ${model}:`, error);
            addLog(`Failed to create ${model} transcription job: ${error.message}`, "error", {
              source: model,
              details: error.stack
            });
            return { jobId: null, error: error.message };
          })
      );
      
      const results = await Promise.all(jobPromises);
      
      // Filter out failed jobs
      const successfulJobs = results.filter(result => result && result.jobId);
      const jobIds = successfulJobs.map(result => result.jobId);
      
      if (jobIds.length > 0) {
        console.log("Transcription jobs created:", jobIds);
        
        toast.success("Transcription jobs created", {
          description: `Started ${jobIds.length} transcription jobs`
        });
        
        timedLogOperation.complete("Transcription jobs created", `Created ${jobIds.length} jobs`);
        
        // Pass both jobIds and sessionId to the parent component
        onTranscriptionsCreated(jobIds, sessionId);
        onStepComplete();
      } else {
        toast.error("Transcription failed", {
          description: "Failed to create any transcription jobs"
        });
        
        timedLogOperation.error("Failed to create any transcription jobs", "All job creation attempts failed");
      }
      
    } catch (error) {
      console.error("Error starting transcription:", error);
      
      toast.error("Transcription failed", {
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
      
      const timedLogOperation = startTimedLog(`Error in transcription`, "error");
      timedLogOperation.error(`${error.message}`, error.stack);
      
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full shadow-md border-primary/10">
      <CardHeader>
        <CardTitle className="text-2xl">Upload & Configure</CardTitle>
        <CardDescription>
          Upload your audio file and configure transcription options
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs defaultValue={uploadTab} onValueChange={setUploadTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="direct" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span>Direct Upload</span>
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              <span>URL</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="direct" className="space-y-4">
            <FileUpload 
              onFileUpload={handleFileUpload} 
              isUploading={isProcessing}
            />
          </TabsContent>
          
          <TabsContent value="url" className="space-y-4">
            <UrlTranscription
              selectedModels={selectedModels}
              prompt={prompt}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
              onTranscriptionsCreated={onTranscriptionsCreated}
              onStepComplete={onStepComplete}
            />
          </TabsContent>
        </Tabs>
        
        {uploadedFile && uploadTab === 'direct' && (
          <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <FileAudio className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{uploadedFile.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={toggleAudioPlayback}
              >
                {isAudioPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <audio
              ref={audioRef}
              src={URL.createObjectURL(uploadedFile)}
              className="w-full"
              controls={false}
              onEnded={handleAudioEnded}
            />
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Transcription Models</h3>
            <ModelSelector 
              selectedModels={selectedModels} 
              onModelChange={setSelectedModels} 
              disabled={isProcessing}
            />
            
            {selectedModels.length === 0 && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please select at least one transcription model
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Transcription Prompt</h3>
            <PromptOptions
              preserveEnglish={preserveEnglish}
              onPreserveEnglishChange={setPreserveEnglish}
              outputFormat={outputFormat}
              onOutputFormatChange={setOutputFormat}
              notificationsEnabled={notificationsEnabled}
              onNotificationsChange={setNotificationsEnabled}
              disabled={isProcessing}
            />
          </div>
        </div>
      </CardContent>
      
      {uploadTab === 'direct' && (
        <CardFooter className="flex justify-between border-t p-6">
          <Button
            variant="default"
            className="w-full"
            onClick={() => startTranscription()}
            disabled={!uploadedFile || selectedModels.length === 0 || isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="animate-pulse">Processing...</span>
              </>
            ) : (
              <>Start Transcription</>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default UploadConfigStep;
