
import React from "react";

const LoadingState: React.FC = () => {
  return (
    <div className="text-center text-muted-foreground animate-pulse-opacity">
      Generating transcription...
    </div>
  );
};

export default LoadingState;
