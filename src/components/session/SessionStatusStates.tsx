
import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileText, Loader2, RefreshCw, RotateCcw } from "lucide-react";

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = "Loading session details..." }) => (
  <div className="flex flex-col items-center justify-center py-10">
    <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
    <p className="text-muted-foreground text-center">{message}</p>
  </div>
);

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry }) => (
  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 my-4">
    <div className="flex items-start gap-3">
      <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
      <div>
        <h3 className="text-lg font-medium text-destructive mb-2">Error Loading Session</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry}
          className="flex items-center gap-1.5"
        >
          <RotateCcw className="h-4 w-4" />
          Try Again
        </Button>
      </div>
    </div>
  </div>
);

interface EmptyStateProps {
  onRefresh: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onRefresh }) => (
  <div className="bg-muted rounded-lg p-6 my-4 text-center">
    <FileText className="h-10 w-10 text-muted-foreground/70 mx-auto mb-4" />
    <h3 className="text-lg font-medium mb-2">No Transcription Jobs Found</h3>
    <p className="text-muted-foreground mb-4">
      We couldn't find any transcription jobs for this session.
    </p>
    <Button 
      variant="outline" 
      size="sm" 
      onClick={onRefresh}
      className="flex items-center gap-1.5 mx-auto"
    >
      <RefreshCw className="h-4 w-4" />
      Refresh
    </Button>
  </div>
);

interface NoJobSelectedStateProps {}

export const NoJobSelectedState: React.FC<NoJobSelectedStateProps> = () => (
  <div className="text-center py-10">
    <FileText className="h-10 w-10 mx-auto mb-4 text-muted-foreground/70" />
    <h3 className="text-lg font-medium mb-2">No Transcription Selected</h3>
    <p className="text-muted-foreground">
      Select a transcription job from the list to view details.
    </p>
  </div>
);
