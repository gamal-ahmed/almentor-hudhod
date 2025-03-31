import React, { useEffect, useState } from 'react';
import { getUserTranscriptionJobs, checkTranscriptionJobStatus, resetAllJobs } from '@/lib/api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Clock, CheckCircle2, XCircle, Loader2, RefreshCw, 
  AlertTriangle, Database, Trash2
} from 'lucide-react';
import TranscriptionCard from './TranscriptionCard';
import { useLogsStore } from '@/lib/useLogsStore';
import { supabase } from '@/integrations/supabase/client';

interface TranscriptionJob {
  id: string;
  status: string;
  model: string;
  created_at: string;
  result?: {
    vttContent: string;
  };
  error?: string;
  status_message?: string;
}

interface TranscriptionJobsProps {
  onSelectTranscription?: (vttContent: string, model: string) => void;
  refreshTrigger?: number;
}

const TranscriptionJobs: React.FC<TranscriptionJobsProps> = ({ 
  onSelectTranscription,
  refreshTrigger = 0
}) => {
  const [jobs, setJobs] = useState<TranscriptionJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();
  const { addLog } = useLogsStore();
  
  const AUTO_REFRESH_INTERVAL = 10000;
  
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('transcription_jobs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const transformedJobs: TranscriptionJob[] = (data || []).map(job => ({
        id: job.id,
        status: job.status,
        model: job.model,
        created_at: job.created_at,
        result: job.result ? { vttContent: job.result.vttContent || '' } : undefined,
        error: job.error,
        status_message: job.status_message
      }));
      
      setJobs(transformedJobs);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load transcription jobs');
      addLog('Failed to load transcription jobs', 'error', { 
        source: 'TranscriptionJobs',
        details: err.message 
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleResetAllJobs = async () => {
    try {
      setIsResetting(true);
      
      await resetAllJobs();
      
      toast({
        title: "Queue Reset",
        description: "All transcription jobs have been deleted.",
      });
      
      fetchJobs();
    } catch (err) {
      console.error('Error resetting jobs:', err);
      toast({
        title: "Reset Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };
  
  useEffect(() => {
    fetchJobs();
    
    const intervalId = setInterval(() => {
      const hasActiveJobs = jobs.some(job => 
        job.status === 'pending' || job.status === 'processing'
      );
      
      if (hasActiveJobs) {
        fetchJobs();
      }
    }, AUTO_REFRESH_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [refreshTrigger]);
  
  useEffect(() => {
    const hasActiveJobs = jobs.some(job => 
      job.status === 'pending' || job.status === 'processing'
    );
    
    if (!hasActiveJobs) return;
    
    const intervalId = setInterval(() => {
      fetchJobs();
    }, AUTO_REFRESH_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [jobs]);
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500 hover:bg-blue-600"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Processing</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-500 hover:bg-red-600"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge><AlertTriangle className="h-3 w-3 mr-1" /> {status}</Badge>;
    }
  };
  
  const handleSelectTranscription = (job: TranscriptionJob) => {
    if (job.result?.vttContent && onSelectTranscription) {
      onSelectTranscription(job.result.vttContent, job.model);
    }
  };
  
  if (loading && jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading transcription jobs...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Database className="h-12 w-12 text-muted-foreground opacity-30 mb-4" />
        <h3 className="text-lg font-medium mb-2">No Transcription Jobs</h3>
        <p className="text-muted-foreground max-w-md">
          You haven't created any transcription jobs yet. Upload an audio file and select your preferred AI models to start.
        </p>
      </div>
    );
  }
  
  const pendingOrProcessingJobs = jobs.filter(job => 
    job.status === 'pending' || job.status === 'processing'
  );
  
  const completedJobs = jobs.filter(job => job.status === 'completed');
  const failedJobs = jobs.filter(job => job.status === 'failed');
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Transcription Jobs</h3>
          <p className="text-sm text-muted-foreground">
            {pendingOrProcessingJobs.length > 0 ? 
              `${pendingOrProcessingJobs.length} active jobs - refreshing automatically` : 
              `${jobs.length} total jobs`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchJobs}
            className="flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleResetAllJobs}
            disabled={isResetting || jobs.length === 0}
            className="flex items-center"
          >
            {isResetting ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-1" />
                Reset Queue
              </>
            )}
          </Button>
        </div>
      </div>
      
      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-4">
          {pendingOrProcessingJobs.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Active Jobs
              </h4>
              {pendingOrProcessingJobs.map((job) => (
                <Card key={job.id} className="overflow-hidden border-l-4 border-l-blue-500">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">
                          {job.model === 'openai' ? 
                            'OpenAI Whisper' : 
                            job.model === 'gemini-2.0-flash' ? 
                              'Gemini 2.0 Flash' : 
                              'Microsoft Phi-4'}
                        </CardTitle>
                        <CardDescription>
                          Created {new Date(job.created_at).toLocaleString()}
                        </CardDescription>
                      </div>
                      {getStatusBadge(job.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="text-sm text-muted-foreground">
                      Status: {job.status_message || `${job.status.charAt(0).toUpperCase() + job.status.slice(1)}`}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {completedJobs.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                Completed Jobs
              </h4>
              {completedJobs.map((job) => (
                <Card 
                  key={job.id} 
                  className="overflow-hidden border-l-4 border-l-green-500 hover:shadow-md transition-shadow"
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">
                          {job.model === 'openai' ? 
                            'OpenAI Whisper' : 
                            job.model === 'gemini-2.0-flash' ? 
                              'Gemini 2.0 Flash' : 
                              'Microsoft Phi-4'}
                        </CardTitle>
                        <CardDescription>
                          Created {new Date(job.created_at).toLocaleString()}
                        </CardDescription>
                      </div>
                      {getStatusBadge(job.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <div className="text-sm">
                      {job.result?.vttContent ? (
                        <div className="max-h-[150px] overflow-y-auto border rounded p-2">
                          <pre className="text-xs whitespace-pre-wrap">{job.result.vttContent.substring(0, 500)}...</pre>
                        </div>
                      ) : (
                        <div className="text-muted-foreground">No content available</div>
                      )}
                    </div>
                  </CardContent>
                  
                  {job.result?.vttContent && onSelectTranscription && (
                    <CardFooter className="p-4 pt-0">
                      <Button 
                        size="sm" 
                        onClick={() => handleSelectTranscription(job)}
                        className="ml-auto"
                      >
                        Select This Transcription
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))}
            </div>
          )}
          
          {failedJobs.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                <XCircle className="h-3 w-3 mr-1 text-red-500" />
                Failed Jobs
              </h4>
              {failedJobs.map((job) => (
                <Card key={job.id} className="overflow-hidden border-l-4 border-l-red-500">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">
                          {job.model === 'openai' ? 
                            'OpenAI Whisper' : 
                            job.model === 'gemini-2.0-flash' ? 
                              'Gemini 2.0 Flash' : 
                              'Microsoft Phi-4'}
                        </CardTitle>
                        <CardDescription>
                          Created {new Date(job.created_at).toLocaleString()}
                        </CardDescription>
                      </div>
                      {getStatusBadge(job.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                    <Alert variant="destructive" className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {job.error || job.status_message || "Unknown error occurred"}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TranscriptionJobs;
