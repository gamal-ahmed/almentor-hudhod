
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, FileIcon } from "lucide-react";
import { useLogsStore } from "@/lib/useLogsStore";

// Google Drive API configuration
const CLIENT_ID = "YOUR_GOOGLE_DRIVE_CLIENT_ID"; // Replace with your actual client ID
const API_KEY = "YOUR_GOOGLE_API_KEY"; // Replace with your actual API key
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
const SCOPES = "https://www.googleapis.com/auth/drive.readonly";

interface GoogleDriveImporterProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

const GoogleDriveImporter: React.FC<GoogleDriveImporterProps> = ({ onFilesSelected, isProcessing }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const { addLog } = useLogsStore();

  useEffect(() => {
    const loadGapiScript = () => {
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.onload = () => initializeGapiClient();
      script.onerror = () => {
        console.error("Error loading Google API script");
        addLog("Error loading Google Drive API", "error");
        toast.error("Failed to load Google Drive integration");
      };
      document.body.appendChild(script);
    };

    const initializeGapiClient = () => {
      window.gapi.load('client:auth2', async () => {
        try {
          await window.gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES
          });

          // Listen for sign-in state changes
          window.gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
          
          // Set the initial sign-in state
          updateSigninStatus(window.gapi.auth2.getAuthInstance().isSignedIn.get());
          
          setIsInitialized(true);
          addLog("Google Drive API initialized", "info");
        } catch (error) {
          console.error("Error initializing Google API client", error);
          addLog("Error initializing Google Drive API", "error");
          toast.error("Failed to initialize Google Drive");
        }
      });
    };

    const updateSigninStatus = (isSignedIn: boolean) => {
      setIsSignedIn(isSignedIn);
      addLog(`Google Drive authentication status: ${isSignedIn ? "Signed in" : "Signed out"}`, "info");
    };

    loadGapiScript();

    return () => {
      // Cleanup if needed
    };
  }, [addLog]);

  const handleAuthClick = () => {
    if (!isInitialized) {
      toast.error("Google Drive API is not initialized yet");
      return;
    }

    if (isSignedIn) {
      // Open picker if already signed in
      openPicker();
    } else {
      // Sign in if not already
      window.gapi.auth2.getAuthInstance().signIn()
        .catch((error: any) => {
          console.error("Error signing in to Google Drive", error);
          addLog("Error signing in to Google Drive", "error");
          toast.error("Failed to sign in to Google Drive");
        });
    }
  };

  const openPicker = async () => {
    setIsLoading(true);
    
    try {
      // Load Google Picker API
      if (!window.google || !window.google.picker) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://apis.google.com/js/api.js?onload=onGooglePickerApiLoad";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Google Picker API"));
          document.body.appendChild(script);
        });
      }

      const token = window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
      
      const picker = new window.google.picker.PickerBuilder()
        .addView(new window.google.picker.View(window.google.picker.ViewId.AUDIO))
        .setOAuthToken(token)
        .setDeveloperKey(API_KEY)
        .setCallback(pickerCallback)
        .build();
        
      picker.setVisible(true);
      addLog("Google Drive picker opened", "info");
    } catch (error) {
      console.error("Error opening Google Drive picker", error);
      addLog("Error opening Google Drive picker", "error");
      toast.error("Failed to open Google Drive file picker");
    } finally {
      setIsLoading(false);
    }
  };

  const pickerCallback = async (data: any) => {
    if (data.action === window.google.picker.Action.PICKED) {
      setIsLoading(true);
      
      try {
        const docs = data.docs;
        addLog(`Selected ${docs.length} files from Google Drive`, "info");
        
        const files: File[] = [];
        
        for (const doc of docs) {
          try {
            const response = await window.gapi.client.drive.files.get({
              fileId: doc.id,
              alt: 'media'
            });
            
            const blob = new Blob([response.body], { type: doc.mimeType });
            const file = new File([blob], doc.name, { type: doc.mimeType });
            
            files.push(file);
            addLog(`Downloaded file from Google Drive: ${doc.name}`, "info");
          } catch (error) {
            console.error(`Error downloading file ${doc.name}`, error);
            addLog(`Error downloading file ${doc.name} from Google Drive`, "error");
          }
        }
        
        if (files.length > 0) {
          onFilesSelected(files);
          toast.success(`Imported ${files.length} files from Google Drive`);
        } else {
          toast.error("No files were imported from Google Drive");
        }
      } catch (error) {
        console.error("Error processing selected files", error);
        addLog("Error processing files from Google Drive", "error");
        toast.error("Failed to import files from Google Drive");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full h-auto py-4 flex flex-col items-center gap-2"
        onClick={handleAuthClick}
        disabled={isLoading || isProcessing}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            <div className="rounded-full bg-red-100 p-2 dark:bg-red-900/20">
              <FileIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {isSignedIn ? "Select from Google Drive" : "Connect to Google Drive"}
              </span>
              <span className="text-xs text-muted-foreground">
                {isSignedIn ? "Choose audio files to import" : "Sign in to your Google account"}
              </span>
            </div>
          </>
        )}
      </Button>
      
      {isInitialized && !isSignedIn && (
        <p className="text-xs text-muted-foreground">
          You'll need to authorize access to your Google Drive to import files
        </p>
      )}
    </div>
  );
};

export default GoogleDriveImporter;
