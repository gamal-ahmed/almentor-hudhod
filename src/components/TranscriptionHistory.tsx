
import { useState, useEffect } from "react";
import { getUserTranscriptions } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileAudio, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/components/ui/use-toast";

interface TranscriptionHistoryProps {
  onLoadTranscription: (transcription: any) => void;
}

const TranscriptionHistory = ({ onLoadTranscription }: TranscriptionHistoryProps) => {
  const [transcriptions, setTranscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTranscriptions();
  }, []);

  const loadTranscriptions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getUserTranscriptions();
      setTranscriptions(data);
    } catch (error) {
      console.error("Error loading transcriptions:", error);
      setError("Failed to load transcriptions. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load your transcription history.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getModelDisplayName = (model: string) => {
    switch (model) {
      case "openai":
        return "OpenAI Whisper";
      case "gemini-2.0-flash":
        return "Gemini 2.0 Flash";
      case "phi4":
        return "Microsoft Phi-4";
      default:
        return model;
    }
  };

  const getModelColor = (model: string) => {
    switch (model) {
      case "openai":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "gemini-2.0-flash":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "phi4":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Loading your transcription history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-destructive mb-2">{error}</p>
        <Button variant="outline" size="sm" onClick={loadTranscriptions}>
          Try Again
        </Button>
      </div>
    );
  }

  if (transcriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <FileAudio className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No Transcription History</h3>
        <p className="text-muted-foreground max-w-md">
          You haven't created any transcriptions yet. Upload an audio file and generate transcriptions to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {transcriptions.map((transcription) => (
          <Card key={transcription.id} className="h-full">
            <CardContent className="p-4">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <Badge variant="outline" className={`${getModelColor(transcription.model)}`}>
                      {getModelDisplayName(transcription.model)}
                    </Badge>
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDistanceToNow(new Date(transcription.created_at), { addSuffix: true })}
                  </div>
                </div>
                
                <div className="mb-3">
                  <h3 className="text-sm font-medium mb-1 truncate">
                    <FileAudio className="h-3 w-3 mr-1 inline" />
                    {transcription.file_path || "Untitled"}
                  </h3>
                  
                  <div className="bg-gray-50 dark:bg-gray-900/30 p-2 rounded text-xs max-h-24 overflow-y-auto">
                    {transcription.result?.vttContent ? (
                      <div className="whitespace-pre-line line-clamp-3">
                        {transcription.result.vttContent
                          .replace(/WEBVTT\n\n/g, '')
                          .replace(/\d\d:\d\d:\d\d\.\d\d\d --> \d\d:\d\d:\d\d\.\d\d\d\n/g, '')
                          .substring(0, 150)}
                        {transcription.result.vttContent.length > 150 ? '...' : ''}
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">No content available</span>
                    )}
                  </div>
                </div>
                
                <div className="mt-auto pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full" 
                    onClick={() => onLoadTranscription(transcription)}
                  >
                    Load Transcription
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TranscriptionHistory;
