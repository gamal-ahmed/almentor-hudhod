
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';

export interface PromptOptionsProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  disabled?: boolean;
  // Make these props optional
  preserveEnglish?: boolean;
  onPreserveEnglishChange?: (checked: boolean) => void;
  outputFormat?: "vtt" | "plain";
  onOutputFormatChange?: (format: "vtt" | "plain") => void;
  notificationsEnabled?: boolean;
  onNotificationsChange?: (enabled: boolean) => void;
}

const PromptOptions: React.FC<PromptOptionsProps> = ({ 
  prompt, 
  onPromptChange, 
  disabled = false,
  preserveEnglish,
  onPreserveEnglishChange,
  outputFormat,
  onOutputFormatChange,
  notificationsEnabled,
  onNotificationsChange
}) => {
  // Sample prompts that can help improve transcription
  const samplePrompts = [
    "This is a technical discussion about software engineering.",
    "This is a medical consultation with terminology related to cardiology.",
    "This audio contains legal terminology related to corporate law.",
    "This is a financial discussion with investment terminology.",
    "This lecture is about quantum physics and contains scientific terms."
  ];

  const handleSamplePromptClick = (samplePrompt: string) => {
    onPromptChange(samplePrompt);
  };

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="Add context to improve transcription accuracy..."
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        disabled={disabled}
        className="min-h-[80px] resize-y"
      />
      
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Wand2 className="h-3 w-3" />
          <span>Sample prompts to improve accuracy:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {samplePrompts.map((samplePrompt, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-xs h-7 font-normal"
              onClick={() => handleSamplePromptClick(samplePrompt)}
              disabled={disabled}
            >
              {samplePrompt.length > 30 ? samplePrompt.substring(0, 30) + '...' : samplePrompt}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromptOptions;
