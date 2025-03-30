import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { checkTranscriptionJobStatus } from '@/lib/api';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertCircle, ArrowLeft, ArrowRight, CheckCircle, Clock, 
  Download, FileAudio, Loader2 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ExportMenu from '@/components/ExportMenu';
import TranscriptionJobs from '@/components/TranscriptionJobs';

export default function TranscriptionDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [selectedVtt, setSelectedVtt] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  
  // Fetch the specific job
  const { data: job, isLoading, error } = useQuery({
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
  
  const handleSelectTranscription = (vtt: string, model: string) => {
    setSelectedVtt(vtt);
    setSelectedModel(model);
  };
  
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
  
  const getAudioFileName = (filePath: string) => {
    if (!filePath) return 'Unknown file';
    return filePath.split('/').pop()?.replace(/_/g, ' ') || 'Unknown file';
  };
  
  if (isLoading) {
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
  
  if (error || !job) {
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
              Transcription Details
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main content area */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  {job.model ? getModelDisplayName(job.model) : 'Transcription'} Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                {job.status === 'completed' && job.result ? (
                  <div className="whitespace-pre-wrap p-4 bg-muted rounded-md max-h-[600px] overflow-y-auto text-sm">
                    {selectedVtt || (job.result as any).vttContent || "No transcription content available"}
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
            
            <div className="mt-6">
              {job.status === 'completed' && job.result && (
                <Button 
                  onClick={() => navigate(`/app/workspace/${job.id}`)}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Open in Workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status card */}
            <Card>
              <CardHeader>
                <CardTitle>Transcription Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center">
                    {job.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    ) : job.status === 'failed' ? (
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                    ) : (
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-2" />
                    )}
                    <span className="font-medium capitalize">{job.status}</span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <div className="flex justify-between mb-1">
                      <span>Created:</span>
                      <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span>Model:</span>
                      <span>{getModelDisplayName(job.model)}</span>
                    </div>
                    {job.updated_at && (
                      <div className="flex justify-between">
                        <span>Last Updated:</span>
                        <span>{formatDistanceToNow(new Date(job.updated_at), { addSuffix: true })}</span>
                      </div>
                    )}
                  </div>
                  
                  {job.status_message && (
                    <div className="mt-2 text-xs p-2 bg-secondary/50 rounded-md">
                      {job.status_message}
                    </div>
                  )}
                  
                  {job.error && (
                    <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded border border-red-200">
                      {job.error}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Audio file card */}
            <Card>
              <CardHeader>
                <CardTitle>Audio File</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <FileAudio className="h-10 w-10 text-muted-foreground" />
                  <div className="ml-3">
                    <h3 className="font-medium truncate max-w-[200px]">
                      {getAudioFileName(job.file_path || '')}
                    </h3>
                    {/* <p className="text-xs text-muted-foreground mt-1">
                      {file?.size ? `${Math.round(file.size / 1024)} KB` : ''}
                    </p> */}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Other transcriptions */}
            <Card>
              <CardHeader>
                <CardTitle>Other Transcriptions</CardTitle>
              </CardHeader>
              <CardContent>
                <TranscriptionJobs onSelectTranscription={handleSelectTranscription} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
