
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, Play, Pause } from "lucide-react";
import { useState, useRef } from "react";
import { parseVTT } from "@/lib/vttParser";

interface TranscriptionCardProps {
  modelName: string;
  vttContent: string;
  onSelect: () => void;
  isSelected: boolean;
  audioSrc?: string;
  isLoading?: boolean;
}

interface VTTSegment {
  startTime: string;
  endTime: string;
  text: string;
}

const TranscriptionCard = ({ 
  modelName, 
  vttContent, 
  onSelect, 
  isSelected,
  audioSrc,
  isLoading = false
}: TranscriptionCardProps) => {
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const vttSegments = parseVTT(vttContent);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(vttContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };

  // Determine the model color
  const getModelColor = () => {
    if (modelName.includes("OpenAI")) return "bg-blue-100";
    if (modelName.includes("Gemini")) return "bg-green-100";
    if (modelName.includes("Phi-4")) return "bg-violet-100";
    return "";
  };

  return (
    <Card className={`transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className={`pb-2 ${getModelColor()}`}>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{modelName}</CardTitle>
          <Badge variant={isSelected ? "default" : "outline"}>
            {isSelected ? "Selected" : "Not Selected"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className={`h-[300px] overflow-y-auto ${isLoading ? 'flex items-center justify-center' : ''}`}>
        {isLoading ? (
          <div className="text-center text-muted-foreground animate-pulse-opacity">
            Generating transcription...
          </div>
        ) : (
          <div className="space-y-1">
            {vttSegments.map((segment, index) => (
              <div key={index} className="vtt-segment">
                <div className="vtt-timestamp">{segment.startTime} → {segment.endTime}</div>
                <div className="vtt-content">{segment.text}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex space-x-2">
          {audioSrc && (
            <>
              <audio ref={audioRef} src={audioSrc} onEnded={() => setIsPlaying(false)} />
              <Button size="sm" variant="outline" onClick={togglePlay}>
                {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isPlaying ? "Pause" : "Play"}
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={handleCopy} disabled={isLoading}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <Button size="sm" onClick={onSelect} disabled={isLoading}>
          {isSelected ? "Selected" : "Select"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TranscriptionCard;
