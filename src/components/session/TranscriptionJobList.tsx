
import React from "react";
import { formatDistanceToNow, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Clock, Loader2, Star, StarIcon, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface TranscriptionJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  model: string;
  created_at: string;
  updated_at: string;
  status_message: string;
  error?: string;
  session_id?: string;
  file_path: string;
  result?: { 
    vttContent: string; 
    text: string; 
    prompt: string;
  } | any;
}

interface TranscriptionJobListProps {
  jobs: TranscriptionJob[];
  selectedJob: TranscriptionJob | null;
  comparisonMode: boolean;
  jobsToCompare: TranscriptionJob[];
  onSelectJob: (job: TranscriptionJob) => void;
  isJobSelectedForComparison: (jobId: string) => boolean;
  selectedModelId?: string | null;
  acceptedModelId?: string | null;
  onMarkAsAccepted?: (job: TranscriptionJob) => void;
  isPolling?: boolean;
}

const TranscriptionJobList: React.FC<TranscriptionJobListProps> = ({
  jobs,
  selectedJob,
  comparisonMode,
  jobsToCompare,
  onSelectJob,
  isJobSelectedForComparison,
  selectedModelId,
  acceptedModelId,
  onMarkAsAccepted,
  isPolling = false
}) => {
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
        return <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 dark:text-blue-400 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-amber-500 dark:text-amber-400" />;
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

  if (!jobs || jobs.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No transcription jobs found.
      </div>
    );
  }

  return (
    <>
      {isPolling && (
        <div className="flex items-center justify-center mb-3 py-1.5 px-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
          <RefreshCw className="h-3.5 w-3.5 mr-2 text-blue-500 dark:text-blue-400 animate-spin" />
          <span className="text-xs text-blue-700 dark:text-blue-300">Auto-updating transcriptions...</span>
        </div>
      )}
      
      <ScrollArea className="h-[500px] pr-4 -mr-4">
        <div className="space-y-3">
          {jobs.map((job) => {
            const isSelected = selectedModelId === job.id;
            const isAccepted = acceptedModelId === job.id;
            
            return (
              <div
                key={job.id}
                className={cn(
                  "border rounded-md p-3 cursor-pointer transition-all",
                  job.status === 'completed' ? 'hover:border-primary/50 hover:bg-muted/50' : '',
                  selectedJob?.id === job.id && !comparisonMode ? 'border-primary bg-primary/5' : '',
                  isJobSelectedForComparison(job.id) ? 'border-primary bg-primary/5' : '',
                  isAccepted ? 'border-green-500 border-2 bg-green-500/10 shadow-md' : '',
                  isSelected && !isAccepted ? 'border-primary border-2 bg-primary/10 shadow-md' : '',
                  (job.status === 'processing' || job.status === 'pending') && isPolling ? 'border-blue-300 dark:border-blue-700 animate-pulse' : ''
                )}
                onClick={() => onSelectJob(job)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-1.5">
                    <Badge variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'outline'}>
                      {getStatusIcon(job.status)}
                      <span className="ml-1 capitalize">{job.status}</span>
                    </Badge>
                    
                    {isAccepted && (
                      <Badge variant="outline" className="ml-2 bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                        <Star className="h-3 w-3 mr-1 fill-green-500 text-green-500" />
                        Accepted
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                  </span>
                </div>
                
                <div className="mb-2">
                  <h4 className="font-medium">{getModelDisplayName(job.model)}</h4>
                </div>
                
                <div className="mt-2">
                  <Progress 
                    value={getProgressValue(job.status)} 
                    className={cn(
                      "h-1 mb-1",
                      (job.status === 'processing' || job.status === 'pending') && isPolling ? 'animate-pulse' : ''
                    )} 
                  />
                  <div className="flex justify-between text-xs">
                    <span className={getStatusColor(job.status)}>
                      {job.status === 'failed' ? 'Failed' : job.status === 'completed' ? 'Complete' : 'Processing...'}
                    </span>
                    <span className="text-muted-foreground">
                      {format(new Date(job.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
                
                {job.status === 'completed' && onMarkAsAccepted && (
                  <div className="mt-3 flex justify-end">
                    <Button 
                      size="sm" 
                      variant={isAccepted ? "default" : "outline"}
                      className={cn(
                        "text-xs",
                        isAccepted 
                          ? "bg-green-600 text-white hover:bg-green-700 border-green-600" 
                          : "border-green-600/30 text-green-600 hover:bg-green-600/10"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsAccepted(job);
                      }}
                    >
                      {isAccepted ? (
                        <>
                          <StarIcon className="h-3.5 w-3.5 mr-1 fill-current" />
                          Accepted
                        </>
                      ) : (
                        <>
                          <Star className="h-3.5 w-3.5 mr-1" />
                          Accept
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </>
  );
};

export default TranscriptionJobList;
