import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLogsStore } from "@/lib/useLogsStore";
import { CircleCheck, Check } from "lucide-react";

export type TranscriptionModel = "openai" | "gemini-2.0-flash" | "phi4";

interface ModelSelectorProps {
  selectedModels: TranscriptionModel[];
  onModelChange: (models: TranscriptionModel[]) => void;
  disabled: boolean;
  showSelectAll?: boolean;
}

const ModelSelector = ({ 
  selectedModels, 
  onModelChange, 
  disabled,
  showSelectAll = false 
}: ModelSelectorProps) => {
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

  const handleSelectAll = () => {
    try {
      const allModels: TranscriptionModel[] = ["openai", "gemini-2.0-flash", "phi4"];
      
      // If all models are already selected, deselect all
      if (selectedModels.length === allModels.length && 
          allModels.every(model => selectedModels.includes(model))) {
        addLog("Deselecting all models", "info", { source: "ModelSelector" });
        onModelChange([]);
      } else {
        // Otherwise select all models
        addLog("Selecting all models", "info", { source: "ModelSelector" });
        onModelChange(allModels);
      }
    } catch (error) {
      addLog(`Error toggling all models: ${error.message}`, "error", { 
        source: "ModelSelector", 
        details: error.stack 
      });
      console.error("Error toggling all models:", error);
    }
  };

  const models: {id: TranscriptionModel, label: string}[] = [
    { id: "openai", label: "OpenAI Whisper" },
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { id: "phi4", label: "Microsoft Phi-4" }
  ];

  // Ensure selectedModels is always treated as an array
  const safeSelectedModels = Array.isArray(selectedModels) ? selectedModels : [];

  // Are all models selected?
  const allModelsSelected = safeSelectedModels.length === models.length &&
    models.every(model => safeSelectedModels.includes(model.id));

  // Add additional logging for debugging
  console.log("ModelSelector render:", { 
    selectedModels: safeSelectedModels,
    disabled,
    allModelsSelected
  });

  return (
    <div className="space-y-2">
      {showSelectAll && (
        <div className="flex items-center space-x-1.5 mb-1">
          <Checkbox 
            id="select-all-models" 
            checked={allModelsSelected}
            onCheckedChange={handleSelectAll}
            disabled={disabled}
            className="h-3 w-3"
          />
          <Label 
            htmlFor="select-all-models" 
            className={`text-xs font-medium ${disabled ? "text-muted-foreground" : ""}`}
          >
            All models
          </Label>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-x-2 gap-y-1">
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
