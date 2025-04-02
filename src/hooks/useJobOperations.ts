
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { TranscriptionJob } from "@/lib/api/types/transcription";
import { extractVttContent, getModelDisplayName } from "@/utils/transcriptionUtils";

export function useJobOperations(
  sessionId: string | null | undefined,
  selectedModelId: string | null,
  setSelectedModelId: (id: string | null) => void,
  acceptedModelId: string | null,
  setAcceptedModelId: (id: string | null) => void,
  setSelectedJob: (job: TranscriptionJob | null) => void,
  addLog: any
) {
  const { toast } = useToast();

  const handleMarkAsSelected = async (job: TranscriptionJob) => {
    if (!job) return;
    
    try {
      const identifier = sessionId;
      
      if (!identifier) {
        throw new Error("Missing session identifier");
      }
      
      if (selectedModelId === job.id) {
        const { error } = await supabase
          .from('transcription_sessions')
          .update({ 
            accepted_model_id: null,
            selected_model: null 
          })
          .eq('id', identifier);
          
        if (error) throw error;
        
        setSelectedModelId(null);
        
        toast({
          title: "Selection Removed",
          description: `${getModelDisplayName(job.model)} is no longer selected`,
        });
        
        return;
      }
      
      const { error } = await supabase
        .from('transcription_sessions')
        .update({ 
          accepted_model_id: job.id,
          selected_model: job.model 
        })
        .eq('id', identifier);
        
      if (error) throw error;
      
      setSelectedModelId(job.id);
      
      setSelectedJob(job);
      
      toast({
        title: "Model Selected",
        description: `${getModelDisplayName(job.model)} selected as the winning transcription`,
      });
      
      addLog(`Selected ${getModelDisplayName(job.model)} as the winning transcription`, "info", {
        source: "SessionDetails",
        details: `Session: ${identifier}, Job ID: ${job.id}`
      });
    } catch (error) {
      console.error("Error selecting model:", error);
      
      toast({
        title: "Selection Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsAccepted = async (job: TranscriptionJob) => {
    if (!job) return;
    
    try {
      const identifier = sessionId;
      
      if (!identifier) {
        throw new Error("Missing session identifier");
      }
      
      if (acceptedModelId === job.id) {
        const { error } = await supabase
          .from('transcription_sessions')
          .update({ 
            accepted_model_id: null
          })
          .eq('id', identifier);
          
        if (error) throw error;
        
        setAcceptedModelId(null);
        
        toast({
          title: "Acceptance Removed",
          description: `${getModelDisplayName(job.model)} is no longer accepted`,
        });
        
        return;
      }
      
      try {
        const vttContent = extractVttContent(job);
        
        if (!vttContent) {
          throw new Error("No content to save");
        }
        
        const fileName = `transcription_${job.model}_${new Date().toISOString().slice(0, 10)}_${uuidv4()}.vtt`;
        
        const blob = new Blob([vttContent], { type: 'text/vtt' });
        
        const uploadPath = `sessions/${identifier}/${fileName}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('transcriptions')
          .upload(uploadPath, blob, {
            contentType: 'text/vtt',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('transcriptions')
          .getPublicUrl(uploadPath);

        if (!publicUrlData) throw new Error("Failed to get public URL");

        const { error } = await supabase
          .from('transcription_sessions')
          .update({ 
            accepted_model_id: job.id,
            selected_transcription_url: publicUrlData.publicUrl,
            selected_transcription: vttContent,
            selected_model: job.model
          })
          .eq('id', identifier);
          
        if (error) throw error;
        
        setAcceptedModelId(job.id);
        setSelectedJob(job);
        
        addLog(`Accepted ${getModelDisplayName(job.model)} transcription and saved to storage`, "success", {
          source: "SessionDetails",
          details: `Session: ${identifier}, Job ID: ${job.id}, URL: ${publicUrlData.publicUrl}`
        });
        
        toast({
          title: "Transcription Accepted",
          description: `${getModelDisplayName(job.model)} has been accepted and saved to storage`,
          variant: "default"
        });
      } catch (error) {
        console.error("Error accepting transcription:", error);
        
        toast({
          title: "Acceptance Failed",
          description: error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error selecting model:", error);
      
      toast({
        title: "Selection Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  const saveSelectedTranscriptionToStorage = async (job: TranscriptionJob) => {
    try {
      const vttContent = extractVttContent(job);
      
      if (!vttContent) {
        toast({
          title: "No transcription content",
          description: "No content to save",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Saving transcription",
        description: "Please wait while we save your transcription...",
      });
      
      const fileName = `transcription_${job.model}_${new Date().toISOString().slice(0, 10)}_${uuidv4()}.vtt`;
      
      const blob = new Blob([vttContent], { type: 'text/vtt' });
      
      const sessionIdentifier = sessionId;
      if (!sessionIdentifier) {
        throw new Error("No session identifier available");
      }
      
      const uploadPath = `sessions/${sessionIdentifier}/${fileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('transcriptions')
        .upload(uploadPath, blob, {
          contentType: 'text/vtt',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('transcriptions')
        .getPublicUrl(uploadPath);

      if (!publicUrlData) throw new Error("Failed to get public URL");

      const { error: sessionUpdateError } = await supabase
        .from('transcription_sessions')
        .update({ 
          selected_transcription_url: publicUrlData.publicUrl,
          selected_transcription: vttContent,
          selected_model: job.model
        } as any)
        .eq('id', sessionIdentifier);

      if (sessionUpdateError) throw sessionUpdateError;

      addLog(`Saved transcription to storage: ${fileName}`, "success", {
        source: "SessionDetails",
        details: `Model: ${getModelDisplayName(job.model)}, URL: ${publicUrlData.publicUrl}`
      });

      toast({
        title: "Transcription Saved",
        description: "The selected transcription has been saved to storage.",
        variant: "default"
      });

    } catch (error) {
      console.error("Error saving transcription:", error);
      
      addLog(`Error saving transcription: ${error instanceof Error ? error.message : "Unknown error"}`, "error", {
        source: "SessionDetails",
        details: error instanceof Error && error.stack ? error.stack : ''
      });
      
      toast({
        title: "Save Failed",
        description: "Could not save the transcription: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive"
      });
    }
  };

  return {
    handleMarkAsSelected,
    handleMarkAsAccepted,
    saveSelectedTranscriptionToStorage
  };
}
