import React, { useState, useEffect } from 'react';
import { TranscriptionModel } from "@/components/ModelSelector";
import ModelSelector from "@/components/ModelSelector";
import { useLogsStore } from "@/lib/useLogsStore";
import { FileAudio, UploadCloud, Sliders, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  createTranscriptionJob
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
  const [userId, setUserId] = useState<string | null>(null);
  
  // Get the current user's ID when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUserId(session?.user?.id || null);
    };
    
    checkAuth();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    setSelectedFile(file || null);
  };
  
  const handleModelsChange = (models: TranscriptionModel[]) => {
    setSelectedModels(models);
    if (models.length > 0) {
      setError(null);
    }
  };
  
  const handleUploadTranscription = async (file: File) => {
    if (!file) return;
    
    if (selectedModels.length === 0) {
      setError("Please select at least one transcription model");
      return;
    }

    try {
      setIsProcessing(true);
      addLog(`Processing file: ${file.name}`, "info", { source: "UploadConfigStep" });

      // Create session ID and start server-side transcription
      const sessionId = crypto.randomUUID();
      
      // Get current auth session
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id || "00000000-0000-0000-0000-000000000000"; // Anonymous fallback
      
      // Create a transcription session
      const { data: sessionData, error: sessionError } = await supabase
        .from('transcription_sessions')
        .insert({
          id: sessionId,
          selected_models: selectedModels,
          audio_file_name: file.name,
          user_id: currentUserId
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
          <Label htmlFor="model-select">Transcription Models</Label>
          <div className="mt-1">
            <ModelSelector 
              selectedModels={selectedModels}
              onModelChange={handleModelsChange}
              disabled={isProcessing}
            />
            {selectedModels.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                Please select at least one transcription model
              </p>
            )}
          </div>
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
          disabled={!selectedFile || isProcessing || selectedModels.length === 0}
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
