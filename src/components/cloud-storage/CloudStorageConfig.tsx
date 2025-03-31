
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings, Save } from "lucide-react";
import { 
  CloudStorageConfig as CloudStorageConfigType, 
  getCloudStorageConfig, 
  saveCloudStorageConfig, 
  isPlatformConfigured 
} from "@/lib/api";

interface CloudStorageConfigFormProps {
  onConfigSaved?: () => void;
}

const CloudStorageConfigForm: React.FC<CloudStorageConfigFormProps> = ({ onConfigSaved }) => {
  const [config, setConfig] = useState<CloudStorageConfigType>({
    googleDrive: { clientId: '', apiKey: '' },
    dropbox: { appKey: '' }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const savedConfig = getCloudStorageConfig();
    setConfig(savedConfig);
  }, [open]);

  const handleSaveConfig = () => {
    try {
      saveCloudStorageConfig(config);
      toast.success("Cloud storage configuration saved successfully");
      setOpen(false);
      if (onConfigSaved) {
        onConfigSaved();
      }
    } catch (error) {
      console.error("Error saving cloud storage config:", error);
      toast.error("Failed to save configuration");
    }
  };

  const handleInputChange = (platform: 'googleDrive' | 'dropbox', field: string, value: string) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      [platform]: {
        ...prevConfig[platform],
        [field]: value
      }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Settings className="h-4 w-4" />
          <span>Configure Storage</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Cloud Storage Configuration</DialogTitle>
          <DialogDescription>
            Enter your API credentials for Google Drive and Dropbox integration
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="google-drive" className="w-full mt-4">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="google-drive">Google Drive</TabsTrigger>
            <TabsTrigger value="dropbox">Dropbox</TabsTrigger>
          </TabsList>
          
          <TabsContent value="google-drive" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="google-client-id">Client ID</Label>
              <Input
                id="google-client-id"
                value={config.googleDrive.clientId}
                onChange={(e) => handleInputChange('googleDrive', 'clientId', e.target.value)}
                placeholder="Your Google Client ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="google-api-key">API Key</Label>
              <Input
                id="google-api-key"
                value={config.googleDrive.apiKey}
                onChange={(e) => handleInputChange('googleDrive', 'apiKey', e.target.value)}
                placeholder="Your Google API Key"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              <p>To get these credentials:</p>
              <ol className="list-decimal pl-4 space-y-1 mt-1">
                <li>Go to the <a href="https://console.developers.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google Cloud Console</a></li>
                <li>Create a new project or select an existing one</li>
                <li>Enable the Google Drive API</li>
                <li>Create OAuth credentials (Web application type) for the Client ID</li>
                <li>Create API Key for browser applications</li>
              </ol>
            </div>
          </TabsContent>
          
          <TabsContent value="dropbox" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dropbox-app-key">App Key</Label>
              <Input
                id="dropbox-app-key"
                value={config.dropbox.appKey}
                onChange={(e) => handleInputChange('dropbox', 'appKey', e.target.value)}
                placeholder="Your Dropbox App Key"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              <p>To get your Dropbox App Key:</p>
              <ol className="list-decimal pl-4 space-y-1 mt-1">
                <li>Go to the <a href="https://www.dropbox.com/developers/apps" target="_blank" rel="noopener noreferrer" className="text-primary underline">Dropbox Developer Console</a></li>
                <li>Create a new app or select an existing one</li>
                <li>Choose the "Dropbox API" option</li>
                <li>Select "Full Dropbox" or "App Folder" access</li>
                <li>Find your App Key in the Settings tab</li>
              </ol>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button onClick={handleSaveConfig} className="flex items-center gap-1">
            <Save className="h-4 w-4" />
            <span>Save Configuration</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CloudStorageConfigForm;
