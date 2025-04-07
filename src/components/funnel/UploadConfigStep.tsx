import React, { useState, useEffect } from 'react';
import { TranscriptionModel } from "@/components/ModelSelector";
import { useLogsStore } from "@/lib/useLogsStore";
import { FileAudio, UploadCloud, Sliders, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { 
  HoverCard, 
  HoverCardContent, 
  HoverCardTrigger 
} from "@/components/ui/hover-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  createTranscriptionJob, 
  transcribeAudio
} from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";

interface UploadConfigStepProps {
  onTranscriptionsCreated: (jobIdsArray: string[], sessionId?: string) => void;
  onStepComplete: () => void;
}

const UploadConfigStep: React.FC<UploadConfigStepProps> = ({ onTranscriptionsCreated, onStepComplete }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedModels, setSelectedModels] = useState<TranscriptionModel[]>(['openai']);
  const [prompt, setPrompt] = useState("Please preserve all English words exactly as spoken");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addLog } = useLogsStore();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    setSelectedFile(file || null);
  };
  
  const handleModelChange = (model: TranscriptionModel) => {
    setSelectedModels([model]);
  };
  
  const handleUploadTranscription = async (file: File) => {
    if (!file) return;

    try {
      setIsProcessing(true);
      addLog(`Processing file: ${file.name}`, "info", { source: "UploadConfigStep" });

      // Try to use client-side transcription first
      const useClientTranscription = true; // You can toggle this based on user preference

      if (useClientTranscription) {
        try {
          const sessionId = crypto.randomUUID();
          
          // Create a transcription session
          const { data: sessionData, error: sessionError } = await supabase
            .from('transcription_sessions')
            .insert({
              id: sessionId,
              selected_models: selectedModels,
              audio_file_name: file.name,
              user_id: "00000000-0000-0000-0000-000000000000" // Anonymous user ID as fallback
            })
            .select()
            .single();
          
          if (sessionError) throw sessionError;
          
          // Upload the audio file to Supabase storage
          const filePath = `sessions/${sessionId}/${file.name}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('transcriptions')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: true
            });
          
          if (uploadError) throw uploadError;
          
          // Try client-side transcription
          addLog("Attempting client-side transcription...", "info", { source: "UploadConfigStep" });
          
          // Create a job for each selected model
          const jobPromises = selectedModels.map(async (model) => {
            try {
              // Since clientTranscribeAudio is not available, we'll fallback to server-side transcription
              const { jobId } = await createTranscriptionJob(file, model, prompt, sessionId);
              return { jobId };
            } catch (error) {
              // Log the error but continue with other models
              console.error(`Error creating job for model ${model}:`, error);
              addLog(`Failed to create ${model} transcription job: ${error.message}`, "error", {
                source: model,
                details: error.stack
              });
              return { jobId: null, error: error.message };
            }
          });
          
          const results = await Promise.allSettled(jobPromises);
          
          // Extract job IDs from successful results
          const jobIds = results
            .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
            .map(result => result.value.jobId)
            .filter(Boolean);
          
          addLog(`Created ${jobIds.length} transcription jobs`, "success", {
            source: "UploadConfigStep",
            details: `Job IDs: ${jobIds.join(', ')}`
          });
          
          if (jobIds.length > 0) {
            toast.success("Transcription started", {
              description: `Processing ${jobIds.length} transcription jobs`
            });
            
            // Notify parent components
            onTranscriptionsCreated(jobIds, sessionId);
            onStepComplete();
          } else {
            toast.error("Transcription failed", {
              description: "Failed to create any transcription jobs"
            });
          }
        } catch (error) {
          console.error("Error in client-side transcription:", error);
          toast.error("Client-side transcription failed", {
            description: "Falling back to server-side processing..."
          });
          
          // Fall back to regular transcription process
          handleRegularTranscription(file);
        }
      } else {
        // Use regular server-side transcription
        handleRegularTranscription(file);
      }
    } catch (error) {
      console.error("Error processing file:", error);
      addLog(`Error processing file: ${error instanceof Error ? error.message : String(error)}`, "error", {
        source: "UploadConfigStep",
        details: error instanceof Error ? error.stack : ""
      });
      
      setError(error instanceof Error ? error.message : String(error));
      toast.error("Processing failed", {
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to handle regular server-side transcription
  const handleRegularTranscription = async (file: File) => {
    try {
      setIsProcessing(true);
      addLog(`Processing file: ${file.name}`, "info", { source: "UploadConfigStep" });
      
      const sessionId = crypto.randomUUID();
      
      // Create a transcription session
      const { data: sessionData, error: sessionError } = await supabase
        .from('transcription_sessions')
        .insert({
          id: sessionId,
          selected_models: selectedModels,
          audio_file_name: file.name,
          user_id: "00000000-0000-0000-0000-000000000000" // Anonymous user ID as fallback
        })
        .select()
        .single();
        
      if (sessionError) throw sessionError;
      
      // Upload the audio file to Supabase storage
      const filePath = `sessions/${sessionId}/${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('transcriptions')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) throw uploadError;
      
      // Create a job for each selected model
      const jobsPromises = selectedModels.map(model => 
        createTranscriptionJob(file, model, prompt, sessionId)
          .catch(error => {
            console.error(`Error creating job for model ${model}:`, error);
            addLog(`Failed to create ${model} transcription job: ${error.message}`, "error", {
              source: model,
              details: error.stack
            });
            return { jobId: null, error: error.message };
          })
      );
      
      const results = await Promise.all(jobsPromises);
      
      // Filter out failed jobs
      const successfulJobs = results.filter(result => result && result.jobId);
      const jobIds = successfulJobs.map(result => result.jobId);
      
      if (jobIds.length > 0) {
        console.log("Transcription jobs created:", jobIds);
        
        toast.success("Transcription jobs created", {
          description: `Started ${jobIds.length} transcription jobs`
        });
        
        onTranscriptionsCreated(jobIds, sessionId);
        onStepComplete();
      } else {
        toast.error("Transcription failed", {
          description: "Failed to create any transcription jobs"
        });
        
        setError("Failed to create any transcription jobs");
      }
    } catch (error) {
      console.error("Error processing file:", error);
      addLog(`Error processing file: ${error instanceof Error ? error.message : String(error)}`, "error", {
        source: "UploadConfigStep",
        details: error instanceof Error ? error.stack : ""
      });
      
      setError(error instanceof Error ? error.message : String(error));
      toast.error("Processing failed", {
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Card className="w-full shadow-md border-primary/10">
      <CardHeader>
        <CardTitle className="text-lg">Upload Audio File</CardTitle>
        <CardDescription>
          Select an audio file to transcribe using AI
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="audio-file">Audio File</Label>
          <Input
            type="file"
            id="audio-file"
            accept="audio/*"
            onChange={handleFileChange}
            disabled={isProcessing}
            className="w-full"
          />
          {selectedFile && (
            <p className="text-xs text-muted-foreground">
              Selected file: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="model-select">Transcription Model</Label>
          <Select onValueChange={(value) => handleModelChange(value as TranscriptionModel)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI Whisper</SelectItem>
              <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
              <SelectItem value="phi4">Phi-4 (Experimental)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="prompt">Transcription Prompt</Label>
          <Textarea
            id="prompt"
            placeholder="Customize the transcription with a prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isProcessing}
            className="w-full"
          />
        </div>
        
        <Button
          variant="default"
          className="w-full"
          onClick={() => selectedFile && handleUploadTranscription(selectedFile)}
          disabled={!selectedFile || isProcessing}
        >
          {isProcessing ? (
            <span className="animate-pulse">Processing...</span>
          ) : (
            <>Transcribe Audio</>
          )}
        </Button>
        
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default UploadConfigStep;
