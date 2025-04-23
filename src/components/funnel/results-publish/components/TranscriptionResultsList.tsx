
import React from "react";
import { TranscriptionCard } from "@/components/transcription";

interface TranscriptionResultsListProps {
  selectedModels: string[];
  currentJobs: string[];
  latestResults: Record<string, any>;
  selectedModel: string | null;
  audioUrl: string | null;
  extractVttContent: (job: any) => string;
  onSelectModel: (model: string, vttContent: string) => void;
}

const TranscriptionResultsList: React.FC<TranscriptionResultsListProps> = ({
  selectedModels,
  currentJobs,
  latestResults,
  selectedModel,
  audioUrl,
  extractVttContent,
  onSelectModel,
}) => {
  const isModelProcessing = (model: string) => {
    return currentJobs.includes(model);
  };
  
  const getModelDisplayName = (model: string) => {
    return model === "openai" 
      ? "OpenAI Whisper" 
      : model === "gemini-2.0-flash" 
        ? "Gemini 2.0 Flash" 
        : "Microsoft Phi-4";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {selectedModels.map((model) => {
        const latestJob = latestResults[model];
        const vttContent = latestJob ? extractVttContent(latestJob) : "";
        const isLoading = isModelProcessing(model);
        
        return (
          <TranscriptionCard
            key={model}
            modelName={getModelDisplayName(model)}
            vttContent={vttContent}
            onSelect={() => onSelectModel(model, vttContent)}
            isSelected={selectedModel === model}
            audioSrc={audioUrl || undefined}
            isLoading={isLoading}
            showExportOptions={false}
            showAudioControls={false}
          />
        );
      })}
    </div>
  );
};

export default TranscriptionResultsList;
