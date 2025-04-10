
export interface TranscriptionJob {
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

export interface TranscriptionJobListProps {
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
  onRetryJob?: (job: TranscriptionJob) => void;
}

export interface JobUpdateStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  previousStatus: 'pending' | 'processing' | 'completed' | 'failed';
  model: string;
}
