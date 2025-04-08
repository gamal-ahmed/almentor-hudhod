
import React from "react";
import { RefreshCw } from "lucide-react";

interface PollingIndicatorProps {
  isPolling: boolean;
}

const PollingIndicator: React.FC<PollingIndicatorProps> = ({ isPolling }) => {
  if (!isPolling) return null;
  
  return (
    <div className="flex items-center justify-center mb-3 py-1.5 px-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
      <RefreshCw className="h-3.5 w-3.5 mr-2 text-blue-500 dark:text-blue-400 animate-spin" />
      <span className="text-xs text-blue-700 dark:text-blue-300">Auto-updating transcriptions...</span>
    </div>
  );
};

export default PollingIndicator;
