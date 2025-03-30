import React, { useEffect, useState } from 'react';
import { getUserTranscriptionJobs, checkTranscriptionJobStatus } from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle, CheckCircle, Clock, RotateCcw, Play, ChevronDown, ChevronUp } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { Json } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';

// Define a union type for all possible job statuses
type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface TranscriptionJob {
  id: string;
  status: JobStatus;
  model: string;
  created_at: string;
  updated_at: string;
  status_message: string;
  error?: string;
  result?: { 
    vttContent: string; 
    text: string; 
    prompt: string;
  } | Json;
}

interface TranscriptionJobsProps {
  onSelectTranscription?: (vtt: string, model: string) => void;
  refreshTrigger?: number;
}

const TranscriptionJobs: React.FC<TranscriptionJobsProps> = ({ 
  onSelectTranscription,
  refreshTrigger = 0
}) => {
  const [jobs, setJobs] = useState<TranscriptionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const { toast } = useToast();
  
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const jobsData = await getUserTranscriptionJobs();
      setJobs(jobsData as unknown as TranscriptionJob[]);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        title: "Error fetching transcription jobs",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (jobs.some(job => job.status === 'pending' || job.status === 'processing')) {
      setPolling(true);
      
      const intervalId = setInterval(async () => {
        const updatedJobs = [...jobs];
        let hasChanges = false;
        
        for (let i = 0; i < updatedJobs.length; i++) {
          const job = updatedJobs[i];
          
          if (job.status === 'pending' || job.status === 'processing') {
            try {
              const updatedJob = await checkTranscriptionJobStatus(job.id);
              
              if (
                updatedJob.status !== job.status || 
                updatedJob.status_message !== job.status_message
              ) {
                const typedUpdatedJob = {
                  ...updatedJob,
                  status: updatedJob.status as JobStatus
                };
                
                updatedJobs[i] = typedUpdatedJob as unknown as TranscriptionJob;
                hasChanges = true;
                
                if (typedUpdatedJob.status === 'completed' && job.status !== 'completed') {
                  toast({
                    title: "Transcription completed",
                    description: `${getModelDisplayName(typedUpdatedJob.model)} transcription is now ready.`,
                  });
                } else if (typedUpdatedJob.status === 'failed' && job.status !== 'failed') {
                  toast({
                    title: "Transcription failed",
                    description: typedUpdatedJob.error || "An unknown error occurred",
                    variant: "destructive",
                  });
                }
              }
            } catch (error) {
              console.error(`Error polling job ${job.id}:`, error);
            }
          }
        }
        
        if (hasChanges) {
          setJobs(updatedJobs);
        }
        
        if (!updatedJobs.some(job => job.status === 'pending' || job.status === 'processing')) {
          setPolling(false);
          clearInterval(intervalId);
        }
      }, 5000);
      
      return () => clearInterval(intervalId);
    } else {
      setPolling(false);
    }
  }, [jobs, toast]);
  
  useEffect(() => {
    fetchJobs();
  }, [refreshTrigger]);
  
  const getModelDisplayName = (model: string) => {
    switch (model) {
      case "openai":
        return "OpenAI Whisper";
      case "gemini-2.0-flash":
        return "Gemini 2.0 Flash";
      case "phi4":
        return "Microsoft Phi-4";
      default:
        return model;
    }
  };
  
  const getModelIcon = (model: string) => {
    switch (model) {
      case "openai":
        return "🤖";
      case "gemini-2.0-flash":
        return "✨";
      case "phi4":
        return "🔬";
      default:
        return "🎤";
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500 dark:text-green-400';
      case 'failed':
        return 'text-red-500 dark:text-red-400';
      case 'processing':
        return 'text-blue-500 dark:text-blue-400';
      default:
        return 'text-amber-500 dark:text-amber-400';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 dark:text-blue-400 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-amber-500 dark:text-amber-400" />;
    }
  };
  
  const getProgressValue = (status: string) => {
    switch (status) {
      case 'completed':
        return 100;
      case 'failed':
        return 100;
      case 'processing':
        return 65;
      default:
        return 25;
    }
  };
  
  const getBorderColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-l-green-500 dark:border-l-green-400';
      case 'failed':
        return 'border-l-red-500 dark:border-l-red-400';
      case 'processing':
        return 'border-l-blue-500 dark:border-l-blue-400';
      default:
        return 'border-l-amber-500 dark:border-l-amber-400';
    }
  };
  
  const getBackgroundGradient = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-gradient-to-br from-white to-green-50 dark:from-gray-900 dark:to-green-950/20';
      case 'failed':
        return 'bg-gradient-to-br from-white to-red-50 dark:from-gray-900 dark:to-red-950/20';
      case 'processing':
        return 'bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950/20';
      default:
        return 'bg-gradient-to-br from-white to-amber-50 dark:from-gray-900 dark:to-amber-950/20';
    }
  };
  
  const handleSelectTranscription = (job: TranscriptionJob) => {
    if (job.status === 'completed' && job.result && onSelectTranscription) {
      const result = job.result as any;
      if (result.vttContent) {
        onSelectTranscription(result.vttContent, job.model);
        
        toast({
          title: "Transcription selected",
          description: `Using ${getModelDisplayName(job.model)} transcription`,
        });
      }
    }
  };
  
  const toggleExpandJob = (jobId: string) => {
    setExpandedJob(expandedJob === jobId ? null : jobId);
  };
  
  if (loading && jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4 min-h-[200px]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading transcription jobs...</p>
      </div>
    );
  }
  
  if (jobs.length === 0) {
    return (
      <Card className="mt-4 border border-dashed animate-fade-in">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Transcription Jobs</CardTitle>
          <CardDescription className="text-base">
            You haven't created any transcription jobs yet.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No transcription history</h3>
          <p className="text-muted-foreground max-w-sm">
            Upload an audio file and select transcription models to get started.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <span>Your Transcription Jobs</span>
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({jobs.length})
          </span>
        </h3>
        <div className="flex items-center gap-2">
          {polling && (
            <div className="flex items-center gap-1 text-sm text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 py-1 px-2 rounded-md">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Updating...</span>
            </div>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchJobs}
            disabled={loading}
            className="flex items-center gap-1 transition-all hover:bg-secondary"
          >
            <RotateCcw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((job) => (
          <Card 
            key={job.id} 
            className={cn(
              "overflow-hidden border-l-4 shadow-sm transition-all duration-300", 
              getBorderColor(job.status),
              getBackgroundGradient(job.status),
              "hover:shadow-md group"
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-2">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-background shadow-sm">
                    <span className="text-lg" aria-hidden="true">{getModelIcon(job.model)}</span>
                  </div>
                  <div>
                    <CardTitle className="text-base group-hover:text-primary transition-colors">
                      {getModelDisplayName(job.model)}
                    </CardTitle>
                    <CardDescription className="text-xs flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(job.created_at))} ago
                    </CardDescription>
                  </div>
                </div>
                <div className={cn("flex items-center px-2 py-1 rounded-full bg-background/50 backdrop-blur-sm", getStatusColor(job.status))}>
                  {getStatusIcon(job.status)}
                  <span className="ml-1 text-xs font-medium capitalize">
                    {job.status}
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="text-sm pb-3">
              <div className="mb-2">
                <Progress 
                  value={getProgressValue(job.status)}
                  className={cn(
                    "h-1.5 mb-2",
                    job.status === 'completed' ? "bg-green-100 dark:bg-green-950/30" : 
                    job.status === 'failed' ? "bg-red-100 dark:bg-red-950/30" :
                    job.status === 'processing' ? "bg-blue-100 dark:bg-blue-950/30" :
                    "bg-amber-100 dark:bg-amber-950/30"
                  )}
                />
                <div 
                  className="cursor-pointer flex justify-between items-center"
                  onClick={() => toggleExpandJob(job.id)}
                >
                  <span className="text-muted-foreground text-xs font-medium">Status:</span>
                  <Button variant="ghost" size="sm" className="h-6 px-2">
                    {expandedJob === job.id ? 
                      <ChevronUp className="h-4 w-4" /> : 
                      <ChevronDown className="h-4 w-4" />
                    }
                  </Button>
                </div>
                <div className={cn(
                  "transition-all duration-300 overflow-hidden",
                  expandedJob === job.id ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                )}>
                  <p className="text-xs p-2 bg-background/50 rounded-md my-2">
                    {job.status_message || "No detailed status available"}
                  </p>
                  
                  {job.error && (
                    <div className="mt-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/30 p-2 rounded border border-red-200 dark:border-red-800">
                      {job.error}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-0 pb-3">
              {job.status === 'completed' && (
                <Button 
                  size="sm" 
                  className="w-full text-xs group-hover:bg-green-500 transition-colors flex items-center gap-1"
                  onClick={() => handleSelectTranscription(job)}
                >
                  <Play className="h-3 w-3" />
                  Use this transcription
                </Button>
              )}
              
              {job.status === 'failed' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400"
                  onClick={() => {
                    toast({
                      title: "Retry functionality",
                      description: "Retry feature will be implemented soon",
                    });
                  }}
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Retry transcription
                </Button>
              )}
              
              {(job.status === 'pending' || job.status === 'processing') && (
                <div className="w-full text-center text-xs text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 py-2 rounded-md flex items-center justify-center">
                  <Loader2 className="h-3 w-3 mr-2 inline-block animate-spin" />
                  Transcription in progress...
                </div>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TranscriptionJobs;
