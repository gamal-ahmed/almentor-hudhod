
import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Clock, ExternalLink } from 'lucide-react';

interface SessionGroupItemProps {
  timestamp: Date;
  jobCount: number;
  models: string[];
  hasCompleted: boolean;
  sessionId?: string;
}

const SessionGroupItem: React.FC<SessionGroupItemProps> = ({
  timestamp,
  jobCount,
  models,
  sessionId
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white shadow rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <div>
          <div className="text-sm font-medium">{formatDistanceToNow(timestamp, { addSuffix: true })}</div>
          <div className="text-xs text-muted-foreground">{jobCount} {jobCount === 1 ? 'model' : 'models'}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {models.map((model, i) => (
          <span key={i} className="text-xs px-3 py-1 bg-secondary rounded-full">
            {model}
          </span>
        ))}
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        asChild
        className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
      >
        {sessionId ? (
          <Link to={`/session/${sessionId}`}>
            <span className="mr-1">Details</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <Link to="/app">
            <span className="mr-1">Dashboard</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        )}
      </Button>
    </div>
  );
};

export default SessionGroupItem;
