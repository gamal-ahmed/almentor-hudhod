
import React from "react";
import { Spinner } from "@/components/ui/spinner";

const LoadingState: React.FC = () => {
  return (
    <div className="text-center text-muted-foreground flex flex-col items-center justify-center py-8 space-y-3">
      <Spinner size="lg" />
      <p className="animate-pulse-opacity">Generating transcription...</p>
      <p className="text-xs text-muted-foreground max-w-md mx-auto">
        This process may take several minutes depending on the length of your audio file
      </p>
    </div>
  );
};

export default LoadingState;
