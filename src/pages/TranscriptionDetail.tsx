
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { checkTranscriptionJobStatus } from '@/lib/api';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { getAudioFileName, getModelDisplayName } from '@/lib/transcription-utils';
import ExportMenu from '@/components/ExportMenu';
import LoadingState from '@/components/transcription/LoadingState';
import ErrorState from '@/components/transcription/ErrorState';
import TranscriptionContent from '@/components/transcription/TranscriptionContent';
import TranscriptionSidebar from '@/components/transcription/TranscriptionSidebar';

export default function TranscriptionDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [selectedVtt, setSelectedVtt] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  
  // Fetch the specific job
  const { data: job, isLoading, error } = useQuery({
    queryKey: ['transcription-job', jobId],
    queryFn: () => checkTranscriptionJobStatus(jobId as string),
    refetchInterval: (data, query) => {
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
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <LoadingState />
      </div>
    );
  }
  
  if (error || !job) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <ErrorState />
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
          <TranscriptionContent 
            jobId={job.id}
            status={job.status}
            result={job.result}
            error={job.error}
            selectedVtt={selectedVtt}
          />
          
          {/* Sidebar */}
          <TranscriptionSidebar 
            job={job}
            onSelectTranscription={handleSelectTranscription}
          />
        </div>
      </main>
    </div>
  );
}
