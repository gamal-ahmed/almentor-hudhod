import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLogsStore } from "@/lib/useLogsStore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addCaptionToBrightcove } from "@/lib/api";

interface DirectCaptionIngestionProps {
  videoId: string;
  accountId: string;
  authToken: string;
  onSuccess: () => void;
}

const DirectCaptionIngestion = ({ videoId, accountId, authToken, onSuccess }: DirectCaptionIngestionProps) => {
  const [vttUrl, setVttUrl] = useState("");
  const [language, setLanguage] = useState("en");
  const [label, setLabel] = useState("English");
  const [isUploading, setIsUploading] = useState(false);
  
  const { toast } = useToast();
  const { addLog } = useLogsStore();
  
  const languageOptions = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "it", label: "Italian" },
    { value: "pt", label: "Portuguese" },
    { value: "ru", label: "Russian" },
    { value: "zh", label: "Chinese" },
    { value: "ja", label: "Japanese" },
    { value: "ar", label: "Arabic" },
  ];
  
  const handleCaptionUpload = async () => {
    if (!vttUrl) {
      toast({
        title: "Missing Information",
        description: "Please provide a VTT URL",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    try {
      await addCaptionToBrightcove(
        videoId,
        `caption-upload-${Date.now()}`,
        authToken,
        undefined,
        undefined,
        language,
        label,
        vttUrl
      );
      
      addLog(`Uploaded caption for video ${videoId}`, "info");
      toast({
        title: "Success",
        description: "Caption uploaded successfully",
      });
      
      setVttUrl("");
      onSuccess();
    } catch (error) {
      console.error("Error uploading caption:", error);
      addLog(`Failed to upload caption: ${error instanceof Error ? error.message : String(error)}`, "error");
      toast({
        title: "Error",
        description: "Failed to upload caption",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    const option = languageOptions.find(opt => opt.value === value);
    if (option) {
      setLabel(option.label);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Direct Caption Upload
        </CardTitle>
        <CardDescription>Upload a caption file directly to Brightcove</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="vtt-url">VTT File URL</Label>
            <Input
              id="vtt-url"
              placeholder="https://example.com/captions.vtt"
              value={vttUrl}
              onChange={(e) => setVttUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              The URL must be publicly accessible
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="label">Caption Label</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={handleCaptionUpload} 
          disabled={isUploading || !vttUrl}
        >
          {isUploading ? "Uploading..." : "Upload Caption"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DirectCaptionIngestion;
