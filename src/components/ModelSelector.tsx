
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLogsStore } from "@/lib/useLogsStore";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { InfoIcon, CheckCircle, FastForward, Zap } from "lucide-react";

export type TranscriptionModel = "openai" | "gemini-2.0-flash" | "phi4";

interface ModelSelectorProps {
  selectedModels: TranscriptionModel[];
  onModelChange: (models: TranscriptionModel[]) => void;
  disabled: boolean;
}

const ModelSelector = ({ selectedModels, onModelChange, disabled }: ModelSelectorProps) => {
  const addLog = useLogsStore(state => state.addLog);

  const handleModelToggle = (model: TranscriptionModel) => {
    try {
      addLog(`Toggling model: ${model}`, "info", { source: "ModelSelector" });
      const currentModels = Array.isArray(selectedModels) ? selectedModels : [];
      addLog(`Current selected models: ${currentModels.join(", ") || "none"}`, "debug", { source: "ModelSelector" });
      
      if (currentModels.includes(model)) {
        const updatedModels = currentModels.filter(m => m !== model);
        addLog(`Removing ${model}, new selection: ${updatedModels.join(", ") || "none"}`, "debug", { source: "ModelSelector" });
        onModelChange(updatedModels);
      } else {
        const updatedModels = [...currentModels, model];
        addLog(`Adding ${model}, new selection: ${updatedModels.join(", ") || "none"}`, "debug", { source: "ModelSelector" });
        onModelChange(updatedModels);
      }
    } catch (error) {
      addLog(`Error toggling model: ${error.message}`, "error", { 
        source: "ModelSelector", 
        details: error.stack 
      });
      console.error("Error toggling model:", error);
    }
  };

  const models = [
    { 
      id: "openai" as TranscriptionModel, 
      label: "OpenAI Whisper",
      description: "Highly accurate with excellent multilingual support",
      speed: "Balanced",
      icon: <CheckCircle className="h-5 w-5 text-green-500" />
    },
    { 
      id: "gemini-2.0-flash" as TranscriptionModel, 
      label: "Gemini 2.0 Flash",
      description: "Fast processing with good accuracy",
      speed: "Fast",
      icon: <FastForward className="h-5 w-5 text-blue-500" />
    },
    { 
      id: "phi4" as TranscriptionModel, 
      label: "Microsoft Phi-4",
      description: "Excellent for technical content and specialized terminology",
      speed: "Standard",
      icon: <Zap className="h-5 w-5 text-yellow-500" />
    }
  ];

  const safeSelectedModels = Array.isArray(selectedModels) ? selectedModels : [];

  console.log("ModelSelector render:", { 
    selectedModels: safeSelectedModels,
    disabled
  });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3">
        {models.map(model => (
          <div 
            key={model.id} 
            className={`flex items-start space-x-3 p-3 rounded-lg border border-border/50 transition-colors ${
              safeSelectedModels.includes(model.id) 
                ? "bg-primary/10 border-primary/30" 
                : "bg-background hover:bg-muted/40"
            } ${disabled ? "opacity-60" : ""}`}
          >
            <Checkbox 
              id={model.id} 
              checked={safeSelectedModels.includes(model.id)} 
              onCheckedChange={() => handleModelToggle(model.id)}
              disabled={disabled}
              className="mt-0.5"
            />
            <div className="flex items-center space-x-2">
              {model.icon}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label 
                    htmlFor={model.id} 
                    className={`text-sm font-medium ${disabled ? "text-muted-foreground" : ""}`}
                  >
                    {model.label}
                  </Label>
                  <Badge variant="outline" className="text-xs font-normal h-5">
                    {model.speed}
                  </Badge>
                  <HoverCard>
                    <HoverCardTrigger>
                      <InfoIcon className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </HoverCardTrigger>
                    <HoverCardContent className="w-64">
                      <p className="text-xs">{model.description}</p>
                    </HoverCardContent>
                  </HoverCard>
                </div>
                <p className="text-xs text-muted-foreground">{model.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelSelector;
