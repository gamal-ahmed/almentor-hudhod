
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Send, AlertCircle } from "lucide-react";
import TranscriptionCard from "@/components/TranscriptionCard";
import TranscriptionJobs from "@/components/TranscriptionJobs";
import VideoIdInput from "@/components/VideoIdInput";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import LogsPanel from "@/components/LogsPanel";
import { useLogsStore } from "@/lib/useLogsStore";
import { addCaptionToBrightcove, fetchBrightcoveKeys, getBrightcoveAuthToken } from "@/lib/api";

interface ResultsPublishStepProps {
  selectedTranscription: string | null;
  selectedModel: string | null;
  videoId: string;
  setVideoId: (id: string) => void;
  handleSelectTranscription: (vtt: string, model: string) => void;
  isPublishing: boolean;
  setIsPublishing: (isPublishing: boolean) => void;
  refreshJobsTrigger: number;
  file: File | null;
  audioUrl: string | null;
  goToPreviousStep: () => void;
  selectedModels: string[];
  transcriptions: Record<string, { vtt: string; prompt: string; loading: boolean; }>;
}

const ResultsPublishStep: React.FC<ResultsPublishStepProps> = ({
  selectedTranscription,
  selectedModel,
  videoId,
  setVideoId,
  handleSelectTranscription,
  isPublishing,
  setIsPublishing,
  refreshJobsTrigger,
  file,
  audioUrl,
  goToPreviousStep,
  selectedModels,
  transcriptions,
}) => {
  const { toast } = useToast();
  const { logs, addLog, startTimedLog } = useLogsStore();

  // Publish caption to Brightcove
  const publishCaption = async () => {
    if (!selectedTranscription || !videoId) {
      toast({
        title: "Missing Information",
        description: "Please select a transcription and enter a video ID.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsPublishing(true);
      const publishLog = startTimedLog("Caption Publishing", "info", "Brightcove");
      
      publishLog.update(`Preparing caption for video ID: ${videoId}`);
      
      const credentialsLog = startTimedLog("Brightcove Authentication", "info", "Brightcove API");
      
      let brightcoveKeys;
      try {
        brightcoveKeys = await fetchBrightcoveKeys();
        credentialsLog.update("Retrieving Brightcove auth token...");
        
        const authToken = await getBrightcoveAuthToken(
          brightcoveKeys.brightcove_client_id,
          brightcoveKeys.brightcove_client_secret
        );
        
        credentialsLog.complete("Brightcove authentication successful", 
          `Account ID: ${brightcoveKeys.brightcove_account_id} | Token obtained`);
        
        publishLog.update(`Adding caption to Brightcove video ID: ${videoId}`);
        
        await addCaptionToBrightcove(
          videoId,
          selectedTranscription,
          'ar',
          'Arabic',
          brightcoveKeys.brightcove_account_id,
          authToken
        );
        
        publishLog.complete(
          "Caption published successfully", 
          `Video ID: ${videoId} | Language: Arabic`
        );
        
        toast({
          title: "Caption Published",
          description: "Your caption has been successfully published to the Brightcove video.",
        });
      } catch (error) {
        credentialsLog.error("Brightcove authentication failed", error instanceof Error ? error.message : String(error));
        publishLog.error("Caption publishing failed", error instanceof Error ? error.message : String(error));
        throw error;
      }
    } catch (error) {
      console.error("Error publishing caption:", error);
      addLog(`Error publishing caption`, "error", {
        details: error instanceof Error ? error.message : String(error),
        source: "Brightcove"
      });
      
      toast({
        title: "Publishing Failed",
        description: "There was a problem publishing your caption.",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousStep}
          className="flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Upload
        </Button>
        
        {file && (
          <div className="text-sm bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full flex items-center">
            <span className="font-medium mr-1">Current file:</span>
            <span className="truncate max-w-[200px]">{file.name}</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Publishing Panel - Left */}
        <Card className={`md:col-span-1 p-5 border-l-4 ${selectedTranscription ? 'border-l-amber-500' : 'border-l-gray-300'} shadow-md transition-colors duration-300 ${!selectedTranscription ? 'opacity-90' : ''}`}>
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Send className={`mr-2 h-5 w-5 ${selectedTranscription ? 'text-amber-500' : 'text-gray-400'}`} />
            Publish to Brightcove
          </h2>
          
          {!selectedTranscription && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md mb-4 text-sm flex items-start">
              <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <p>Select a transcription from the transcription jobs or results tab to continue.</p>
            </div>
          )}
          
          <div className="space-y-4">
            <VideoIdInput 
              videoId={videoId} 
              onChange={setVideoId}
              disabled={isPublishing || !selectedTranscription}
            />
            
            <Button 
              onClick={publishCaption} 
              disabled={isPublishing || !selectedTranscription || !videoId}
              className={`w-full ${selectedTranscription 
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700' 
                : 'bg-gray-200 dark:bg-gray-700'}`}
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Publish Caption
                </>
              )}
            </Button>
            
            {selectedTranscription && selectedModel && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md text-sm">
                <p className="font-medium">Selected Transcription:</p>
                <p className="text-muted-foreground mt-1">
                  {selectedModel === "openai" 
                    ? "OpenAI Whisper" 
                    : selectedModel === "gemini-2.0-flash" 
                      ? "Gemini 2.0 Flash" 
                      : "Microsoft Phi-4"}
                </p>
                <p className="mt-2 font-medium">Transcription Length:</p>
                <p className="text-muted-foreground">{selectedTranscription.length} characters</p>
              </div>
            )}
          </div>
        </Card>
        
        {/* Transcription Results - Right */}
        <div className="md:col-span-3">
          <Tabs defaultValue="jobs" className="w-full">
            <TabsList className="mb-2">
              <TabsTrigger value="jobs">Background Jobs</TabsTrigger>
              <TabsTrigger value="results">Direct Results</TabsTrigger>
              <TabsTrigger value="logs">System Logs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="jobs" className="space-y-3">
              <TranscriptionJobs 
                onSelectTranscription={handleSelectTranscription}
                refreshTrigger={refreshJobsTrigger}
              />
            </TabsContent>
            
            <TabsContent value="results" className="space-y-3">
              <h2 className="text-xl font-semibold mb-4">Direct Transcription Results</h2>
              
              {selectedModels.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {selectedModels.map((model) => {
                    const transcription = transcriptions[model] || { vtt: "", prompt: "", loading: false };
                    
                    return (
                      <TranscriptionCard
                        key={model}
                        modelName={
                          model === "openai" 
                            ? "OpenAI Whisper" 
                            : model === "gemini-2.0-flash" 
                              ? "Gemini 2.0 Flash" 
                              : "Microsoft Phi-4"
                        }
                        vttContent={transcription.vtt}
                        prompt={transcription.prompt}
                        onSelect={() => handleSelectTranscription(transcription.vtt, model)}
                        isSelected={selectedModel === model}
                        audioSrc={audioUrl || undefined}
                        isLoading={transcription.loading}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <p className="text-muted-foreground">No transcription models were selected.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="logs" className="space-y-3">
              <h2 className="text-xl font-semibold mb-4">System Logs</h2>
              <div className="h-[400px]">
                <LogsPanel logs={logs} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ResultsPublishStep;
