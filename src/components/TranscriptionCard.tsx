import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, Play, Pause, Info } from "lucide-react";
import { parseVTT } from "@/lib/vttParser";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLogsStore } from "@/lib/useLogsStore";

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
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const addLog = useLogsStore(state => state.addLog);
  
  // Debug log for tracking props
  useEffect(() => {
    console.log(`TranscriptionCard render for ${modelName}:`, { 
      hasContent: !!vttContent, 
      contentLength: vttContent?.length || 0,
      isLoading, 
      isSelected 
    });
    
    if (modelName.includes("Gemini")) {
      addLog(`Gemini card rendering with content: ${!!vttContent}`, "debug", {
        source: "TranscriptionCard",
        details: `Content length: ${vttContent?.length || 0}, Loading: ${isLoading}, Content sample: ${vttContent?.substring(0, 100) || 'empty'}`
      });
    }
  }, [vttContent, isLoading, modelName, addLog]);
  
  // Parse VTT content and log results for debugging
  const parseVttContent = () => {
    if (!vttContent || typeof vttContent !== 'string') {
      console.log(`${modelName}: No VTT content to parse`);
      return [];
    }
    
    try {
      const segments = parseVTT(vttContent);
      console.log(`${modelName}: Successfully parsed ${segments.length} VTT segments`);
      
      if (modelName.includes("Gemini") && segments.length === 0 && vttContent.length > 0) {
        addLog(`Gemini VTT parsing issue: content exists but no segments parsed`, "warning", {
          source: "TranscriptionCard",
          details: `VTT Content (first 200 chars): ${vttContent.substring(0, 200)}...`
        });
      }
      
      return segments;
    } catch (error) {
      console.error(`Error parsing VTT for ${modelName}:`, error);
      addLog(`Error parsing VTT for ${modelName}: ${error.message}`, "error", {
        source: "TranscriptionCard",
        details: error.stack
      });
      return [];
    }
  };
  
  const vttSegments = parseVttContent();
  
  // Setup audio element and event handling
  useEffect(() => {
    if (audioRef.current) {
      // Event listeners for tracking playback time and updating active segment
      const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        
        const currentTime = audioRef.current.currentTime;
        
        // Find the segment that corresponds to the current playback time
        const index = vttSegments.findIndex((segment) => {
          const startSeconds = parseTimeToSeconds(segment.startTime);
          const endSeconds = parseTimeToSeconds(segment.endTime);
          return currentTime >= startSeconds && currentTime <= endSeconds;
        });
        
        if (index !== -1) {
          setActiveSegment(index);
        } else {
          setActiveSegment(null);
        }
      };
      
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => {
        setIsPlaying(false);
        setActiveSegment(null);
      };
      
      // Add event listeners
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('play', handlePlay);
      audioRef.current.addEventListener('pause', handlePause);
      audioRef.current.addEventListener('ended', handleEnded);
      
      // Cleanup function
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
          audioRef.current.removeEventListener('play', handlePlay);
          audioRef.current.removeEventListener('pause', handlePause);
          audioRef.current.removeEventListener('ended', handleEnded);
        }
      };
    }
  }, [vttSegments]);
  
  const handleCopy = () => {
    if (vttContent) {
      navigator.clipboard.writeText(vttContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      addLog(`Copied ${modelName} transcription to clipboard`, "info", {
        source: "TranscriptionCard",
        details: `Content length: ${vttContent.length} characters`
      });
    }
  };
  
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };
  
  // Helper function to convert VTT timestamp to seconds
  const parseTimeToSeconds = (timeString: string): number => {
    if (!timeString) return 0;
    
    try {
      const [hours, minutes, seconds] = timeString.split(':').map(part => {
        if (part.includes('.')) {
          const [secs, ms] = part.split('.');
          return parseFloat(`${secs}.${ms}`);
        }
        return parseInt(part, 10);
      });
      
      return hours * 3600 + minutes * 60 + seconds;
    } catch (error) {
      console.error('Error parsing timestamp:', error);
      return 0;
    }
  };
  
  // Jump to a specific segment when clicked
  const jumpToSegment = (index: number) => {
    if (!audioRef.current || !vttSegments[index]) return;
    
    try {
      const startTime = parseTimeToSeconds(vttSegments[index].startTime);
      audioRef.current.currentTime = startTime;
      
      if (!isPlaying) {
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
        });
      }
    } catch (error) {
      console.error('Error jumping to segment:', error);
    }
  };

  // Determine the model color
  const getModelColor = () => {
    if (modelName.includes("OpenAI")) return "bg-blue-100 dark:bg-blue-950/30";
    if (modelName.includes("Gemini")) return "bg-green-100 dark:bg-green-950/30";
    if (modelName.includes("Phi-4")) return "bg-violet-100 dark:bg-violet-950/30";
    if (modelName.includes("Speech-to-Text")) return "bg-yellow-100 dark:bg-yellow-900/30";
    return "";
  };

  // Calculate word count with safety check
  const wordCount = vttContent && typeof vttContent === 'string'
    ? vttContent.split(/\s+/).filter(word => word.trim().length > 0).length 
    : 0;

  // Extra debugging for Gemini model
  useEffect(() => {
    if (modelName.includes("Gemini") && !isLoading && vttContent) {
      addLog(`Gemini card content update`, "debug", {
        source: "TranscriptionCard",
        details: `Word count: ${wordCount}, Segments: ${vttSegments.length}, Content sample: ${vttContent.substring(0, 100)}...`
      });
    }
  }, [modelName, vttContent, isLoading, wordCount, vttSegments.length, addLog]);

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
                    <div className="font-medium mb-1">Prompt Used:</div>
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
              <div 
                key={index} 
                className={`vtt-segment p-2 rounded-md mb-2 cursor-pointer transition-colors ${
                  activeSegment === index 
                    ? 'bg-primary/20 dark:bg-primary/40' 
                    : 'bg-muted/30 hover:bg-muted/50'
                }`}
                onClick={() => audioSrc && jumpToSegment(index)}
              >
                <div className="vtt-timestamp text-xs text-muted-foreground">{segment.startTime} → {segment.endTime}</div>
                <div className="vtt-content text-sm mt-1">{segment.text}</div>
              </div>
            ))}
          </div>
        ) : vttContent && vttContent.length > 0 ? (
          <div className="p-2">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-md mb-4 text-xs">
              <p className="font-medium">VTT parsing issue detected</p>
              <p className="mt-1">The transcription was received but couldn't be parsed into segments.</p>
            </div>
            <div className="vtt-content text-sm border border-dashed p-3 rounded-md max-h-[200px] overflow-y-auto">
              {vttContent}
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-full">
            <span className="text-4xl mb-2">📝</span>
            <span>No transcription available yet</span>
            {modelName.includes("Gemini") && (
              <span className="text-xs mt-2 px-2 py-1 bg-red-100 dark:bg-red-900/20 rounded-md">
                Check logs for Gemini transcription status
              </span>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex space-x-2">
          {audioSrc && (
            <>
              <audio ref={audioRef} src={audioSrc} />
              <Button size="sm" variant="outline" onClick={togglePlay} disabled={!vttContent}>
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
        <Button size="sm" onClick={onSelect} disabled={isLoading || !vttContent} variant={isSelected ? "secondary" : "default"}>
          {isSelected ? "Selected" : "Select"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TranscriptionCard;
