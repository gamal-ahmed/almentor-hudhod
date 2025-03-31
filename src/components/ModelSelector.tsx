
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLogsStore } from "@/lib/useLogsStore";

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
      // Log the action
      addLog(`Toggling model: ${model}`, "info", { source: "ModelSelector" });
      
      // Ensure selectedModels is always an array
      const currentModels = Array.isArray(selectedModels) ? selectedModels : [];
      
      // Log current selection state
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

  const models: {id: TranscriptionModel, label: string}[] = [
    { id: "openai", label: "OpenAI Whisper" },
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { id: "phi4", label: "Microsoft Phi-4" }
  ];

  // Ensure selectedModels is always treated as an array
  const safeSelectedModels = Array.isArray(selectedModels) ? selectedModels : [];

  // Add additional logging for debugging
  console.log("ModelSelector render:", { 
    selectedModels: safeSelectedModels,
    disabled
  });

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
        {models.map(model => (
          <div key={model.id} className="flex items-center space-x-1.5">
            <Checkbox 
              id={model.id} 
              checked={safeSelectedModels.includes(model.id)} 
              onCheckedChange={() => handleModelToggle(model.id)}
              disabled={disabled}
              className="h-3 w-3"
            />
            <Label htmlFor={model.id} className={`text-xs ${disabled ? "text-muted-foreground" : ""}`}>
              {model.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModelSelector;
