
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { TranscriptionModel } from "@/components/ModelSelector";
import { queueTranscriptionJob, checkTranscriptionStatus } from "@/lib/api";
import { useLogsStore } from "@/lib/useLogsStore";
import TranscriptionCard from "@/components/TranscriptionCard";

interface AsyncTranscriberProps {
  file: File;
  model: TranscriptionModel;
  onComplete: (vttContent: string, jobId: string) => void;
}

export default function AsyncTranscriber({ file, model, onComplete }: AsyncTranscriberProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  
  const addLog = useLogsStore(state => state.addLog);
  const { toast } = useToast();
  
  // Queue the transcription job
  const queueJob = async () => {
    if (isLoading || !file) return;
    
    try {
      setIsLoading(true);
      setStatus('queueing');
      setStatusMessage('Preparing transcription job...');
      setError(null);
      
      addLog(`Queueing async transcription for file: ${file.name}`, "info", {
        source: "AsyncTranscriber",
        details: `Model: ${model}, File size: ${Math.round(file.size / 1024)} KB`
      });
      
      const response = await queueTranscriptionJob(file, model);
      
      setJobId(response.jobId);
      setStatus('pending');
      setStatusMessage('Transcription job queued. Waiting to be processed...');
      
      addLog(`Transcription job queued: ${response.jobId}`, "success", {
        source: "AsyncTranscriber",
        details: `Status: ${response.status}, Message: ${response.message}`
      });
      
      toast({
        title: "Transcription Queued",
        description: "Your audio is in queue for transcription. You can close this window and check back later.",
      });
      
      // Start polling for status
      startPolling(response.jobId);
    } catch (error) {
      console.error("Error queueing transcription:", error);
      setStatus('error');
      setStatusMessage('Error queueing transcription');
      setError(error.message);
      
      addLog(`Error queueing transcription: ${error.message}`, "error", {
        source: "AsyncTranscriber",
        details: error.stack
      });
      
      toast({
        variant: "destructive",
        title: "Transcription Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Start polling for job status
  const startPolling = (id: string) => {
    // Clear any existing interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    // Set initial progress
    setProgress(10);
    
    // Create new polling interval
    const interval = window.setInterval(async () => {
      try {
        const jobStatus = await checkTranscriptionStatus(id);
        
        setStatus(jobStatus.status);
        setStatusMessage(jobStatus.status_message || jobStatus.status);
        
        // Update progress based on status
        if (jobStatus.status === 'pending') {
          setProgress(25);
        } else if (jobStatus.status === 'processing') {
          setProgress(60);
        } else if (jobStatus.status === 'completed') {
          setProgress(100);
          setResult(jobStatus.result);
          
          // Call onComplete with the vtt content
          if (jobStatus.result && jobStatus.result.vttContent) {
            onComplete(jobStatus.result.vttContent, id);
            
            addLog(`Async transcription completed: ${id}`, "success", {
              source: "AsyncTranscriber",
              details: `VTT content length: ${jobStatus.result.vttContent.length} chars`
            });
            
            toast({
              title: "Transcription Complete",
              description: "Your audio has been successfully transcribed.",
            });
          }
          
          // Stop polling
          clearInterval(interval);
          setPollingInterval(null);
        } else if (jobStatus.status === 'failed') {
          setProgress(100);
          setError(jobStatus.error || 'Transcription failed');
          
          addLog(`Transcription job failed: ${id}`, "error", {
            source: "AsyncTranscriber",
            details: jobStatus.error
          });
          
          toast({
            variant: "destructive",
            title: "Transcription Failed",
            description: jobStatus.error || "An error occurred during transcription",
          });
          
          // Stop polling
          clearInterval(interval);
          setPollingInterval(null);
        }
      } catch (error) {
        console.error("Error polling job status:", error);
        
        addLog(`Error polling job status: ${error.message}`, "error", {
          source: "AsyncTranscriber",
          details: error.stack
        });
        
        // Don't stop polling on temporary errors
        // But if we've been polling for too long, stop
        if (error.message.includes('Job not found')) {
          clearInterval(interval);
          setPollingInterval(null);
          setStatus('error');
          setStatusMessage('Job not found');
          setError('The transcription job could not be found');
        }
      }
    }, 3000); // Poll every 3 seconds
    
    setPollingInterval(interval);
  };
  
  // If we have a jobId on component mount, start polling
  useEffect(() => {
    if (jobId) {
      startPolling(jobId);
    }
    
    // Cleanup interval on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);
  
  // Display a result card if transcription is complete
  const renderResult = () => {
    if (status === 'completed' && result && result.vttContent) {
      return (
        <TranscriptionCard
          modelName={`${model === 'openai' ? 'OpenAI Whisper' : model === 'gemini-2.0-flash' ? 'Gemini 2.0 Flash' : 'Microsoft Phi-4'} (Async)`}
          vttContent={result.vttContent}
          prompt={result.prompt || ""}
          onSelect={() => onComplete(result.vttContent, jobId as string)}
          isSelected={true}
          isLoading={false}
        />
      );
    }
    return null;
  };

  // Status indicator
  const getStatusIndicator = () => {
    switch (status) {
      case 'idle':
        return <Badge variant="outline">Ready</Badge>;
      case 'queueing':
        return <Badge variant="secondary">Preparing</Badge>;
      case 'pending':
        return <Badge variant="secondary">Queued</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Processing</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'failed':
      case 'error':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Async Transcription</CardTitle>
          {getStatusIndicator()}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* File info */}
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">File:</span> {file.name} ({Math.round(file.size / 1024)} KB)
          </div>
          
          {/* Status message */}
          <div className="text-sm">
            <span className="font-medium">Status:</span> {statusMessage || 'Ready to start transcription'}
          </div>
          
          {/* Progress indicator */}
          {(status === 'pending' || status === 'processing' || status === 'queueing') && (
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mt-2">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="text-sm text-red-500 mt-2">
              <span className="font-medium">Error:</span> {error}
            </div>
          )}
          
          {/* Result preview */}
          {renderResult()}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end">
        {status === 'idle' && (
          <Button onClick={queueJob} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Start Transcription
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
