
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cloud, Download, Loader2, FileAudio, RefreshCw, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { fetchSharePointFiles, downloadSharePointFile } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SharePointDownloaderProps {
  onFilesQueued: (files: File[]) => void;
  isProcessing: boolean;
}

interface SharePointFile {
  name: string;
  url: string;
  size: number;
  lastModified: string;
}

const SharePointDownloader = ({ onFilesQueued, isProcessing }: SharePointDownloaderProps) => {
  const [sharePointUrl, setSharePointUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [availableFiles, setAvailableFiles] = useState<SharePointFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<SharePointFile[]>([]);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const handleListFiles = async () => {
    if (!sharePointUrl) {
      toast.error("Please enter a SharePoint URL");
      return;
    }
    
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      // Fetch files list from SharePoint via our proxy
      const files = await fetchSharePointFiles(sharePointUrl);
      
      // Filter only audio files
      const audioFiles = files.filter((file) => 
        file.name.toLowerCase().endsWith('.mp3') || 
        file.name.toLowerCase().endsWith('.m4a') || 
        file.name.toLowerCase().endsWith('.wav')
      );
      
      setAvailableFiles(audioFiles);
      
      if (audioFiles.length === 0) {
        toast.warning("No audio files found in this SharePoint folder");
      } else {
        toast.success(`Found ${audioFiles.length} audio files`);
      }
    } catch (error) {
      console.error("Error listing SharePoint files:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setErrorMessage(`Failed to fetch files: ${errorMsg}`);
      toast.error(`Failed to fetch files: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleFileSelection = (file: SharePointFile) => {
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
      setErrorMessage(null);
      
      const downloadedFiles: File[] = [];
      
      // Download each selected file
      for (const file of selectedFiles) {
        toast.info(`Downloading ${file.name}...`);
        
        try {
          const fileObject = await downloadSharePointFile(file.url);
          downloadedFiles.push(fileObject);
        } catch (error) {
          console.error(`Error downloading ${file.name}:`, error);
          toast.error(`Failed to download ${file.name}`);
        }
      }
      
      if (downloadedFiles.length > 0) {
        toast.success(`Downloaded ${downloadedFiles.length} audio files from SharePoint`);
        onFilesQueued(downloadedFiles);
        
        // Clear selections after successful download
        setSelectedFiles([]);
      } else {
        toast.error("Failed to download any files");
      }
      
    } catch (error) {
      console.error("Error downloading from SharePoint:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setErrorMessage(`Failed to download files: ${errorMsg}`);
      toast.error(`Failed to download files: ${errorMsg}`);
    } finally {
      setIsDownloading(false);
    }
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch (e) {
      return dateStr;
    }
  };
  
  return (
    <Card className="overflow-hidden border-t-4 border-t-indigo-500 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold flex items-center">
          <Cloud className="mr-2 h-5 w-5 text-indigo-500" />
          SharePoint Audio Files
        </CardTitle>
        <CardDescription>
          Enter a SharePoint shared folder URL to access audio files
        </CardDescription>
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
          
          {errorMessage && (
            <Alert variant="destructive" className="my-2">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}
          
          {availableFiles.length > 0 && (
            <div className="space-y-2">
              <Label>Available Audio Files ({availableFiles.length})</Label>
              <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                {availableFiles.map((file, index) => (
                  <div 
                    key={index} 
                    className={`p-2 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer rounded ${
                      selectedFiles.some(f => f.url === file.url) 
                        ? 'bg-indigo-50 dark:bg-indigo-900/20' 
                        : ''
                    }`}
                    onClick={() => toggleFileSelection(file)}
                  >
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedFiles.some(f => f.url === file.url)}
                        onChange={() => toggleFileSelection(file)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <FileAudio className="h-4 w-4 text-indigo-500" />
                      <span className="text-sm truncate max-w-xs">{file.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground flex flex-col items-end">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{formatDate(file.lastModified)}</span>
                    </div>
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
