
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, FileIcon } from "lucide-react";
import { useLogsStore } from "@/lib/useLogsStore";
import { getCloudStorageConfig, isPlatformConfigured } from "@/lib/api/cloudStorageService";

interface DropboxImporterProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

const DropboxImporter: React.FC<DropboxImporterProps> = ({ onFilesSelected, isProcessing }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { addLog } = useLogsStore();

  useEffect(() => {
    // Skip initialization if the platform is not configured
    if (!isPlatformConfigured('dropbox')) {
      addLog("Dropbox is not configured. Please add your API credentials.", "warn");
      return;
    }

    const config = getCloudStorageConfig();
    
    const loadDropboxScript = () => {
      const script = document.createElement("script");
      script.src = "https://www.dropbox.com/static/api/2/dropins.js";
      script.id = "dropboxjs";
      script.setAttribute("data-app-key", config.dropbox.appKey);
      
      script.onload = () => {
        setIsInitialized(true);
        addLog("Dropbox API initialized", "info");
      };
      
      script.onerror = () => {
        console.error("Error loading Dropbox API script");
        addLog("Error loading Dropbox API", "error");
        toast.error("Failed to load Dropbox integration");
      };
      
      document.body.appendChild(script);
    };

    loadDropboxScript();

    return () => {
      // Cleanup if needed
    };
  }, [addLog]);

  const openDropboxChooser = () => {
    if (!isInitialized) {
      if (!isPlatformConfigured('dropbox')) {
        toast.error("Please configure your Dropbox API credentials first");
      } else {
        toast.error("Dropbox API is not initialized yet");
      }
      return;
    }

    setIsLoading(true);

    try {
      window.Dropbox.choose({
        success: handleDropboxSuccess,
        cancel: handleDropboxCancel,
        linkType: "direct",
        folderselect: false,
        multiselect: true,
        extensions: ['.mp3', '.wav', '.m4a', '.flac'],
      });
      
      addLog("Dropbox chooser opened", "info");
    } catch (error) {
      console.error("Error opening Dropbox chooser", error);
      addLog("Error opening Dropbox chooser", "error");
      toast.error("Failed to open Dropbox file chooser");
      setIsLoading(false);
    }
  };

  const handleDropboxSuccess = async (files: any[]) => {
    try {
      addLog(`Selected ${files.length} files from Dropbox`, "info");
      
      const downloadedFiles: File[] = [];
      
      for (const file of files) {
        try {
          const response = await fetch(file.link);
          const blob = await response.blob();
          
          const filename = file.name;
          const fileExt = filename.split('.').pop()?.toLowerCase();
          let mimeType = 'audio/mpeg';
          
          // Determine correct MIME type based on file extension
          if (fileExt === 'wav') mimeType = 'audio/wav';
          else if (fileExt === 'm4a') mimeType = 'audio/mp4';
          else if (fileExt === 'flac') mimeType = 'audio/flac';
          
          const newFile = new File([blob], filename, { type: mimeType });
          downloadedFiles.push(newFile);
          
          addLog(`Downloaded file from Dropbox: ${filename}`, "info");
        } catch (error) {
          console.error(`Error downloading file ${file.name}`, error);
          addLog(`Error downloading file ${file.name} from Dropbox`, "error");
        }
      }
      
      if (downloadedFiles.length > 0) {
        onFilesSelected(downloadedFiles);
        toast.success(`Imported ${downloadedFiles.length} files from Dropbox`);
      } else {
        toast.error("No files were imported from Dropbox");
      }
    } catch (error) {
      console.error("Error processing Dropbox files", error);
      addLog("Error processing files from Dropbox", "error");
      toast.error("Failed to import files from Dropbox");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDropboxCancel = () => {
    addLog("Dropbox file selection cancelled", "info");
    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      {!isPlatformConfigured('dropbox') ? (
        <div className="p-4 border border-dashed rounded-md bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Dropbox integration requires API configuration
          </p>
          <p className="text-xs text-muted-foreground">
            Please use the Configure Storage button to add your credentials
          </p>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full h-auto py-4 flex flex-col items-center gap-2"
          onClick={openDropboxChooser}
          disabled={isLoading || isProcessing || !isInitialized}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
                <FileIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Select from Dropbox</span>
                <span className="text-xs text-muted-foreground">Import audio files from your Dropbox</span>
              </div>
            </>
          )}
        </Button>
      )}
      
      {!isInitialized && isPlatformConfigured('dropbox') && (
        <p className="text-xs text-muted-foreground">
          Loading Dropbox integration...
        </p>
      )}
    </div>
  );
};

export default DropboxImporter;
