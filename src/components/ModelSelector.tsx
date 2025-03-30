
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export type TranscriptionModel = "openai" | "gemini" | "phi4" | "google-speech";

interface ModelSelectorProps {
  selectedModels: TranscriptionModel[];
  onModelChange: (models: TranscriptionModel[]) => void;
  disabled: boolean;
}

const ModelSelector = ({ selectedModels, onModelChange, disabled }: ModelSelectorProps) => {
  const handleModelToggle = (model: TranscriptionModel) => {
    try {
      if (selectedModels.includes(model)) {
        onModelChange(selectedModels.filter(m => m !== model));
      } else {
        onModelChange([...selectedModels, model]);
      }
    } catch (error) {
      console.error("Error toggling model:", error);
    }
  };

  const models: {id: TranscriptionModel, label: string}[] = [
    { id: "openai", label: "OpenAI Whisper" },
    { id: "gemini", label: "Google Gemini" },
    { id: "phi4", label: "Microsoft Phi-4" },
    { id: "google-speech", label: "Google Speech-to-Text" }
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
        {models.map(model => (
          <div key={model.id} className="flex items-center space-x-1.5">
            <Checkbox 
              id={model.id} 
              checked={selectedModels.includes(model.id)} 
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
