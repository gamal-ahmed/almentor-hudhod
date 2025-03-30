import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { FileAudio, Upload, Download, Plus, Loader2, X, Copy, CheckCircle, Sun, Moon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useLogsStore } from "@/lib/useLogsStore";
import { Logs } from "@/components/Logs";
import TranscriptionHistory from "@/components/TranscriptionHistory";
import ModelSelector, { TranscriptionModel } from "@/components/ModelSelector";
import { BrightcoveUploader } from "@/components/BrightcoveUploader";
import {
  transcribeAudio,
  getLatestTranscriptionSession,
  saveTranscriptionSession,
  fetchSharePointFiles,
  downloadSharePointFile
} from "@/lib/api";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/AuthContext";
import { SharePointSelector } from "@/components/SharePointSelector";

type TranscriptionSession = {
  id?: string;
  user_id: string;
  audio_file_name: string | null;
  selected_models: TranscriptionModel[];
  transcriptions: Record<string, { vtt: string; prompt: string; loading: boolean }>;
  selected_model: string | null;
  selected_transcription: string | null;
  video_id?: string;
  last_updated?: string;
  created_at?: string;
};

const Index = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [transcriptions, setTranscriptions] = useState<Record<string, { vtt: string, prompt: string, loading: boolean }>>({});
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [selectedTranscription, setSelectedTranscription] = useState<string | null>(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [selectedModels, setSelectedModels] = useState<TranscriptionModel[]>([]);
  const [videoId, setVideoId] = useState<string>('');
  const [isSharePointSelectorOpen, setIsSharePointSelectorOpen] = useState<boolean>(false);
  const [isBrightcoveUploaderOpen, setIsBrightcoveUploaderOpen] = useState<boolean>(false);
  const [sharePointUrl, setSharePointUrl] = useState<string>('');
  const [sharePointFiles, setSharePointFiles] = useState<any[]>([]);
  const [isFetchingSharePointFiles, setIsFetchingSharePointFiles] = useState<boolean>(false);
  const [isDownloadComplete, setIsDownloadComplete] = useState<boolean>(false);
  const [downloadedFileName, setDownloadedFileName] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();
  const addLog = useLogsStore((state) => state.addLog);
  const { user } = useAuth();

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    restoreSession();
  }, [user]);

  useEffect(() => {
    if (audioFile) {
      setAudioFileName(audioFile.name);
    }
  }, [audioFile]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setUploadProgress(0);
      setAudioFileName(file.name);
      addLog(`File uploaded: ${file.name}`, "info", {
        source: "user",
        details: `Size: ${file.size} bytes, Type: ${file.type}`
      });
    }
  };

  const handleSharePointUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSharePointUrl(event.target.value);
  };

  const handleFetchSharePointFiles = async () => {
    setIsFetchingSharePointFiles(true);
    try {
      const files = await fetchSharePointFiles(sharePointUrl);
      setSharePointFiles(files);
      toast({
        title: "Success",
        description: `Successfully fetched ${files.length} files from SharePoint.`,
      });
    } catch (error: any) {
      console.error("Error fetching SharePoint files:", error);
      toast({
        title: "Error",
        description: `Failed to fetch files from SharePoint: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsFetchingSharePointFiles(false);
    }
  };

  const handleDownloadSharePointFile = async (fileUrl: string) => {
    try {
      const file = await downloadSharePointFile(fileUrl);
      setAudioFile(file);
      setAudioFileName(file.name);
      setIsDownloadComplete(true);
      setDownloadedFileName(file.name);
      toast({
        title: "Download Complete",
        description: `Successfully downloaded ${file.name} from SharePoint.`,
      });
    } catch (error: any) {
      console.error("Error downloading SharePoint file:", error);
      toast({
        title: "Error",
        description: `Failed to download file from SharePoint: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleModelSelect = (model: TranscriptionModel) => {
    if (selectedModels.includes(model)) {
      setSelectedModels(selectedModels.filter((m) => m !== model));
    } else {
      setSelectedModels([...selectedModels, model]);
    }
  };

  const handleTranscribe = async () => {
    if (!audioFile) {
      toast({
        title: "Error",
        description: "Please upload an audio file first.",
        variant: "destructive",
      });
      return;
    }

    if (selectedModels.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one model.",
        variant: "destructive",
      });
      return;
    }

    const initialTranscriptions: Record<string, { vtt: string, prompt: string, loading: boolean }> = {};
    selectedModels.forEach(model => {
      initialTranscriptions[model] = { vtt: '', prompt: '', loading: true };
    });
    setTranscriptions(initialTranscriptions);
    setSelectedTranscription(null);

    selectedModels.forEach(async (model) => {
      try {
        const result = await transcribeAudio(audioFile, model);
        setTranscriptions(prev => ({
          ...prev,
          [model]: { vtt: result.vttContent, prompt: result.prompt, loading: false }
        }));
        toast({
          title: "Transcription Complete",
          description: `Transcription with ${model} completed successfully.`,
        });
      } catch (error: any) {
        console.error(`Error transcribing with ${model}:`, error);
        setTranscriptions(prev => ({
          ...prev,
          [model]: { vtt: 'Error', prompt: error.message, loading: false }
        }));
        toast({
          title: "Transcription Error",
          description: `Transcription with ${model} failed: ${error.message}`,
          variant: "destructive",
        });
      }
    });
  };

  const handleTranscriptionSelect = (model: string) => {
    setSelectedTranscription(model);
    setSelectedModel(model);
  };

  const handleAutoScrollToggle = () => {
    setIsAutoScrollEnabled(!isAutoScrollEnabled);
  };

  const handleDarkModeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleVideoIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVideoId(event.target.value);
  };

  const handleLoadTranscription = (transcription: any) => {
    setTranscriptions({
      [transcription.model]: {
        vtt: transcription.result.vttContent,
        prompt: transcription.result.prompt,
        loading: false
      }
    });
    setSelectedModel(transcription.model);
    setSelectedTranscription(transcription.model);
    setAudioFileName(transcription.file_path);
  };

  const restoreSession = async () => {
    try {
      const session = await getLatestTranscriptionSession();
      
      if (session) {
        setAudioFileName(session.audio_file_name);
        setSelectedModels(session.selected_models as TranscriptionModel[]);
        setTranscriptions(session.transcriptions);
        setSelectedModel(session.selected_model);
        setSelectedTranscription(session.selected_transcription);
        setVideoId(session.video_id || '');
      }
    } catch (error) {
      console.error("Error restoring session:", error);
      toast({
        title: "Session Restore Error",
        description: "Could not restore your previous transcription session.",
        variant: "destructive"
      });
    }
  };

  const saveSession = async () => {
    try {
      await saveTranscriptionSession(
        audioFileName,
        selectedModels,
        transcriptions,
        selectedModel,
        selectedTranscription,
        videoId
      );
    } catch (error) {
      console.error("Error saving session:", error);
      toast({
        title: "Session Save Error",
        description: "Could not save your transcription session.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    saveSession();
  }, [audioFileName, selectedModels, transcriptions, selectedModel, selectedTranscription, videoId]);

  const handleCopyToClipboard = () => {
    if (selectedTranscription && transcriptions[selectedTranscription]) {
      navigator.clipboard.writeText(transcriptions[selectedTranscription].vtt)
        .then(() => {
          setIsCopied(true);
          toast({
            title: "Copied!",
            description: "Transcription copied to clipboard.",
          });
          setTimeout(() => setIsCopied(false), 2000);
        })
        .catch(err => {
          console.error("Failed to copy text: ", err);
          toast({
            title: "Error",
            description: "Failed to copy transcription to clipboard.",
            variant: "destructive",
          });
        });
    } else {
      toast({
        title: "Error",
        description: "No transcription selected to copy.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 dark:bg-gray-900 dark:text-white min-h-screen">
      <Toaster />
      <h1 className="text-2xl font-bold mb-4">Transcription Tool</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audio Input</CardTitle>
              <CardDescription>Upload or select an audio file for transcription.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <Label htmlFor="upload" className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  <span>Upload Audio</span>
                </Label>
                <Input type="file" id="upload" className="hidden" onChange={handleFileUpload} />
                {audioFileName && (
                  <Badge variant="secondary">
                    <FileAudio className="mr-2 h-4 w-4" />
                    {audioFileName}
                  </Badge>
                )}
              </div>

              <Button variant="outline" onClick={() => setIsSharePointSelectorOpen(true)}>
                <img src="/sharepoint.svg" alt="SharePoint" className="mr-2 h-4 w-4" />
                <span>Select from SharePoint</span>
              </Button>

              <SharePointSelector
                open={isSharePointSelectorOpen}
                onOpenChange={setIsSharePointSelectorOpen}
                sharePointUrl={sharePointUrl}
                onSharePointUrlChange={handleSharePointUrlChange}
                onFetchFiles={handleFetchSharePointFiles}
                files={sharePointFiles}
                onDownloadFile={handleDownloadSharePointFile}
                isFetching={isFetchingSharePointFiles}
                isDownloadComplete={isDownloadComplete}
                downloadedFileName={downloadedFileName}
              />

              <Button variant="outline" onClick={() => setIsBrightcoveUploaderOpen(true)}>
                <img src="/brightcove.svg" alt="Brightcove" className="mr-2 h-4 w-4" />
                <span>Upload to Brightcove</span>
              </Button>

              <BrightcoveUploader
                open={isBrightcoveUploaderOpen}
                onOpenChange={setIsBrightcoveUploaderOpen}
                audioFile={audioFile}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transcription Models</CardTitle>
              <CardDescription>Select the models to use for transcription.</CardDescription>
            </CardHeader>
            <CardContent>
              <ModelSelector 
                selectedModels={selectedModels} 
                onModelChange={setSelectedModels}
                disabled={false}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transcription Options</CardTitle>
              <CardDescription>Configure transcription settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center space-x-2">
                <Button onClick={handleTranscribe} disabled={!audioFile || selectedModels.length === 0}>
                  Transcribe
                </Button>
                {uploadProgress > 0 && (
                  <Progress value={uploadProgress} className="w-32" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Customize the tool's behavior.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-scroll">Auto Scroll</Label>
                <Switch id="auto-scroll" checked={isAutoScrollEnabled} onCheckedChange={handleAutoScrollToggle} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode">Dark Mode</Label>
                <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={handleDarkModeToggle} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transcription History</CardTitle>
              <CardDescription>Load previous transcriptions.</CardDescription>
            </CardHeader>
            <CardContent>
              <TranscriptionHistory onLoadTranscription={handleLoadTranscription} />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transcription Output</CardTitle>
              <CardDescription>View and manage the transcribed text.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select onValueChange={handleTranscriptionSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Transcription" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(transcriptions).map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                      {transcriptions[model].loading && (
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedTranscription && transcriptions[selectedTranscription] ? (
                <div className="relative">
                  <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                    <Textarea
                      readOnly
                      value={transcriptions[selectedTranscription].vtt}
                      className="w-full h-full resize-none dark:bg-gray-800"
                    />
                  </ScrollArea>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={handleCopyToClipboard}
                    disabled={isCopied}
                  >
                    {isCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground">Select a transcription to view the output.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Brightcove Integration</CardTitle>
              <CardDescription>Add the video ID to associate with the transcription.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid gap-2">
                <Label htmlFor="video-id">Video ID</Label>
                <Input id="video-id" value={videoId} onChange={handleVideoIdChange} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logs</CardTitle>
              <CardDescription>View the application logs.</CardDescription>
            </CardHeader>
            <CardContent>
              <Logs />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
