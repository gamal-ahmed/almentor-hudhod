
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, Play, Pause, Info, Volume2, VolumeX, FastForward, Rewind } from "lucide-react";
import { parseVTT } from "@/lib/vttParser";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLogsStore } from "@/lib/useLogsStore";
import { Slider } from "@/components/ui/slider";

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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioLoaded, setIsAudioLoaded] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const addLog = useLogsStore(state => state.addLog);
  
  // Debug log for tracking props
  useEffect(() => {
    console.log(`TranscriptionCard render for ${modelName}:`, { 
      hasContent: !!vttContent, 
      contentLength: vttContent?.length || 0,
      isLoading, 
      isSelected,
      hasAudio: !!audioSrc
    });
    
    if (modelName.includes("Gemini")) {
      addLog(`Gemini card rendering with content: ${!!vttContent}`, "debug", {
        source: "TranscriptionCard",
        details: `Content length: ${vttContent?.length || 0}, Loading: ${isLoading}, Content sample: ${vttContent?.substring(0, 100) || 'empty'}`
      });
    }
  }, [vttContent, isLoading, modelName, addLog, audioSrc]);
  
  // Parse VTT content and log results for debugging
  const parseVttContent = () => {
    if (!vttContent || typeof vttContent !== 'string') {
      console.log(`${modelName}: No VTT content to parse`);
      return [];
    }
    
    try {
      // First attempt normal VTT parsing
      let segments = parseVTT(vttContent);
      
      // Special handling for Gemini which may return malformed VTT
      if (segments.length === 0 && vttContent.length > 0 && modelName.includes("Gemini")) {
        addLog(`Gemini VTT parsing issue: attempting fallback parsing`, "warning", {
          source: "TranscriptionCard",
          details: `VTT Content (first 200 chars): ${vttContent.substring(0, 200)}...`
        });
        
        // Fallback: Try to extract text manually from the VTT content
        // Some Gemini responses might not be properly formatted VTT
        const lines = vttContent.split('\n');
        let isInCue = false;
        let currentCue = { startTime: "00:00:00.000", endTime: "00:05:00.000", text: "" };
        
        for (const line of lines) {
          if (line.includes('-->')) {
            isInCue = true;
            const timeParts = line.split('-->').map(t => t.trim());
            if (timeParts.length === 2) {
              currentCue.startTime = timeParts[0];
              currentCue.endTime = timeParts[1];
            }
          } else if (line.trim() === '' && isInCue) {
            if (currentCue.text) {
              segments.push({ ...currentCue });
              currentCue = { startTime: "00:00:00.000", endTime: "00:05:00.000", text: "" };
            }
            isInCue = false;
          } else if (isInCue && line.trim() !== 'WEBVTT') {
            currentCue.text += (currentCue.text ? ' ' : '') + line;
          }
        }
        
        // Add the last segment if there's text
        if (currentCue.text) {
          segments.push(currentCue);
        }
        
        // If fallback parsing didn't work, create a single segment with all content
        if (segments.length === 0) {
          addLog(`Gemini fallback parsing failed: creating single segment with all content`, "warning", {
            source: "TranscriptionCard"
          });
          
          segments = [{
            startTime: "00:00:00.000",
            endTime: "00:10:00.000",
            text: vttContent.replace('WEBVTT', '').trim()
          }];
        }
      }
      
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
      
      // Return a single segment with the raw content as a fallback
      if (vttContent && vttContent.length > 0) {
        return [{
          startTime: "00:00:00.000",
          endTime: "00:10:00.000",
          text: vttContent.replace('WEBVTT', '').trim()
        }];
      }
      
      return [];
    }
  };
  
  const vttSegments = parseVttContent();
  
  // Setup audio element and event handling
  useEffect(() => {
    if (!audioRef.current) return;
    
    // Event listeners for tracking playback time and updating active segment
    const handleTimeUpdate = () => {
      if (!audioRef.current) return;
      
      const currentTime = audioRef.current.currentTime;
      setCurrentTime(currentTime);
      
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
      setCurrentTime(0);
      
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    };
    
    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
        setIsAudioLoaded(true);
      }
    };
    
    // Add event listeners
    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('play', handlePlay);
    audioRef.current.addEventListener('pause', handlePause);
    audioRef.current.addEventListener('ended', handleEnded);
    audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('play', handlePlay);
        audioRef.current.removeEventListener('pause', handlePause);
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
      }
    };
  }, [vttSegments]);
  
  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);
  
  // Format time for display (MM:SS)
  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
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
      audioRef.current.play().catch(err => {
        console.error('Error playing audio:', err);
        addLog(`Error playing audio: ${err.message}`, "error", {
          source: "TranscriptionCard",
          details: err.stack
        });
      });
    }
  };
  
  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    
    const newTime = value[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };
  
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (isMuted && volume === 0) {
      setVolume(0.5);
    }
  };
  
  const jumpForward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
  };
  
  const jumpBackward = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
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
      
      // Log debugging information for Gemini model
      if (modelName.includes("Gemini")) {
        addLog(`Gemini segment click - attempting to jump to timestamp`, "debug", {
          source: "TranscriptionCard",
          details: `Segment index: ${index}, Start time: ${vttSegments[index].startTime}, Seconds: ${startTime}, Audio element exists: ${!!audioRef.current}`
        });
      }
      
      // Set the current time
      audioRef.current.currentTime = startTime;
      
      // Start playing if not already playing
      if (!isPlaying) {
        audioRef.current.play().catch(error => {
          console.error('Error playing audio:', error);
          addLog(`Error playing audio after segment click: ${error.message}`, "error", {
            source: "TranscriptionCard"
          });
        });
      }
    } catch (error) {
      console.error('Error jumping to segment:', error);
      addLog(`Error jumping to segment: ${error.message}`, "error", {
        source: "TranscriptionCard",
        details: error.stack
      });
    }
  };

  // Play individual segment
  const playSegment = (index: number) => {
    if (!audioRef.current || !vttSegments[index]) return;
    
    try {
      const startTime = parseTimeToSeconds(vttSegments[index].startTime);
      const endTime = parseTimeToSeconds(vttSegments[index].endTime);
      
      // Set the current time
      audioRef.current.currentTime = startTime;
      
      // Start playing
      audioRef.current.play().catch(error => {
        console.error('Error playing audio segment:', error);
      });
      
      // Set up a timer to pause at the end of the segment
      const duration = endTime - startTime;
      setTimeout(() => {
        if (audioRef.current && audioRef.current.currentTime >= endTime) {
          audioRef.current.pause();
        }
      }, duration * 1000);
      
      addLog(`Playing segment ${index + 1}`, "debug", {
        source: "TranscriptionCard",
        details: `Start: ${vttSegments[index].startTime}, End: ${vttSegments[index].endTime}`
      });
    } catch (error) {
      console.error('Error playing segment:', error);
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
                className={`vtt-segment p-2 rounded-md mb-2 transition-colors ${
                  activeSegment === index 
                    ? 'bg-primary/20 dark:bg-primary/40' 
                    : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="vtt-timestamp text-xs text-muted-foreground">{segment.startTime} → {segment.endTime}</div>
                  {audioSrc && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={(e) => {
                        e.stopPropagation();
                        playSegment(index);
                      }}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div 
                  className="vtt-content text-sm mt-1 cursor-pointer" 
                  onClick={() => {
                    console.log(`Segment clicked: ${index}, Has audio: ${!!audioSrc}`);
                    if (audioSrc) jumpToSegment(index);
                  }}
                >
                  {segment.text}
                </div>
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
      
      {audioSrc && (
        <div className={`px-6 pt-2 pb-0 border-t ${showAudioPlayer ? '' : 'hidden'}`}>
          <div className="audio-player space-y-2">
            <audio ref={audioRef} src={audioSrc} preload="metadata" />
            
            <div className="flex items-center justify-between space-x-2">
              <div className="text-xs text-muted-foreground w-10">{formatTime(currentTime)}</div>
              
              <div className="flex-1">
                <Slider
                  value={[currentTime]}
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  disabled={!isAudioLoaded}
                  className="cursor-pointer"
                />
              </div>
              
              <div className="text-xs text-muted-foreground w-10">{formatTime(duration)}</div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="h-8 w-8"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                
                <div className="w-20">
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={jumpBackward}
                  className="h-8 w-8"
                  disabled={!isAudioLoaded}
                >
                  <Rewind className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={togglePlay}
                  className="h-10 w-10 rounded-full"
                  disabled={!isAudioLoaded}
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={jumpForward}
                  className="h-8 w-8"
                  disabled={!isAudioLoaded}
                >
                  <FastForward className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="w-24"></div> {/* Placeholder for balance */}
            </div>
          </div>
        </div>
      )}
      
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="flex space-x-2">
          {audioSrc && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowAudioPlayer(!showAudioPlayer)}
            >
              {showAudioPlayer ? "Hide Player" : "Show Player"}
            </Button>
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
