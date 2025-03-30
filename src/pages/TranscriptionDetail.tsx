
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { checkTranscriptionJobStatus, getUserTranscriptionJobs } from '@/lib/api';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, ArrowLeft, CheckCircle, Clock, Download, FileAudio, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ExportMenu from '@/components/ExportMenu';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export default function TranscriptionDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('details');
  
  // Fetch the specific job
  const { data: job, isLoading: isJobLoading, error: jobError } = useQuery({
    queryKey: ['transcription-job', jobId],
    queryFn: () => checkTranscriptionJobStatus(jobId as string),
    refetchInterval: (queryData) => {
      // Poll every 5 seconds for non-completed jobs
      if (queryData && (queryData.status === 'pending' || queryData.status === 'processing')) {
        return 5000;
      }
      return false;
    },
  });
  
  // Also fetch all jobs to get other models for this audio file
  const { data: allJobs } = useQuery({
    queryKey: ['transcription-jobs'],
    queryFn: getUserTranscriptionJobs,
  });
  
  // Find related jobs (same file path)
  const relatedJobs = allJobs?.filter(j => 
    j.file_path === job?.file_path && j.id !== job?.id
  ) || [];
  
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
        return 'text-amber-500';
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
        return <Clock className="h-5 w-5 text-amber-500" />;
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
  
  const getAudioFileName = (filePath: string) => {
    if (!filePath) return 'Unknown file';
    return filePath.split('/').pop()?.replace(/_/g, ' ') || 'Unknown file';
  };
  
  if (isJobLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container py-6 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading transcription details...</p>
          </div>
        </main>
      </div>
    );
  }
  
  if (jobError || !job) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container py-6">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              className="flex items-center mb-4"
              onClick={() => navigate('/app/history')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to History
            </Button>
          </div>
          
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6 pb-6">
              <div className="flex flex-col items-center text-center">
                <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
                <h3 className="font-medium text-lg">Transcription not found</h3>
                <p className="text-muted-foreground mt-1">
                  The transcription job you're looking for doesn't exist or was deleted
                </p>
                <Button className="mt-4" onClick={() => navigate('/app/history')}>
                  Return to History
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container py-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="flex items-center mb-4"
            onClick={() => navigate('/app/history')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to History
          </Button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-2xl font-bold tracking-tight line-clamp-1">
                {getAudioFileName(job.file_path || '')}
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <FileAudio className="h-3 w-3" />
                  {getModelDisplayName(job.model)}
                </span>
              </p>
            </div>
            
            {job.status === 'completed' && job.result && (
              <div className="flex gap-2">
                <ExportMenu 
                  transcriptionContent={(job.result as any).vttContent} 
                  fileName={getAudioFileName(job.file_path || '')}
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn("flex items-center gap-1", getStatusColor(job.status))}>
              {getStatusIcon(job.status)}
              <span className="font-medium capitalize">{job.status}</span>
            </div>
            
            {(job.status === 'pending' || job.status === 'processing') && (
              <span className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded">
                Auto-refreshing
              </span>
            )}
          </div>
          
          <Progress value={getProgressValue(job.status)} className="h-2" />
          
          {job.status_message && (
            <p className="text-sm text-muted-foreground mt-3">
              {job.status_message}
            </p>
          )}
          
          {job.error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              <p className="font-medium">Error:</p>
              <p>{job.error}</p>
            </div>
          )}
        </div>
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-2 md:w-auto">
            <TabsTrigger value="details">Transcription</TabsTrigger>
            <TabsTrigger value="other-models">Other Models ({relatedJobs.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-4">
            {job.status === 'completed' && job.result ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transcription Result</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap p-4 bg-muted rounded-md max-h-[500px] overflow-y-auto text-sm">
                    {(job.result as any).vttContent || "No transcription content available"}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col items-center text-center">
                    {job.status === 'pending' || job.status === 'processing' ? (
                      <>
                        <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
                        <h3 className="font-medium text-lg">Transcription in progress</h3>
                        <p className="text-muted-foreground mt-1">
                          The transcription is being processed. This page will automatically update.
                        </p>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
                        <h3 className="font-medium text-lg">No transcription available</h3>
                        <p className="text-muted-foreground mt-1">
                          The transcription failed or was not completed.
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="other-models" className="mt-4">
            {relatedJobs.length === 0 ? (
              <Card>
                <CardContent className="pt-6 pb-6">
                  <div className="flex flex-col items-center text-center">
                    <FileAudio className="h-10 w-10 text-muted-foreground mb-2" />
                    <h3 className="font-medium text-lg">No other models found</h3>
                    <p className="text-muted-foreground mt-1">
                      This audio file hasn't been transcribed with other models.
                    </p>
                    <Button className="mt-4" onClick={() => navigate('/app')}>
                      Transcribe with another model
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {relatedJobs.map((relatedJob) => (
                  <Card 
                    key={relatedJob.id}
                    className={cn(
                      "overflow-hidden border-l-4",
                      relatedJob.status === 'completed' ? 'border-l-green-500' :
                      relatedJob.status === 'failed' ? 'border-l-red-500' :
                      relatedJob.status === 'processing' ? 'border-l-blue-500' :
                      'border-l-amber-500'
                    )}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">{getModelDisplayName(relatedJob.model)}</CardTitle>
                        <div className={cn("flex items-center gap-1", getStatusColor(relatedJob.status))}>
                          {getStatusIcon(relatedJob.status)}
                          <span className="text-xs font-medium capitalize">{relatedJob.status}</span>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      {relatedJob.status === 'completed' && relatedJob.result ? (
                        <div className="flex flex-col">
                          <div className="whitespace-pre-wrap p-2 bg-muted rounded-md max-h-[200px] overflow-y-auto text-sm mb-3">
                            {(relatedJob.result as any).vttContent 
                              ? ((relatedJob.result as any).vttContent.split('\n\n').slice(0, 3).join('\n\n') + '...')
                              : "No transcription content available"
                            }
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            className="self-end"
                            onClick={() => navigate(`/app/transcription/${relatedJob.id}`)}
                          >
                            View Full Transcription
                          </Button>
                        </div>
                      ) : relatedJob.status === 'failed' ? (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                          <p>{relatedJob.error || "Transcription failed"}</p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center p-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>{relatedJob.status_message || "Processing..."}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
