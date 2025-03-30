
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search, FileAudio, Download, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SharePointSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sharePointUrl: string;
  onSharePointUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFetchFiles: () => Promise<void>;
  files: Array<{name: string, url: string, size: number, lastModified: string}>;
  onDownloadFile: (fileUrl: string) => Promise<void>;
  isFetching: boolean;
  isDownloadComplete: boolean;
  downloadedFileName: string | null;
}

export function SharePointSelector({
  open,
  onOpenChange,
  sharePointUrl,
  onSharePointUrlChange,
  onFetchFiles,
  files,
  onDownloadFile,
  isFetching,
  isDownloadComplete,
  downloadedFileName
}: SharePointSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingFileName, setDownloadingFileName] = useState<string | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDownload = async (fileUrl: string, fileName: string) => {
    setIsDownloading(true);
    setDownloadingFileName(fileName);
    
    try {
      await onDownloadFile(fileUrl);
    } finally {
      setIsDownloading(false);
      setDownloadingFileName(null);
    }
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (file.name.endsWith('.mp3') || file.name.endsWith('.wav') || file.name.endsWith('.m4a'))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select from SharePoint</DialogTitle>
          <DialogDescription>
            Connect to SharePoint and select audio files.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="SharePoint URL"
              value={sharePointUrl}
              onChange={onSharePointUrlChange}
              className="flex-1"
            />
            <Button 
              variant="secondary" 
              onClick={onFetchFiles} 
              disabled={isFetching || !sharePointUrl}
            >
              {isFetching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="sr-only">Fetch</span>
            </Button>
          </div>
          
          {files.length > 0 && (
            <>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-8"
                />
              </div>
              
              <ScrollArea className="h-72 rounded-md border">
                <div className="p-4 space-y-2">
                  {filteredFiles.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No audio files found. Try a different search term.
                    </p>
                  ) : (
                    filteredFiles.map((file) => (
                      <div
                        key={file.url}
                        className="flex items-center justify-between p-2 border rounded-md hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-center space-x-2 overflow-hidden">
                          <FileAudio className="h-4 w-4 flex-shrink-0" />
                          <div className="overflow-hidden">
                            <p className="font-medium truncate" title={file.name}>
                              {file.name}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                              <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                              <span>•</span>
                              <span>{formatDistanceToNow(new Date(file.lastModified), { addSuffix: true })}</span>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(file.url, file.name)}
                          disabled={isDownloading}
                        >
                          {isDownloading && downloadingFileName === file.name ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isDownloadComplete && downloadedFileName === file.name ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </>
          )}
          
          {isFetching && (
            <div className="flex justify-center items-center p-4">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <p>Fetching files from SharePoint...</p>
            </div>
          )}
          
          {!isFetching && files.length === 0 && (
            <div className="text-center p-4">
              <p className="text-muted-foreground">
                Enter a SharePoint URL and click fetch to view available audio files.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
