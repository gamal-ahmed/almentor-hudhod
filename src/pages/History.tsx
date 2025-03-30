
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { getUserTranscriptionJobs } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, FileAudio, Loader2, Search, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils';

export default function History() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['transcription-jobs'],
    queryFn: getUserTranscriptionJobs,
  });
  
  const filteredJobs = jobs?.filter(job => 
    job.file_path?.toLowerCase().includes(searchTerm.toLowerCase())
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
  
  const getBorderColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-l-green-500';
      case 'failed':
        return 'border-l-red-500';
      case 'processing':
        return 'border-l-blue-500';
      default:
        return 'border-l-amber-500';
    }
  };
  
  const getAudioFileName = (filePath: string) => {
    if (!filePath) return 'Unknown file';
    return filePath.split('/').pop()?.replace(/_/g, ' ') || 'Unknown file';
  };
  
  const handleViewJob = (jobId: string) => {
    navigate(`/app/transcription/${jobId}`);
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Transcription History</h1>
          <p className="text-muted-foreground mt-1">View your past and in-progress transcription jobs</p>
        </div>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by file name..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading transcription history...</p>
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
                <h3 className="font-medium text-lg">Error loading transcription history</h3>
                <p className="text-muted-foreground mt-1">Please try again later</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border rounded-lg border-dashed">
            <FileAudio className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="font-medium text-lg">No transcription jobs found</h3>
            <p className="text-muted-foreground mt-1">
              {searchTerm ? 'Try a different search term' : 'Upload an audio file to get started'}
            </p>
            <Button className="mt-4" onClick={() => navigate('/app')}>Go to Transcriber</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredJobs.map((job) => (
              <Card 
                key={job.id} 
                className={cn(
                  "overflow-hidden border-l-4 transition-all hover:shadow-md",
                  getBorderColor(job.status)
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base line-clamp-1">
                      {getAudioFileName(job.file_path || '')}
                    </CardTitle>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-background">
                      {getStatusIcon(job.status)}
                      <span className="text-xs font-medium capitalize">
                        {job.status}
                      </span>
                    </div>
                  </div>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pb-3">
                  <div className="text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">Model:</span> 
                      <span>{getModelDisplayName(job.model)}</span>
                    </div>
                    {job.status_message && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {job.status_message}
                      </p>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    variant="secondary" 
                    className="w-full"
                    onClick={() => handleViewJob(job.id)}
                  >
                    View Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
