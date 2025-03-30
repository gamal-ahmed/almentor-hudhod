
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, Play, Pause, Info } from "lucide-react";
import { useState, useRef } from "react";
import { parseVTT } from "@/lib/vttParser";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TranscriptionCardProps {
  modelName: string;
  vttContent: string;
  prompt?: string;
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
  vttContent = "", // Provide default empty string to prevent undefined
  prompt = "",
  onSelect, 
  isSelected,
  audioSrc,
  isLoading = false
}: TranscriptionCardProps) => {
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Only attempt to parse VTT if vttContent is not empty
  const vttSegments = vttContent ? parseVTT(vttContent) : [];
  
  const handleCopy = () => {
    if (vttContent) {
      navigator.clipboard.writeText(vttContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
    if (modelName.includes("OpenAI")) return "bg-blue-100 dark:bg-blue-950/30";
    if (modelName.includes("Gemini")) return "bg-green-100 dark:bg-green-950/30";
    if (modelName.includes("Phi-4")) return "bg-violet-100 dark:bg-violet-950/30";
    return "";
  };

  // Calculate word count
  const wordCount = vttContent 
    ? vttContent.split(/\s+/).filter(word => word.trim().length > 0).length 
    : 0;

  return (
    <Card className={`transition-all ${isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}`}>
      <CardHeader className={`pb-2 ${getModelColor()}`}>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            {modelName}
            {prompt && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="font-medium mb-1">Prompt:</div>
                    <div className="text-xs">{prompt}</div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </CardTitle>
          <Badge variant={isSelected ? "default" : "outline"}>
            {isSelected ? "Selected" : "Not Selected"}
          </Badge>
        </div>
        {!isLoading && vttContent && (
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{wordCount} words</span>
            <span>{vttSegments.length} segments</span>
          </div>
        )}
      </CardHeader>
      <CardContent className={`h-[300px] overflow-y-auto ${isLoading ? 'flex items-center justify-center' : ''}`}>
        {isLoading ? (
          <div className="text-center text-muted-foreground animate-pulse-opacity">
            Generating transcription...
          </div>
        ) : vttSegments.length > 0 ? (
          <div className="space-y-1">
            {vttSegments.map((segment, index) => (
              <div key={index} className="vtt-segment p-2 rounded-md bg-muted/30 mb-2">
                <div className="vtt-timestamp text-xs text-muted-foreground">{segment.startTime} → {segment.endTime}</div>
                <div className="vtt-content text-sm mt-1">{segment.text}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-full">
            <span className="text-4xl mb-2">📝</span>
            <span>No transcription available yet</span>
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
          <Button size="sm" variant="outline" onClick={handleCopy} disabled={isLoading || !vttContent}>
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <Button size="sm" onClick={onSelect} disabled={isLoading} variant={isSelected ? "secondary" : "default"}>
          {isSelected ? "Selected" : "Select"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TranscriptionCard;
