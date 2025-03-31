
import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Bell, FileText, FileJson, InfoIcon } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface PromptOptionsProps {
  preserveEnglish: boolean;
  onPreserveEnglishChange: (checked: boolean) => void;
  outputFormat: "vtt" | "plain";
  onOutputFormatChange: (format: "vtt" | "plain") => void;
  notificationsEnabled: boolean;
  onNotificationsChange: (enabled: boolean) => void;
  disabled?: boolean;
}

const PromptOptions = ({
  preserveEnglish,
  onPreserveEnglishChange,
  outputFormat,
  onOutputFormatChange,
  notificationsEnabled,
  onNotificationsChange,
  disabled = false
}: PromptOptionsProps) => {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Transcription Settings</h4>
          <HoverCard>
            <HoverCardTrigger>
              <InfoIcon className="h-4 w-4 text-muted-foreground cursor-help" />
            </HoverCardTrigger>
            <HoverCardContent className="w-72">
              <p className="text-xs">
                These settings affect how the AI models process your audio and format the results.
                Adjust them to improve accuracy for your specific content.
              </p>
            </HoverCardContent>
          </HoverCard>
        </div>
        <div className="flex items-start space-x-2 p-2 rounded-md bg-background border border-border/40">
          <Checkbox
            id="preserveEnglish"
            checked={preserveEnglish}
            onCheckedChange={(checked) => onPreserveEnglishChange(checked as boolean)}
            disabled={disabled}
            className="mt-0.5"
          />
          <div className="space-y-1">
            <Label htmlFor="preserveEnglish" className="text-sm cursor-pointer">
              Preserve all English words exactly as spoken
            </Label>
            <p className="text-xs text-muted-foreground">
              Helps maintain accuracy for names, technical terms, and acronyms
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Output Format</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className={`flex items-start space-x-2 p-2 rounded-md border ${outputFormat === "vtt" ? "bg-primary/5 border-primary/20" : "bg-background border-border/40"}`}>
            <Checkbox
              id="vttFormat"
              checked={outputFormat === "vtt"}
              onCheckedChange={(checked) => 
                checked ? onOutputFormatChange("vtt") : null
              }
              disabled={disabled || outputFormat === "vtt"}
              className="mt-0.5"
            />
            <div className="space-y-1">
              <Label htmlFor="vttFormat" className="text-sm cursor-pointer flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
                VTT Format
              </Label>
              <p className="text-xs text-muted-foreground">
                Includes timestamps for each segment
              </p>
            </div>
          </div>
          
          <div className={`flex items-start space-x-2 p-2 rounded-md border ${outputFormat === "plain" ? "bg-primary/5 border-primary/20" : "bg-background border-border/40"}`}>
            <Checkbox
              id="plainFormat"
              checked={outputFormat === "plain"}
              onCheckedChange={(checked) => 
                checked ? onOutputFormatChange("plain") : null
              }
              disabled={disabled || outputFormat === "plain"}
              className="mt-0.5"
            />
            <div className="space-y-1">
              <Label htmlFor="plainFormat" className="text-sm cursor-pointer flex items-center gap-1.5">
                <FileJson className="h-3.5 w-3.5 text-primary" />
                Plain Text
              </Label>
              <p className="text-xs text-muted-foreground">
                Simple text without timestamps
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-border/40">
        <div className="flex items-start space-x-2 p-2 rounded-md bg-amber-500/5 border border-amber-500/20">
          <Checkbox
            id="notifications"
            checked={notificationsEnabled}
            onCheckedChange={(checked) => onNotificationsChange(checked as boolean)}
            disabled={disabled}
            className="mt-0.5"
          />
          <div className="space-y-1">
            <Label htmlFor="notifications" className="text-sm cursor-pointer flex items-center">
              <Bell className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
              Enable browser notifications
            </Label>
            <p className="text-xs text-muted-foreground">
              Get notified when transcriptions are complete
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptOptions;
