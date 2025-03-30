
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cloud, Download, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface SharePointDownloaderProps {
  onFilesQueued: (files: File[]) => void;
  isProcessing: boolean;
}

const SharePointDownloader = ({ onFilesQueued, isProcessing }: SharePointDownloaderProps) => {
  const [sharePointUrl, setSharePointUrl] = useState<string>("");
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  
  const handleDownload = async () => {
    if (!sharePointUrl) {
      toast.error("Please enter a SharePoint URL");
      return;
    }
    
    try {
      setIsDownloading(true);
      
      // Mock SharePoint download for demo purposes
      // In a real implementation, this would call a SharePoint API endpoint
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulating files from SharePoint
      // This is where you would parse the actual response from SharePoint
      const mockFiles = [
        new File([new ArrayBuffer(1000)], "interview1.mp3", { type: "audio/mpeg" }),
        new File([new ArrayBuffer(1000)], "meeting_notes.mp3", { type: "audio/mpeg" }),
        new File([new ArrayBuffer(1000)], "conference_call.mp3", { type: "audio/mpeg" })
      ];
      
      toast.success(`Downloaded ${mockFiles.length} MP3 files from SharePoint`);
      onFilesQueued(mockFiles);
    } catch (error) {
      console.error("Error downloading from SharePoint:", error);
      toast.error("Failed to download files from SharePoint");
    } finally {
      setIsDownloading(false);
    }
  };
  
  return (
    <Card className="overflow-hidden border-t-4 border-t-indigo-500 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold flex items-center">
          <Cloud className="mr-2 h-5 w-5 text-indigo-500" />
          Download from SharePoint
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sharepoint-url">SharePoint Folder URL</Label>
            <Input
              id="sharepoint-url"
              placeholder="https://company.sharepoint.com/sites/folder"
              value={sharePointUrl}
              onChange={(e) => setSharePointUrl(e.target.value)}
              disabled={isDownloading || isProcessing}
            />
          </div>
          
          <Button
            onClick={handleDownload}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            disabled={isDownloading || isProcessing || !sharePointUrl}
          >
            {isDownloading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download MP3 Files
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SharePointDownloader;
