
import React from "react";
import { RefreshCw } from "lucide-react";

interface SessionTitleProps {
  displaySessionId: string | undefined;
  isPolling: boolean;
  failedJobsCount: number;
}

const SessionTitle: React.FC<SessionTitleProps> = ({
  displaySessionId,
  isPolling,
  failedJobsCount,
}) => {
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
        Transcription Session Details
      </h1>
      {displaySessionId && displaySessionId !== 'null' && displaySessionId !== 'undefined' && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <p className="font-mono text-sm">Session ID: {displaySessionId}</p>
          {isPolling && (
            <div className="flex items-center gap-1 text-sm px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 animate-pulse">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Auto-updating</span>
            </div>
          )}
          {failedJobsCount > 0 && (
            <div className="flex items-center gap-1 text-sm px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
              <span>{failedJobsCount} failed job{failedJobsCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SessionTitle;
