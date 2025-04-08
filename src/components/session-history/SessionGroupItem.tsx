
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Clock, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SessionGroupItemProps {
  session: {
    id: string;
    created_at: string;
    audio_file_name?: string;
    selected_models?: string[];
    selected_model?: string;
    accepted_model_id?: string | null;
    transcriptions?: any[];
  };
  onViewDetails: () => void;
}

const SessionGroupItem: React.FC<SessionGroupItemProps> = ({
  session,
  onViewDetails
}) => {
  const timestamp = new Date(session.created_at);
  const modelCount = session.transcriptions ? Object.keys(session.transcriptions).length : 0;
  
  // Get models from transcriptions if available
  const models = session.selected_models || [];
  
  // Check if any transcription is completed
  const hasCompleted = session.transcriptions ? 
    Object.values(session.transcriptions).some((t: any) => t.status === 'completed') : 
    false;
    
  return (
    <div className="flex items-center justify-between p-4 bg-card border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {hasCompleted ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <Clock className="h-5 w-5 text-amber-500" />
          )}
        </div>
        <div>
          <div className="text-sm font-medium">
            {session.audio_file_name || 'Transcription Session'}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(timestamp, { addSuffix: true })}
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mx-2">
        {modelCount > 0 ? (
          <Badge variant="secondary" className="text-xs">
            {modelCount} {modelCount === 1 ? 'model' : 'models'}
          </Badge>
        ) : (
          models.map((model, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {model}
            </Badge>
          ))
        )}
      </div>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onViewDetails}
        className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
      >
        <span className="mr-1">Details</span>
        <ExternalLink className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

export default SessionGroupItem;
