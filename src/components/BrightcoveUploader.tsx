import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Upload, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { fetchBrightcoveKeys, getBrightcoveAuthToken, addCaptionToBrightcove } from "@/lib/api";
import { useLogsStore } from "@/lib/useLogsStore";

interface BrightcoveUploaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audioFile: File | null;
}

export function BrightcoveUploader({ open, onOpenChange, audioFile }: BrightcoveUploaderProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [videoId, setVideoId] = useState<string>("");
  const [language, setLanguage] = useState<string>("en");
  const [label, setLabel] = useState<string>("English");
  const [vttContent, setVttContent] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [brightcoveKeys, setBrightcoveKeys] = useState<any>({});
  const [accessToken, setAccessToken] = useState<string>("");
  const addLog = useLogsStore((state) => state.addLog);
  const startTimedLog = useLogsStore((state) => state.startTimedLog);

  const languages = [
    { value: "en", label: "English" },
    { value: "ar", label: "Arabic" },
    { value: "fr", label: "French" },
    { value: "es", label: "Spanish" },
    { value: "de", label: "German" }
  ];

  useEffect(() => {
    if (open) {
      loadBrightcoveKeys();
    }
  }, [open]);

  const loadBrightcoveKeys = async () => {
    try {
      setIsLoading(true);
      const keys = await fetchBrightcoveKeys();
      setBrightcoveKeys(keys);
      
      if (keys.brightcove_client_id && keys.brightcove_client_secret) {
        const token = await getBrightcoveAuthToken(
          keys.brightcove_client_id, 
          keys.brightcove_client_secret
        );
        setAccessToken(token);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading Brightcove keys:", error);
      toast({
        title: "Error",
        description: "Failed to load Brightcove API keys. Please check your Supabase configuration.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleVideoIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoId(e.target.value);
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    const selectedLang = languages.find(lang => lang.value === value);
    if (selectedLang) {
      setLabel(selectedLang.label);
    }
  };

  const handleVttContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setVttContent(e.target.value);
  };

  const handleUpload = async () => {
    if (!videoId) {
      toast({
        title: "Missing Information",
        description: "Please enter a video ID.",
        variant: "destructive",
      });
      return;
    }

    if (!vttContent && !audioFile) {
      toast({
        title: "Missing Content",
        description: "Please either enter VTT content or upload an audio file for transcription.",
        variant: "destructive",
      });
      return;
    }

    if (!accessToken || !brightcoveKeys.brightcove_account_id) {
      toast({
        title: "Authentication Error",
        description: "Failed to authenticate with Brightcove. Please check your API keys.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const logOperation = startTimedLog(`Uploading captions to Brightcove video ${videoId}`, "info", "BrightcoveUploader");
      
      const success = await addCaptionToBrightcove(
        videoId,
        vttContent,
        language,
        label,
        brightcoveKeys.brightcove_account_id,
        accessToken
      );
      
      if (success) {
        setIsSuccess(true);
        logOperation.complete(`Successfully uploaded captions to Brightcove video ${videoId}`);
        toast({
          title: "Success!",
          description: `Caption has been added to video ${videoId}.`,
        });
      }
      
      setIsLoading(false);
    } catch (error: any) {
      addLog(`Error uploading captions to Brightcove: ${error.message}`, "error", {
        source: "BrightcoveUploader",
        details: error.stack
      });
      console.error("Error uploading to Brightcove:", error);
      toast({
        title: "Upload Failed",
        description: `Failed to upload caption: ${error.message}`,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload to Brightcove</DialogTitle>
          <DialogDescription>
            Add captions to a Brightcove video.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="videoId">Brightcove Video ID</Label>
            <Input
              id="videoId"
              placeholder="Enter Video ID"
              value={videoId}
              onChange={handleVideoIdChange}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="language">Caption Language</Label>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger id="language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Tabs defaultValue="direct">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="direct">Direct Input</TabsTrigger>
              <TabsTrigger value="file" disabled={!audioFile}>File Upload</TabsTrigger>
            </TabsList>
            
            <TabsContent value="direct" className="space-y-2">
              <Label htmlFor="vttContent">VTT Content</Label>
              <textarea
                id="vttContent"
                className="w-full h-32 p-2 border rounded-md resize-none"
                placeholder="WEBVTT

00:00:00.000 --> 00:00:05.000
Your caption text here..."
                value={vttContent}
                onChange={handleVttContentChange}
              />
            </TabsContent>
            
            <TabsContent value="file" className="space-y-2">
              <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-md">
                {audioFile ? (
                  <div className="text-center">
                    <p className="font-medium">{audioFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {Math.round(audioFile.size / 1024)} KB
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No file selected</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
          
          <Button
            onClick={handleUpload}
            disabled={isLoading || isSuccess}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Uploaded Successfully
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload to Brightcove
              </>
            )}
          </Button>
          
          {!accessToken && !isLoading && (
            <div className="flex items-center space-x-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              <span>Brightcove credentials not configured or invalid.</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
