
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TranscriptionJobs from "@/components/TranscriptionJobs";
import LogsPanel from "@/components/LogsPanel";
import { getUserTranscriptionJobs, saveSelectedTranscription, saveTranscriptionToVTT } from "@/lib/api";
import { useLogsStore } from "@/lib/useLogsStore";
import { PublishCard, PublishDialog, TranscriptionResultsList } from "./components";
import { useTranscriptionPublishing, useTranscriptionExport } from "./hooks";

interface ResultsPublishStepProps {
  selectedTranscription: string | null;
  selectedModel: string | null;
  videoId: string;
  setVideoId: (id: string) => void;
  handleSelectTranscription: (vtt: string, model: string) => void;
  isPublishing: boolean;
  setIsPublishing: (isPublishing: boolean) => void;
  refreshJobsTrigger: number;
  file: File | null;
  audioUrl: string | null;
  goToPreviousStep: () => void;
  selectedModels: string[];
  transcriptions: Record<string, { vtt: string; prompt: string; loading: boolean; }>;
  sessionId?: string;
}

const ResultsPublishStep: React.FC<ResultsPublishStepProps> = ({
  selectedTranscription,
  selectedModel,
  videoId,
  setVideoId,
  handleSelectTranscription,
  setIsPublishing,
  refreshJobsTrigger,
  file,
  audioUrl,
  goToPreviousStep,
  selectedModels,
  transcriptions,
  sessionId,
}) => {
  const { logs, addLog } = useLogsStore();
  const [completedJobs, setCompletedJobs] = useState<any[]>([]);
  const [latestResults, setLatestResults] = useState<Record<string, any>>({
    openai: null,
    "gemini-2.0-flash": null,
    phi4: null
  });
  const [currentJobs, setCurrentJobs] = useState<string[]>([]);
  
  const { 
    publishDialogOpen, 
    setPublishDialogOpen, 
    isPublishing,
    publishCaption 
  } = useTranscriptionPublishing(sessionId);
  
  const {
    exportFormat,
    setExportFormat,
    exportTranscription
  } = useTranscriptionExport();

  // Fetch completed jobs
  useEffect(() => {
    const fetchCompletedJobs = async () => {
      try {
        const jobs = await getUserTranscriptionJobs();
        
        const completed = jobs.filter(job => job.status === 'completed');
        setCompletedJobs(completed);
        
        const ongoing = jobs.filter(job => job.status === 'pending' || job.status === 'processing');
        setCurrentJobs(ongoing.map(job => job.model));
        
        const latestForSelectedModels: Record<string, any> = {
          openai: null,
          "gemini-2.0-flash": null,
          phi4: null
        };
        
        const sortedJobs = [...completed].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        for (const job of sortedJobs) {
          if (selectedModels.includes(job.model) && !latestForSelectedModels[job.model] && job.result) {
            latestForSelectedModels[job.model] = job;
          }
        }
        
        setLatestResults(latestForSelectedModels);
        
        addLog(`Found latest results for selected models: ${Object.keys(latestForSelectedModels).filter(k => latestForSelectedModels[k]).join(', ')}`, "debug", {
          source: "ResultsPublishStep",
          details: `Selected models: ${selectedModels.join(', ')}, Total completed jobs: ${completed.length}`
        });
      } catch (error) {
        console.error("Error fetching completed jobs:", error);
      }
    };

    fetchCompletedJobs();
  }, [refreshJobsTrigger, addLog, selectedModels]);

  // Save selected transcription to the session
  useEffect(() => {
    const saveSelectedVtt = async () => {
      if (selectedTranscription && selectedModel && sessionId) {
        try {
          const fileName = `transcription_${selectedModel}_${new Date().toISOString().slice(0, 10)}.vtt`;
          await saveSelectedTranscription(sessionId, selectedTranscription, fileName, selectedModel);
          
          await saveTranscriptionToVTT(sessionId, selectedTranscription, fileName);
          
          addLog(`Saved selected transcription (${selectedModel}) to session`, "info", {
            source: "ResultsPublishStep",
            details: `Session ID: ${sessionId}`
          });
        } catch (error) {
          console.error("Error saving selected transcription:", error);
          addLog(`Error saving selected transcription`, "error", {
            details: error instanceof Error ? error.message : String(error),
            source: "ResultsPublishStep"
          });
        }
      }
    };
    
    saveSelectedVtt();
  }, [selectedTranscription, selectedModel, sessionId, addLog]);

  const handlePublishDialogOpen = () => {
    setPublishDialogOpen(true);
  };

  const handlePublish = () => {
    publishCaption(videoId, selectedTranscription, selectedModel, latestResults);
  };

  const handleExport = () => {
    exportTranscription(selectedTranscription, selectedModel);
  };

  const extractVttContent = (job: any) => {
    if (!job || !job.result) return "";
    
    try {
      if (typeof job.result === 'string') {
        try {
          const parsedResult = JSON.parse(job.result);
          return parsedResult.vttContent || "";
        } catch {
          return "";
        }
      } else if (typeof job.result === 'object') {
        return job.result.vttContent || "";
      }
    } catch (error) {
      console.error("Error extracting VTT content:", error);
      return "";
    }
    
    return "";
  };

  const handleSelectModel = (model: string, vttContent: string) => {
    if (vttContent) {
      handleSelectTranscription(vttContent, model);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousStep}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Upload
        </Button>
        
        {file && (
          <div className="text-sm bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full flex items-center">
            <span className="font-medium mr-1">Current file:</span>
            <span className="truncate max-w-[200px]">{file.name}</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <PublishCard
            selectedTranscription={selectedTranscription}
            selectedModel={selectedModel}
            videoId={videoId}
            setVideoId={setVideoId}
            isPublishing={isPublishing}
            onPublishClick={handlePublishDialogOpen}
            exportFormat={exportFormat}
            setExportFormat={setExportFormat}
            onExportClick={handleExport}
          />
        </div>
        
        <div className="md:col-span-3">
          <Tabs defaultValue="results" className="w-full">
            <TabsList className="mb-2">
              <TabsTrigger value="jobs">Background Jobs</TabsTrigger>
              <TabsTrigger value="results">Direct Results</TabsTrigger>
              <TabsTrigger value="logs">System Logs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="jobs" className="space-y-3">
              <TranscriptionJobs 
                onSelectTranscription={handleSelectTranscription}
                refreshTrigger={refreshJobsTrigger}
              />
            </TabsContent>
            
            <TabsContent value="results" className="space-y-3">
              <h2 className="text-xl font-semibold mb-4">Transcription Results</h2>
              <TranscriptionResultsList
                selectedModels={selectedModels}
                currentJobs={currentJobs}
                latestResults={latestResults}
                selectedModel={selectedModel}
                audioUrl={audioUrl}
                extractVttContent={extractVttContent}
                onSelectModel={handleSelectModel}
              />
            </TabsContent>
            
            <TabsContent value="logs" className="space-y-3">
              <h2 className="text-xl font-semibold mb-4">System Logs</h2>
              <div className="h-[400px]">
                <LogsPanel logs={logs} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <PublishDialog
        open={publishDialogOpen}
        setOpen={setPublishDialogOpen}
        videoId={videoId}
        selectedModel={selectedModel}
        selectedTranscription={selectedTranscription}
        isPublishing={isPublishing}
        onPublish={handlePublish}
      />
    </div>
  );
};

export default ResultsPublishStep;
