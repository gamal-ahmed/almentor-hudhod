
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
    <div className="space-y-4">
      <h3 className="font-medium">Select Transcription Models</h3>
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="openai" 
            checked={selectedModels.includes("openai")} 
            onCheckedChange={() => handleModelToggle("openai")}
            disabled={disabled}
          />
          <Label htmlFor="openai" className={disabled ? "text-muted-foreground" : ""}>
            OpenAI Whisper
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="gemini" 
            checked={selectedModels.includes("gemini")} 
            onCheckedChange={() => handleModelToggle("gemini")}
            disabled={disabled}
          />
          <Label htmlFor="gemini" className={disabled ? "text-muted-foreground" : ""}>
            Google Gemini 2.0 Flash
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="phi4" 
            checked={selectedModels.includes("phi4")} 
            onCheckedChange={() => handleModelToggle("phi4")}
            disabled={disabled}
          />
          <Label htmlFor="phi4" className={disabled ? "text-muted-foreground" : ""}>
            Microsoft Phi-4 Multimodal
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="google-speech" 
            checked={selectedModels.includes("google-speech")} 
            onCheckedChange={() => handleModelToggle("google-speech")}
            disabled={disabled}
          />
          <Label htmlFor="google-speech" className={disabled ? "text-muted-foreground" : ""}>
            Google Speech-to-Text
          </Label>
        </div>
      </div>
    </div>
  );
};

export default ModelSelector;
