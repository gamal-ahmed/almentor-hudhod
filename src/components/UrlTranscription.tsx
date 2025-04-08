
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, FileAudio } from "lucide-react";
import { useLogsStore } from '@/lib/useLogsStore';
import { toast } from 'sonner';
import { fetchAudioFromUrl, createTranscriptionJob } from '@/lib/api';
import { TranscriptionModel } from '@/components/ModelSelector';
import ModelSelector from '@/components/ModelSelector';

interface UrlTranscriptionProps {
  prompt: string;
  isProcessing: boolean;
  setIsProcessing: (isProcessing: boolean) => void;
  onTranscriptionsCreated: (jobIdsArray: string[]) => void;
  onStepComplete: () => void;
}

const UrlTranscription: React.FC<UrlTranscriptionProps> = ({ 
  prompt, 
  isProcessing, 
  setIsProcessing,
  onTranscriptionsCreated,
  onStepComplete 
}) => {
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedModels, setSelectedModels] = useState<TranscriptionModel[]>(['openai']);
  const { addLog, startTimedLog } = useLogsStore();
  
  const handleModelsChange = (models: TranscriptionModel[]) => {
    setSelectedModels(models);
    if (models.length > 0) {
      setError(null);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!audioUrl.trim()) {
      setError('Please enter an audio URL');
      return;
    }
    
    if (selectedModels.length === 0) {
      setError('Please select at least one transcription model');
      return;
    }
    
    try {
      setIsProcessing(true);
      const timedLogOperation = startTimedLog(`Fetching audio from URL: ${audioUrl}`, "info");
      
      addLog(`Fetching audio from URL: ${audioUrl}`, "info", {
        source: "UrlTranscription",
      });
      
      // Fetch the audio file from the URL
      const audioFile = await fetchAudioFromUrl(audioUrl);
      
      addLog(`Successfully downloaded audio: ${audioFile.name}`, "success", {
        source: "UrlTranscription",
        details: `Size: ${audioFile.size} bytes, Type: ${audioFile.type}`
      });
      
      timedLogOperation.complete("Audio download complete", `Size: ${audioFile.size} bytes`);
      
      // Start transcription process with the downloaded file
      const jobPromises = selectedModels.map(model => 
        createTranscriptionJob(audioFile, model, prompt)
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
        
        onTranscriptionsCreated(jobIds);
        onStepComplete();
      } else {
        toast.error("Transcription failed", {
          description: "Failed to create any transcription jobs"
        });
        
        setError("Failed to create any transcription jobs");
      }
    } catch (error) {
      console.error("Error processing URL:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      
      toast.error("Audio download failed", {
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
      
      const timedLogOperation = startTimedLog(`Error downloading audio`, "error");
      timedLogOperation.error(`${error.message}`, error.stack);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Card className="w-full shadow-md border-primary/10">
      <CardHeader>
        <CardTitle className="text-lg">Transcribe from URL</CardTitle>
        <CardDescription>
          Enter an audio URL from Dropbox, Google Drive, YouTube, Facebook, or Twitter
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="url"
              placeholder="https://example.com/audio.mp3"
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              disabled={isProcessing}
              className="w-full"
              required
            />
            
            <p className="text-xs text-muted-foreground">
              Supports direct links to MP3, WAV, and M4A files from Dropbox, Google Drive, and other services
            </p>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Transcription Models</label>
            <ModelSelector
              selectedModels={selectedModels}
              onModelChange={handleModelsChange}
              disabled={isProcessing}
            />
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Button
            type="submit"
            variant="default"
            className="w-full"
            disabled={!audioUrl.trim() || isProcessing || selectedModels.length === 0}
          >
            {isProcessing ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>Transcribe from URL</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UrlTranscription;
