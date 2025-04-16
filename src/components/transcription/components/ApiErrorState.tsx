
import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ApiErrorStateProps {
  modelName: string;
  error?: string;
  onRetry?: () => void;
}

const ApiErrorState: React.FC<ApiErrorStateProps> = ({
  modelName,
  error,
  onRetry,
}) => {
  // Parse and format the error message for better display
  const formatErrorMessage = (errorMsg?: string) => {
    if (!errorMsg) return "Unknown error occurred";
    
    // Check for worker limit errors
    if (errorMsg.includes("WORKER_LIMIT")) {
      return "Service is experiencing high demand. Please try again in a few minutes.";
    }
    
    // Check for file size errors
    if (errorMsg.includes("file too large") || errorMsg.includes("size limit")) {
      return "Audio file exceeds the maximum size limit.";
    }
    
    // Check for timeout errors
    if (errorMsg.includes("timeout") || errorMsg.includes("timed out")) {
      return "Request timed out. The audio file might be too long or the service is busy.";
    }
    
    // Check for API key or authentication errors
    if (errorMsg.includes("API key") || errorMsg.includes("authentication")) {
      return "API authentication error. Please contact support.";
    }
    
    // If no specific error pattern is matched, return a cleaned-up version
    return errorMsg.replace(/Transcription API error: \d+ - /g, "");
  };

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="ml-2">Transcription Error ({modelName})</AlertTitle>
      <AlertDescription className="mt-2">
        <p>{formatErrorMessage(error)}</p>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry} 
            className="mt-2"
          >
            Retry Transcription
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default ApiErrorState;
