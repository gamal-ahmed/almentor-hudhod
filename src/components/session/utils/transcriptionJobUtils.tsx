
import { formatDistanceToNow, format } from "date-fns";
import { CheckCircle, AlertCircle, Clock, Loader2 } from "lucide-react";

// Helper functions for TranscriptionJobList component
export const getModelDisplayName = (model: string) => {
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

export const getStatusIcon = (status: string) => {
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

export const getStatusColor = (status: string) => {
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

export const getProgressValue = (status: string) => {
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

export const formatJobDate = (dateString: string) => {
  return {
    relative: formatDistanceToNow(new Date(dateString), { addSuffix: true }),
    formatted: format(new Date(dateString), 'MMM d, h:mm a')
  };
};
