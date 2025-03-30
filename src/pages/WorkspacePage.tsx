import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { checkTranscriptionJobStatus, getUserTranscriptionJobs } from '@/lib/api';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  AlertCircle, ArrowLeft, CheckCircle, Clock, Download, 
  FileAudio, Loader2, Settings, Send, FileText 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ExportMenu from '@/components/ExportMenu';
import { Progress } from '@/components/ui/progress';
import VideoIdInput from "@/components/VideoIdInput";
import { useToast } from "@/components/ui/use-toast";
import { cn } from '@/lib/utils';
import LogsPanel from "@/components/LogsPanel";
import { useLogsStore } from "@/lib/useLogsStore";

export default function WorkspacePage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('transcription');
  const [videoId, setVideoId] = useState<string>("");
  const [isPublishing, setIsPublishing] = useState(false);
  const { toast } = useToast();
  const { logs } = useLogsStore();
  
  // Fetch the specific job
  const { data: job, isLoading: isJobLoading, error: jobError } = useQuery({
    queryKey: ['transcription-job', jobId],
    queryFn: () => checkTranscriptionJobStatus(jobId as string),
    refetchInterval: (data) => {
      // Poll every 5 seconds for non-completed jobs
      if (data && (data.status === 'pending' || data.status === 'processing')) {
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
  
  const getAudioFileName = (filePath: string) => {
    if (!filePath) return 'Unknown file';
    return filePath.split('/').pop()?.replace(/_/g, ' ') || 'Unknown file';
  };
  
  // Publish caption to Brightcove
  const publishCaption = async () => {
    if (!job?.result || !videoId) {
      toast({
        title: "Missing Information",
        description: "Please ensure transcription is complete and enter a video ID.",
        variant: "destructive",
      });
      return;
    }
    
    setIsPublishing(true);
    
    // Simulating API call
    setTimeout(() => {
      setIsPublishing(false);
      toast({
        title: "Caption Published",
        description: "Your caption has been successfully published to the Brightcove video.",
      });
    }, 2000);
  };
  
  if (isJobLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 container py-6 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading workspace...</p>
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
          
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">
              Transcription Workspace
            </h1>
            
            {job.status === 'completed' && job.result && (
              <ExportMenu 
                transcriptionContent={(job.result as any).vttContent} 
                fileName={getAudioFileName(job.file_path || '')}
              />
            )}
          </div>
          
          <p className="text-muted-foreground">{getAudioFileName(job.file_path || '')}</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main content area */}
          <div className="lg:col-span-8">
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList>
                <TabsTrigger value="transcription">Transcription</TabsTrigger>
                <TabsTrigger value="compare">Compare Models</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              
              <TabsContent value="transcription" className="mt-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>
                        {getModelDisplayName(job.model)} Transcription
                      </CardTitle>
                      <div className="flex items-center gap-1 text-sm">
                        {getStatusIcon(job.status)}
                        <span className="capitalize">{job.status}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {job.status === 'completed' && job.result ? (
                      <div className="whitespace-pre-wrap p-4 bg-muted rounded-md max-h-[600px] overflow-y-auto text-sm">
                        {(job.result as any).vttContent || "No transcription content available"}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 text-center">
                        {job.status === 'pending' || job.status === 'processing' ? (
                          <>
                            <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
                            <h3 className="font-medium text-lg">Transcription in progress</h3>
                            <p className="text-muted-foreground mt-1">
                              This page will automatically update when ready.
                            </p>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
                            <h3 className="font-medium text-lg">Transcription failed</h3>
                            <p className="text-muted-foreground mt-1">
                              {job.error || "An unknown error occurred"}
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="compare" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Compare AI Models</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {relatedJobs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <FileAudio className="h-10 w-10 text-muted-foreground mb-2" />
                        <h3 className="font-medium text-lg">No other models found</h3>
                        <p className="text-muted-foreground mt-1">
                          This audio file hasn't been transcribed with other models.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {relatedJobs.map((relatedJob) => (
                          <div key={relatedJob.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-medium">{getModelDisplayName(relatedJob.model)}</h3>
                              <div className="flex items-center gap-1 text-sm">
                                {getStatusIcon(relatedJob.status)}
                                <span className="capitalize">{relatedJob.status}</span>
                              </div>
                            </div>
                            
                            {relatedJob.status === 'completed' && relatedJob.result ? (
                              <div className="whitespace-pre-wrap p-3 bg-muted rounded-md max-h-[300px] overflow-y-auto text-sm">
                                {(relatedJob.result as any).vttContent || "No content available"}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                                {relatedJob.status === 'pending' || relatedJob.status === 'processing' ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Processing...</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                    <span>Failed: {relatedJob.error || "Unknown error"}</span>
                                  </>
                                )}
                              </div>
                            )}
                            
                            <div className="flex justify-end mt-3">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => navigate(`/app/workspace/${relatedJob.id}`)}
                              >
                                Switch to this model
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="settings" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Transcription Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-medium mb-2">Prompt Settings</h3>
                        <p className="text-sm text-muted-foreground">
                          Current prompt: {(job.result as any)?.prompt || "Default prompt used"}
                        </p>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="font-medium mb-2">Output Format</h3>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">VTT Format</Button>
                          <Button size="sm" variant="outline">Plain Text</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {/* Publication Card */}
            <Card className={cn(
              "overflow-hidden",
              job.status === 'completed' 
              ? 'border-green-200 bg-gradient-to-br from-white to-green-50' 
              : 'border-amber-200 bg-gradient-to-br from-white to-amber-50'
            )}>
              <CardHeader>
                <CardTitle className="text-lg">Publish to Brightcove</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <VideoIdInput 
                    videoId={videoId} 
                    onChange={setVideoId}
                    disabled={isPublishing || job.status !== 'completed'}
                  />
                  
                  <Button 
                    onClick={publishCaption} 
                    disabled={isPublishing || job.status !== 'completed' || !videoId}
                    className="w-full bg-amber-500 hover:bg-amber-600"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Publish to Brightcove
                      </>
                    )}
                  </Button>
                  
                  {job.status !== 'completed' && (
                    <p className="text-xs text-amber-600">
                      Transcription must be completed before publishing
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* File Info Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">File Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model:</span>
                    <span className="font-medium">{getModelDisplayName(job.model)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="capitalize">{job.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Related Models:</span>
                    <span>{relatedJobs.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* System Logs Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  System Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <LogsPanel logs={logs} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
