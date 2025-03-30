
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell } from "lucide-react";

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
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="preserveEnglish"
          checked={preserveEnglish}
          onCheckedChange={(checked) => onPreserveEnglishChange(checked as boolean)}
          disabled={disabled}
        />
        <Label htmlFor="preserveEnglish" className="cursor-pointer">
          Preserve all English words exactly as spoken
        </Label>
      </div>
      
      <div className="flex flex-col space-y-2">
        <Label htmlFor="outputFormat">Output Format</Label>
        <Select
          value={outputFormat}
          onValueChange={(value) => onOutputFormatChange(value as "vtt" | "plain")}
          disabled={disabled}
        >
          <SelectTrigger id="outputFormat" className="w-full">
            <SelectValue placeholder="Select format" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vtt">VTT with timestamps</SelectItem>
            <SelectItem value="plain">Plain text</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-gray-800">
        <Checkbox
          id="notifications"
          checked={notificationsEnabled}
          onCheckedChange={(checked) => onNotificationsChange(checked as boolean)}
          disabled={disabled}
        />
        <Label htmlFor="notifications" className="cursor-pointer flex items-center">
          <Bell className="h-4 w-4 mr-2 text-amber-500" />
          Enable browser notifications
        </Label>
      </div>
    </div>
  );
};

export default PromptOptions;
