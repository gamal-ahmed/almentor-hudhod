
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cloud, Download, Loader2, FileAudio, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { fetchSharePointFiles } from "@/lib/api";

interface SharePointDownloaderProps {
  onFilesQueued: (files: File[]) => void;
  isProcessing: boolean;
}

const SharePointDownloader = ({ onFilesQueued, isProcessing }: SharePointDownloaderProps) => {
  const [sharePointUrl, setSharePointUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [availableFiles, setAvailableFiles] = useState<{name: string, url: string}[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<{name: string, url: string}[]>([]);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  
  const handleListFiles = async () => {
    if (!sharePointUrl) {
      toast.error("Please enter a SharePoint URL");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Real implementation - fetch files list from SharePoint
      const response = await fetch(`https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/sharepoint-proxy/list-files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhid25qZmR6Ym55dmF4bXF1ZnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4MTU5ODIsImV4cCI6MjA1ODM5MTk4Mn0.4-BgbiXxUcR6k7zMRpC1BPRKapqrai6LsOxETi_hYtk',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhid25qZmR6Ym55dmF4bXF1ZnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4MTU5ODIsImV4cCI6MjA1ODM5MTk4Mn0.4-BgbiXxUcR6k7zMRpC1BPRKapqrai6LsOxETi_hYtk`,
        },
        body: JSON.stringify({
          sharePointUrl
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch files from SharePoint");
      }
      
      const data = await response.json();
      
      // Filter only mp3 files
      const mp3Files = data.files.filter((file: any) => 
        file.name.toLowerCase().endsWith('.mp3') || 
        file.name.toLowerCase().endsWith('.m4a') || 
        file.name.toLowerCase().endsWith('.wav')
      );
      
      setAvailableFiles(mp3Files);
      
      if (mp3Files.length === 0) {
        toast.warning("No audio files found in this SharePoint folder");
      } else {
        toast.success(`Found ${mp3Files.length} audio files`);
      }
    } catch (error) {
      console.error("Error listing SharePoint files:", error);
      toast.error("Failed to fetch files from SharePoint");
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleFileSelection = (file: {name: string, url: string}) => {
    if (selectedFiles.some(f => f.url === file.url)) {
      setSelectedFiles(selectedFiles.filter(f => f.url !== file.url));
    } else {
      setSelectedFiles([...selectedFiles, file]);
    }
  };
  
  const handleDownload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file");
      return;
    }
    
    try {
      setIsDownloading(true);
      
      const downloadedFiles: File[] = [];
      
      // Download each selected file
      for (const file of selectedFiles) {
        toast.info(`Downloading ${file.name}...`);
        
        const response = await fetch(`https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/sharepoint-proxy/download-file`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhid25qZmR6Ym55dmF4bXF1ZnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4MTU5ODIsImV4cCI6MjA1ODM5MTk4Mn0.4-BgbiXxUcR6k7zMRpC1BPRKapqrai6LsOxETi_hYtk',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhid25qZmR6Ym55dmF4bXF1ZnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4MTU5ODIsImV4cCI6MjA1ODM5MTk4Mn0.4-BgbiXxUcR6k7zMRpC1BPRKapqrai6LsOxETi_hYtk`,
          },
          body: JSON.stringify({
            fileUrl: file.url
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to download ${file.name}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const fileBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
        
        // Create a File object from the blob
        const fileObject = new File([fileBlob], file.name, { type: 'audio/mpeg' });
        downloadedFiles.push(fileObject);
      }
      
      toast.success(`Downloaded ${downloadedFiles.length} audio files from SharePoint`);
      onFilesQueued(downloadedFiles);
      
      // Clear selections after successful download
      setSelectedFiles([]);
      
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
          SharePoint Audio Files
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sharepoint-url">SharePoint Shared Folder URL</Label>
            <div className="flex space-x-2">
              <Input
                id="sharepoint-url"
                placeholder="https://company.sharepoint.com/:f:/s/documents"
                value={sharePointUrl}
                onChange={(e) => setSharePointUrl(e.target.value)}
                disabled={isLoading || isProcessing}
                className="flex-1"
              />
              <Button
                onClick={handleListFiles}
                disabled={isLoading || isProcessing || !sharePointUrl}
                variant="outline"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    List Files
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {availableFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Available Audio Files ({availableFiles.length})</Label>
              <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                {availableFiles.map((file, index) => (
                  <div 
                    key={index} 
                    className={`p-2 flex items-center space-x-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer rounded ${
                      selectedFiles.some(f => f.url === file.url) 
                        ? 'bg-indigo-50 dark:bg-indigo-900/20' 
                        : ''
                    }`}
                    onClick={() => toggleFileSelection(file)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFiles.some(f => f.url === file.url)}
                      onChange={() => toggleFileSelection(file)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <FileAudio className="h-4 w-4 text-indigo-500" />
                    <span className="text-sm truncate">{file.name}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                </span>
                
                <Button
                  onClick={handleDownload}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  disabled={isDownloading || isProcessing || selectedFiles.length === 0}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download Selected Files
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SharePointDownloader;
