
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VideoIdInputProps {
  videoId: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

const VideoIdInput = ({ videoId, onChange, disabled = false }: VideoIdInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="videoId">Brightcove Video ID</Label>
      <Input
        id="videoId"
        placeholder="Enter Brightcove video ID"
        value={videoId}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="shadow-inner-soft focus:ring-2 focus:ring-primary/30"
      />
      <p className="text-xs text-muted-foreground">
        Enter the ID of the Brightcove video where you want to publish the caption.
      </p>
    </div>
  );
};

export default VideoIdInput;
