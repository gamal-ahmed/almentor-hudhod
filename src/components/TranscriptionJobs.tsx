import React, { useEffect, useState } from 'react';
import { getUserTranscriptionJobs, checkTranscriptionJobStatus } from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle, CheckCircle, Clock, RotateCcw } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { TranscriptionModel } from './ModelSelector';

interface TranscriptionJob {
  id: string;
  status: string;
  model: string;
  created_at: string;
  updated_at: string;
  status_message: string;
  error?: string;
  result?: { vttContent: string; text: string; prompt: string };
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
  const { toast } = useToast();
  
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const jobsData = await getUserTranscriptionJobs();
      setJobs(jobsData as TranscriptionJob[]);
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
                updatedJobs[i] = updatedJob as TranscriptionJob;
                hasChanges = true;
                
                if (updatedJob.status === 'completed' && job.status !== 'completed') {
                  toast({
                    title: "Transcription completed",
                    description: `${getModelDisplayName(updatedJob.model)} transcription is now ready.`,
                  });
                } else if (updatedJob.status === 'failed' && job.status !== 'failed') {
                  toast({
                    title: "Transcription failed",
                    description: updatedJob.error || "An unknown error occurred",
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
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'failed':
        return 'text-red-500';
      case 'processing':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const handleSelectTranscription = (job: TranscriptionJob) => {
    if (job.status === 'completed' && job.result?.vttContent && onSelectTranscription) {
      onSelectTranscription(job.result.vttContent, job.model);
    }
  };
  
  if (loading && jobs.length === 0) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading transcription jobs...</span>
      </div>
    );
  }
  
  if (jobs.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Transcription Jobs</CardTitle>
          <CardDescription>
            You haven't created any transcription jobs yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Your Transcription Jobs</h3>
        <div className="flex items-center">
          {polling && (
            <div className="flex items-center mr-3 text-sm text-blue-500">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              <span>Updating...</span>
            </div>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchJobs}
            disabled={loading}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((job) => (
          <Card 
            key={job.id} 
            className={`overflow-hidden border-l-4 ${
              job.status === 'completed' 
                ? 'border-l-green-500' 
                : job.status === 'failed' 
                  ? 'border-l-red-500' 
                  : 'border-l-blue-500'
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base">
                    {getModelDisplayName(job.model)}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Created {formatDistanceToNow(new Date(job.created_at))} ago
                  </CardDescription>
                </div>
                <div className={`flex items-center ${getStatusColor(job.status)}`}>
                  {getStatusIcon(job.status)}
                  <span className="ml-1 text-xs font-medium capitalize">
                    {job.status}
                  </span>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="text-sm pb-3">
              <div className="mb-2">
                <span className="text-muted-foreground text-xs">Status:</span>
                <p className="text-xs">{job.status_message || "No status message"}</p>
              </div>
              
              {job.status === 'processing' && (
                <Progress 
                  className="h-2" 
                  value={70}
                />
              )}
              
              {job.error && (
                <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded">
                  {job.error}
                </div>
              )}
            </CardContent>
            
            <CardFooter className="pt-0 pb-3">
              {job.status === 'completed' && (
                <Button 
                  size="sm" 
                  className="w-full text-xs"
                  onClick={() => handleSelectTranscription(job)}
                >
                  Use this transcription
                </Button>
              )}
              
              {job.status === 'failed' && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => {
                    toast({
                      title: "Retry functionality",
                      description: "Retry feature will be implemented soon",
                    });
                  }}
                >
                  Retry transcription
                </Button>
              )}
              
              {(job.status === 'pending' || job.status === 'processing') && (
                <div className="w-full text-center text-xs text-blue-500">
                  <Loader2 className="h-3 w-3 mr-1 inline-block animate-spin" />
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
