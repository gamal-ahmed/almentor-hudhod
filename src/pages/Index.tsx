import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "@/hooks/use-toast";
import { ChevronDown, ChevronUp, FileAudio, Upload, Loader2, Check, Copy, Download, RefreshCw, Video } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import ModelSelector from "@/components/ModelSelector";
import PromptOptions from "@/components/PromptOptions";
import TranscriptionCard from "@/components/TranscriptionCard";
import { transcribeAudio } from "@/lib/api";
import { TranscriptionModel } from "@/components/ModelSelector";
import { DEFAULT_TRANSCRIPTION_PROMPT } from "@/lib/phi4TranscriptionService";

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedModels, setSelectedModels] = useState<TranscriptionModel[]>(["openai", "phi4"]);
  const [transcriptionResults, setTranscriptionResults] = useState<Record<string, { vttContent: string; prompt: string }>>({});
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [preserveEnglish, setPreserveEnglish] = useState(true);
  const [outputFormat, setOutputFormat] = useState<"vtt" | "plain">("vtt");
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState(DEFAULT_TRANSCRIPTION_PROMPT);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Request notification permission if enabled
  useEffect(() => {
    if (notificationsEnabled && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [notificationsEnabled]);

  // Clean up audio URL when component unmounts
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleFileUpload = (uploadedFile: File) => {
    // Clean up previous audio URL if it exists
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setFile(uploadedFile);
    setAudioUrl(URL.createObjectURL(uploadedFile));
    setTranscriptionResults({});
    setSelectedResult(null);
  };

  const handleTranscribe = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please upload an audio file first",
        variant: "destructive",
      });
      return;
    }

    if (selectedModels.length === 0) {
      toast({
        title: "No models selected",
        description: "Please select at least one transcription model",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const newResults = { ...transcriptionResults };
    
    try {
      // Process each selected model
      for (const model of selectedModels) {
        try {
          const prompt = preserveEnglish ? customPrompt : "";
          const result = await transcribeAudio(file, model, prompt);
          
          // Store the result
          newResults[model] = result;
          setTranscriptionResults({ ...newResults });
          
          // Set as selected result if it's the first one or if there's no selection yet
          if (!selectedResult) {
            setSelectedResult(model);
          }
          
          // Show notification if enabled
          if (notificationsEnabled && Notification.permission === "granted") {
            new Notification("Transcription Complete", {
              body: `${getModelDisplayName(model)} transcription is ready!`,
              icon: "/favicon.ico"
            });
          }
        } catch (error) {
          console.error(`Error transcribing with ${model}:`, error);
          toast({
            title: `${getModelDisplayName(model)} transcription failed`,
            description: error instanceof Error ? error.message : "An unknown error occurred",
            variant: "destructive",
          });
        }
      }
    } finally {
      setIsUploading(false);
    }
  };

  const getModelDisplayName = (model: string): string => {
    switch (model) {
      case "openai":
        return "OpenAI Whisper";
      case "gemini":
        return "Google Gemini 2.0 Flash";
      case "phi4":
        return "Microsoft Phi-4 Multimodal";
      default:
        return model;
    }
  };

  const handleCopySelected = () => {
    if (!selectedResult || !transcriptionResults[selectedResult]) return;
    
    navigator.clipboard.writeText(transcriptionResults[selectedResult].vttContent);
    toast({
      title: "Copied to clipboard",
      description: "The transcription has been copied to your clipboard",
    });
  };

  const handleDownloadSelected = () => {
    if (!selectedResult || !transcriptionResults[selectedResult] || !file) return;
    
    const vttContent = transcriptionResults[selectedResult].vttContent;
    const blob = new Blob([vttContent], { type: "text/vtt" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file.name.replace(/\.[^/.]+$/, "")}.vtt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setFile(null);
    setAudioUrl(null);
    setTranscriptionResults({});
    setSelectedResult(null);
  };

  return (
    <div className="container">
      <div className="flex justify-between items-center py-4 border-b mb-8">
        <h1 className="text-2xl font-bold">Media Transcription Tools</h1>
        <nav className="flex gap-4">
          <a href="/" className="font-medium hover:text-primary">Home</a>
          <a href="/video-transcribe" className="font-medium hover:text-primary">Video Transcribe</a>
        </nav>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileAudio className="mr-2 h-5 w-5" />
                Audio File
              </CardTitle>
              <CardDescription>
                Upload an MP3 file to transcribe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload onFileUpload={handleFileUpload} isUploading={isUploading} />
              
              {file && (
                <div className="mt-4">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  
                  {audioUrl && (
                    <audio controls className="w-full mt-2">
                      <source src={audioUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Transcription Options</CardTitle>
              <CardDescription>
                Select models and customize settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ModelSelector 
                selectedModels={selectedModels} 
                onModelChange={setSelectedModels} 
                disabled={isUploading}
              />
              
              <PromptOptions
                preserveEnglish={preserveEnglish}
                onPreserveEnglishChange={setPreserveEnglish}
                outputFormat={outputFormat}
                onOutputFormatChange={setOutputFormat}
                notificationsEnabled={notificationsEnabled}
                onNotificationsChange={setNotificationsEnabled}
                disabled={isUploading}
              />
              
              <Collapsible 
                open={showAdvancedOptions} 
                onOpenChange={setShowAdvancedOptions}
                className="border rounded-md p-2"
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="flex w-full justify-between p-2 h-auto">
                    <span>Advanced Options</span>
                    {showAdvancedOptions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="px-2 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="customPrompt">Custom Prompt</Label>
                    <Textarea 
                      id="customPrompt" 
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Enter custom transcription prompt..."
                      disabled={!preserveEnglish || isUploading}
                      className="min-h-[80px]"
                    />
                    <p className="text-xs text-muted-foreground">
                      Customize the prompt sent to the transcription model
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                className="w-full" 
                onClick={handleTranscribe} 
                disabled={!file || isUploading || selectedModels.length === 0}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Transcribe Audio
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleReset}
                disabled={!file || isUploading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Transcription Results</CardTitle>
              <CardDescription>
                Compare results from different models
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(transcriptionResults).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(transcriptionResults).map(([model, result]) => (
                    <TranscriptionCard
                      key={model}
                      modelName={getModelDisplayName(model)}
                      vttContent={result.vttContent}
                      prompt={result.prompt}
                      onSelect={() => setSelectedResult(model)}
                      isSelected={selectedResult === model}
                      audioSrc={audioUrl || undefined}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-center">
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                      <p className="text-lg font-medium">Transcribing your audio...</p>
                      <p className="text-sm text-muted-foreground mt-2">This may take a few minutes depending on the file size.</p>
                    </div>
                  ) : file ? (
                    <div className="flex flex-col items-center">
                      <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">Ready to transcribe</p>
                      <p className="text-sm text-muted-foreground mt-2">Click the "Transcribe Audio" button to start.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <FileAudio className="h-10 w-10 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">No transcription yet</p>
                      <p className="text-sm text-muted-foreground mt-2">Upload an audio file to get started.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={handleCopySelected}
                disabled={!selectedResult}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Selected
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadSelected}
                disabled={!selectedResult}
              >
                <Download className="mr-2 h-4 w-4" />
                Download VTT
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Audio Transcription</CardTitle>
            <CardDescription>
              Transcribe audio files to text using multiple AI models
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Upload MP3 files and transcribe them using OpenAI, Google Gemini, or Microsoft Phi-4 models.</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <a href="/">Get Started</a>
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Video Transcription</CardTitle>
            <CardDescription>
              Extract and transcribe audio from video files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Upload video files and transcribe their audio content using Google's Speech-to-Text API.</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <a href="/video-transcribe">Get Started</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Index;
