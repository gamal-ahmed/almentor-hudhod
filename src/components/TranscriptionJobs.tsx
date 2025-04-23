import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserTranscriptionJobs, checkTranscriptionJobStatus, createTranscriptionJob } from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, CheckCircle, Clock, Play, ChevronDown, ChevronUp, Folder, FileText, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { Json } from '@/integrations/supabase/types';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface TranscriptionJob {
  id: string;
  status: JobStatus;
  model: string;
  created_at: string;
  updated_at: string;
  status_message: string;
  error?: string;
  session_id?: string;
  file_path: string;
  prompt_text?: string;
  result?: { 
    vttContent: string; 
    text: string; 
    prompt: string;
  } | Json;
}

interface JobGroup {
  timestamp: Date;
  jobs: TranscriptionJob[];
  session_id?: string;
}

interface TranscriptionJobsProps {
  onSelectTranscription?: (vtt: string, model: string) => void;
  refreshTrigger?: number;
  sessionId?: string | null;
}

const TranscriptionJobs: React.FC<TranscriptionJobsProps> = ({ 
  onSelectTranscription,
  refreshTrigger = 0,
  sessionId,
}) => {
  const [jobs, setJobs] = useState<TranscriptionJob[]>([]);
  const [jobGroups, setJobGroups] = useState<JobGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const { toast } = useToast();
  const [isRetrying, setIsRetrying] = useState<Record<string, boolean>>({});
  
  const groupJobsBySession = (jobs: TranscriptionJob[]) => {
    if (!jobs.length) return [];
    
    const sortedJobs = [...jobs].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    const groups: JobGroup[] = [];
    let currentGroup: JobGroup | null = null;
    
    sortedJobs.forEach(job => {
      const jobTime = new Date(job.created_at);
      
      if (!currentGroup || 
          Math.abs(jobTime.getTime() - currentGroup.timestamp.getTime()) > 30000 ||
          job.session_id !== currentGroup.session_id) {
        currentGroup = {
          timestamp: jobTime,
          jobs: [job],
          session_id: job.session_id
        };
        groups.push(currentGroup);
      } else {
        currentGroup.jobs.push(job);
      }
    });
    
    return groups;
  };
  
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const jobsData = await getUserTranscriptionJobs();
      
      const typedJobs = jobsData as unknown as TranscriptionJob[];
      setJobs(typedJobs);
      
      const groups = groupJobsBySession(typedJobs);
      setJobGroups(groups);
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
                
                const currentJobStatus = job.status as string;
                const updatedJobStatus = typedUpdatedJob.status as string;
                
                if (updatedJobStatus === 'completed' && currentJobStatus !== 'completed') {
                  toast({
                    title: "Transcription completed",
                    description: `${getModelDisplayName(typedUpdatedJob.model)} transcription is now ready.`,
                  });
                } else if (updatedJobStatus === 'failed' && currentJobStatus !== 'failed') {
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
          setJobGroups(groupJobsBySession(updatedJobs));
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
  
  const extractVttContent = (job: TranscriptionJob) => {
    if (!job.result) return "";
    
    try {
      if (typeof job.result === 'string') {
        try {
          const parsedResult = JSON.parse(job.result);
          return parsedResult.vttContent || "";
        } catch {
          return "";
        }
      } else if (typeof job.result === 'object') {
        const result = job.result as any;
        return result.vttContent || "";
      }
    } catch (error) {
      console.error("Error extracting VTT content:", error);
      return "";
    }
    
    return "";
  };
  
  const handleSelectTranscription = (job: TranscriptionJob) => {
    if (job.status === 'completed' && job.result && onSelectTranscription) {
      const vttContent = extractVttContent(job);
      
      if (vttContent) {
        onSelectTranscription(vttContent, job.model);
        
        toast({
          title: "Transcription selected",
          description: `Using ${getModelDisplayName(job.model)} transcription`,
        });
      } else {
        toast({
          title: "Invalid transcription",
          description: "Could not extract VTT content from this job",
          variant: "destructive",
        });
      }
    }
  };
  
  const toggleExpandJob = (jobId: string) => {
    setExpandedJob(expandedJob === jobId ? null : jobId);
  };

  const getGroupStatus = (group: JobGroup) => {
    if (group.jobs.some(job => job.status === 'pending' || job.status === 'processing')) {
      return 'processing';
    }
    if (group.jobs.every(job => job.status === 'completed')) {
      return 'completed';
    }
    if (group.jobs.every(job => job.status === 'failed')) {
      return 'failed';
    }
    return 'mixed';
  };
  
  const getGroupTitle = (group: JobGroup) => {
    const models = [...new Set(group.jobs.map(job => getModelDisplayName(job.model)))];
    const formattedDate = new Date(group.timestamp).toLocaleString();
    return `Session ${formattedDate} (${models.join(', ')})`;
  };

  const handleRetryJob = async (job: TranscriptionJob) => {
    if (!job.file_path) {
      toast({
        title: "Cannot retry transcription",
        description: "Missing file path",
        variant: "destructive",
      });
      return;
    }
    
    setIsRetrying({...isRetrying, [job.id]: true});
    
    try {
      // Get the file from storage
      const fileResponse = await fetch(job.file_path);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch audio file: ${fileResponse.statusText}`);
      }
      
      const fileBlob = await fileResponse.blob();
      const file = new File([fileBlob], `retry-${job.id}.mp3`, { type: 'audio/mpeg' });
      
      // Create a new transcription job with the same model
      console.log(`Retrying ${job.model} transcription for session ${sessionId}`);
      
      const result = await createTranscriptionJob(
        file,
        job.model as any,
        job.prompt_text || "Please preserve all English words exactly as spoken",
        sessionId
      );
      
      toast({
        title: "Transcription job restarted",
        description: `Started new ${job.model} transcription job`,
      });
      
      console.log(`Created new ${job.model} transcription job with ID ${result.jobId}`);
      
      // Refresh the job list
      await fetchJobs();
    } catch (error) {
      console.error("Error retrying transcription job:", error);
      toast({
        title: "Error retrying transcription",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsRetrying({...isRetrying, [job.id]: false});
    }
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
            <Loader2 className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>
      
      <Accordion type="single" collapsible className="space-y-4">
        {jobGroups.map((group, index) => {
          const groupStatus = getGroupStatus(group);
          const sessionIdForLink = group.session_id || group.jobs[0]?.session_id;
          
          return (
            <AccordionItem 
              key={`group-${index}`} 
              value={`group-${index}`}
              className={cn(
                "border rounded-lg overflow-hidden",
                groupStatus === 'completed' ? "border-green-200 dark:border-green-800" :
                groupStatus === 'processing' ? "border-blue-200 dark:border-blue-800" :
                groupStatus === 'failed' ? "border-red-200 dark:border-red-800" :
                "border-amber-200 dark:border-amber-800"
              )}
            >
              <div className="flex justify-between items-center pr-4">
                <AccordionTrigger className="px-4 py-3 hover:no-underline grow">
                  <div className="flex items-center gap-3 w-full">
                    <div className={cn(
                      "p-2 rounded-full",
                      groupStatus === 'completed' ? "bg-green-100 dark:bg-green-900/20" :
                      groupStatus === 'processing' ? "bg-blue-100 dark:bg-blue-900/20" :
                      groupStatus === 'failed' ? "bg-red-100 dark:bg-red-900/20" :
                      "bg-amber-100 dark:bg-amber-900/20"
                    )}>
                      <Folder className={cn(
                        "h-5 w-5",
                        groupStatus === 'completed' ? "text-green-500 dark:text-green-400" :
                        groupStatus === 'processing' ? "text-blue-500 dark:text-blue-400" :
                        groupStatus === 'failed' ? "text-red-500 dark:text-red-400" :
                        "text-amber-500 dark:text-amber-400"
                      )} />
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-sm">
                        {formatDistanceToNow(group.timestamp)} ago
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {group.jobs.length} models: {group.jobs.map(job => getModelDisplayName(job.model)).join(', ')}
                      </p>
                    </div>
                    <div className="ml-auto flex gap-2">
                      {group.jobs.map(job => (
                        <span 
                          key={job.id} 
                          className={cn(
                            "h-2 w-2 rounded-full",
                            job.status === 'completed' ? "bg-green-500" :
                            job.status === 'processing' ? "bg-blue-500" :
                            job.status === 'pending' ? "bg-amber-500" :
                            "bg-red-500"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </AccordionTrigger>
                {sessionIdForLink && (
                  <Link 
                    to={`/session/${sessionIdForLink}`}
                    className="flex items-center text-sm font-medium text-blue-500 hover:text-blue-600 px-2.5 py-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <span className="mr-1.5">Details</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
              <AccordionContent className="px-4 pb-4">
                <div className="grid grid-cols-1 gap-3">
                  {group.jobs.map((job) => (
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
                                <FileText className="h-3 w-3" />
                                {job.id.slice(0, 8)}
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
                            onClick={() => handleRetryJob(job)}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
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
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

export default TranscriptionJobs;
