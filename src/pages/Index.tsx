import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "@/components/Header";
import FileUpload from "@/components/FileUpload";
import ModelSelector from "@/components/ModelSelector";
import TranscriptionJobs from "@/components/TranscriptionJobs";
import { TranscriptionModel } from "@/components/ModelSelector";
import { useLogsStore } from "@/lib/useLogsStore";
import { 
  FileAudio, 
  UploadCloud,
  Sliders,
  Sparkles,
  Wand2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
import UploadConfigStep from "@/components/funnel/UploadConfigStep";
import SessionHistory from "@/components/SessionHistory";

const Index = () => {
  const navigate = useNavigate();
  const [selectedTranscription, setSelectedTranscription] = useState<string | null>(null);
  const [selectedTranscriptionModel, setSelectedTranscriptionModel] = useState<string | null>(null);
  const [audioFileUrl, setAudioFileUrl] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeJobIds, setActiveJobIds] = useState<string[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // Handle direct file upload and store the session ID
  const handleTranscriptionsCreated = (jobIdsArray: string[], sessionId?: string) => {
    setActiveJobIds(jobIdsArray);
    if (sessionId) {
      setCurrentSessionId(sessionId);
      
      // Redirect to session details page
      toast.success("Redirecting to session details...", {
        description: "You'll be able to see the progress of your transcription"
      });
      
      // Short delay to allow toast to be seen
      setTimeout(() => {
        navigate(`/session/${sessionId}`);
      }, 1000);
    }
    setRefreshTrigger(prev => prev + 1);
    toast.success("Transcription started", {
      description: `Processing ${jobIdsArray.length} transcription jobs`
    });
  };
  
  const handleTranscriptionSelect = (vtt: string, model: string) => {
    setSelectedTranscription(vtt);
    setSelectedTranscriptionModel(model);
    
    toast.success("Transcription selected", {
      description: `Viewing transcription from ${model}`
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Header />
      
      <main className="flex-1 container max-w-7xl py-8 px-4">
        <div className="flex flex-col gap-6">
          <div className="text-center mb-6 pt-4 pb-2 animate-fade-in">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Wand2 className="h-3.5 w-3.5" />
              <span>AI-Powered Audio Transcription</span>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">
              Audio Transcription Studio
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Convert speech to text with our state-of-the-art AI models
            </p>
          </div>
          
          <Tabs defaultValue="transcribe" className="w-full animate-slide-up">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8 p-1 shadow-soft">
              <TabsTrigger value="transcribe" className="text-base py-3 data-[state=active]:shadow-soft">
                <FileAudio className="mr-2 h-4 w-4" />
                Transcribe Audio
              </TabsTrigger>
              <TabsTrigger value="history" className="text-base py-3 data-[state=active]:shadow-soft">
                <Clock className="mr-2 h-4 w-4" />
                Previous Sessions
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="transcribe" className="mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 space-y-6">
                  <UploadConfigStep
                    onTranscriptionsCreated={(jobIdsArray, sessionId) => handleTranscriptionsCreated(jobIdsArray, sessionId)}
                    onStepComplete={() => {
                      // This is now handled immediately on file upload
                    }}
                  />
                </div>
                
                <div className="lg:col-span-7 space-y-6">
                  <TranscriptionJobs
                    onSelectTranscription={handleTranscriptionSelect}
                    refreshTrigger={refreshTrigger}
                    sessionId={currentSessionId}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="mt-0">
              <div className="grid grid-cols-1 gap-8">
                <SessionHistory />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Index;
