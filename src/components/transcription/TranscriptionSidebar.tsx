import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle, AlertCircle, Clock, Loader2, FileAudio 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import TranscriptionJobs from '@/components/TranscriptionJobs';

interface TranscriptionSidebarProps {
  job: {
    id: string;
    status: string;
    model: string;
    created_at: string;
    updated_at?: string;
    status_message?: string;
    error?: string;
    file_path?: string;
  };
  onSelectTranscription: (vtt: string, model: string) => void;
}

const TranscriptionSidebar: React.FC<TranscriptionSidebarProps> = ({ 
  job, 
  onSelectTranscription 
}) => {
  return (
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
          <TranscriptionJobs onSelectTranscription={onSelectTranscription} />
        </CardContent>
      </Card>
    </div>
  );
};

function getModelDisplayName(model: string) {
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
}

function getAudioFileName(filePath: string) {
  if (!filePath) return 'Unknown file';
  return filePath.split('/').pop()?.replace(/_/g, ' ') || 'Unknown file';
}

export default TranscriptionSidebar;
