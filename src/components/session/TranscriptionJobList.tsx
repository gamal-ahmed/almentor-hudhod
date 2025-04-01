
import React from "react";
import { formatDistanceToNow, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, AlertCircle, Clock, Loader2 } from "lucide-react";

interface TranscriptionJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  model: string;
  created_at: string;
  updated_at: string;
  status_message: string;
  error?: string;
  session_id?: string;
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
}

const TranscriptionJobList: React.FC<TranscriptionJobListProps> = ({
  jobs,
  selectedJob,
  comparisonMode,
  jobsToCompare,
  onSelectJob,
  isJobSelectedForComparison
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

  return (
    <ScrollArea className="h-[340px] pr-4 -mr-4">
      <div className="space-y-3">
        {jobs.map((job) => (
          <div
            key={job.id}
            className={`
              border rounded-md p-3 cursor-pointer transition-all
              ${job.status === 'completed' ? 'hover:border-primary/50 hover:bg-muted/50' : ''}
              ${selectedJob?.id === job.id && !comparisonMode ? 'border-primary bg-primary/5' : ''}
              ${isJobSelectedForComparison(job.id) ? 'border-primary bg-primary/5' : ''}
            `}
            onClick={() => onSelectJob(job)}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-1.5">
                <Badge variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'outline'}>
                  {getStatusIcon(job.status)}
                  <span className="ml-1 capitalize">{job.status}</span>
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
              </span>
            </div>
            <div className="mb-2">
              <h4 className="font-medium">{getModelDisplayName(job.model)}</h4>
            </div>
            <div className="mt-2">
              <Progress value={getProgressValue(job.status)} className="h-1 mb-1" />
              <div className="flex justify-between text-xs">
                <span className={getStatusColor(job.status)}>
                  {job.status === 'failed' ? 'Failed' : job.status === 'completed' ? 'Complete' : 'Processing...'}
                </span>
                <span className="text-muted-foreground">
                  {format(new Date(job.created_at), 'MMM d, h:mm a')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default TranscriptionJobList;
