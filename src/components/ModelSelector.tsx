
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
    if (selectedModels.includes(model)) {
      onModelChange(selectedModels.filter(m => m !== model));
    } else {
      onModelChange([...selectedModels, model]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-x-2 gap-y-1">
        <div className="flex items-center space-x-1.5">
          <Checkbox 
            id="openai" 
            checked={selectedModels.includes("openai")} 
            onCheckedChange={() => handleModelToggle("openai")}
            disabled={disabled}
            className="h-3 w-3"
          />
          <Label htmlFor="openai" className={`text-xs ${disabled ? "text-muted-foreground" : ""}`}>
            OpenAI Whisper
          </Label>
        </div>
        <div className="flex items-center space-x-1.5">
          <Checkbox 
            id="gemini" 
            checked={selectedModels.includes("gemini")} 
            onCheckedChange={() => handleModelToggle("gemini")}
            disabled={disabled}
            className="h-3 w-3"
          />
          <Label htmlFor="gemini" className={`text-xs ${disabled ? "text-muted-foreground" : ""}`}>
            Google Gemini
          </Label>
        </div>
        <div className="flex items-center space-x-1.5">
          <Checkbox 
            id="phi4" 
            checked={selectedModels.includes("phi4")} 
            onCheckedChange={() => handleModelToggle("phi4")}
            disabled={disabled}
            className="h-3 w-3"
          />
          <Label htmlFor="phi4" className={`text-xs ${disabled ? "text-muted-foreground" : ""}`}>
            Microsoft Phi-4
          </Label>
        </div>
        <div className="flex items-center space-x-1.5">
          <Checkbox 
            id="google-speech" 
            checked={selectedModels.includes("google-speech")} 
            onCheckedChange={() => handleModelToggle("google-speech")}
            disabled={disabled}
            className="h-3 w-3" 
          />
          <Label htmlFor="google-speech" className={`text-xs ${disabled ? "text-muted-foreground" : ""}`}>
            Google Speech-to-Text
          </Label>
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;
