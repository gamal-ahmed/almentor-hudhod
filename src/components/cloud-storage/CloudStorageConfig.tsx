
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
import { Settings, Save, Link, Unlink, ExternalLink } from "lucide-react";
import { 
  CloudStorageConfig as CloudStorageConfigType, 
  getCloudStorageConfig, 
  saveCloudStorageConfig, 
  isPlatformConfigured 
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";

interface CloudStorageConfigFormProps {
  onConfigSaved?: () => void;
}

const CloudStorageConfigForm: React.FC<CloudStorageConfigFormProps> = ({ onConfigSaved }) => {
  const [config, setConfig] = useState<CloudStorageConfigType>({
    googleDrive: { clientId: '', apiKey: '' },
    dropbox: { appKey: '' }
  });
  const [open, setOpen] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [dropboxConnected, setDropboxConnected] = useState(false);

  useEffect(() => {
    const savedConfig = getCloudStorageConfig();
    setConfig(savedConfig);
    
    // Check if services are configured
    const googleConfigured = isPlatformConfigured('googleDrive');
    const dropboxConfigured = isPlatformConfigured('dropbox');
    
    // Check connection status (simplified version - in real implementation, 
    // we would check with the actual services)
    setGoogleConnected(googleConfigured);
    setDropboxConnected(dropboxConfigured);
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

  const handleConnectGoogle = () => {
    if (!isPlatformConfigured('googleDrive')) {
      toast.error("Please configure Google Drive API credentials first");
      return;
    }

    // In a real implementation, we would initiate Google OAuth flow here
    // For now, we'll just simulate the connection
    toast.success("Google Drive connected successfully");
    setGoogleConnected(true);
  };

  const handleDisconnectGoogle = () => {
    // In a real implementation, we would revoke the OAuth token
    toast.success("Google Drive disconnected");
    setGoogleConnected(false);
  };

  const handleConnectDropbox = () => {
    if (!isPlatformConfigured('dropbox')) {
      toast.error("Please configure Dropbox API credentials first");
      return;
    }

    // In a real implementation, we would initiate Dropbox OAuth flow here
    // For now, we'll just simulate the connection
    toast.success("Dropbox connected successfully");
    setDropboxConnected(true);
  };

  const handleDisconnectDropbox = () => {
    // In a real implementation, we would revoke the OAuth token
    toast.success("Dropbox disconnected");
    setDropboxConnected(false);
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
            Connect to your cloud storage accounts and configure API credentials
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="google-drive" className="w-full mt-4">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="google-drive">Google Drive</TabsTrigger>
            <TabsTrigger value="dropbox">Dropbox</TabsTrigger>
          </TabsList>
          
          <TabsContent value="google-drive" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Connection Status</h3>
              {googleConnected ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800">
                  Not connected
                </Badge>
              )}
            </div>
            
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
            
            <div className="flex gap-2">
              {googleConnected ? (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleDisconnectGoogle}
                  className="flex items-center gap-1"
                >
                  <Unlink className="h-4 w-4" />
                  <span>Disconnect</span>
                </Button>
              ) : (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleConnectGoogle}
                  className="flex items-center gap-1"
                  disabled={!isPlatformConfigured('googleDrive')}
                >
                  <Link className="h-4 w-4" />
                  <span>Connect Account</span>
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => window.open("https://console.developers.google.com/", "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                <span>Google Console</span>
              </Button>
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
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Connection Status</h3>
              {dropboxConnected ? (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800">
                  Not connected
                </Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dropbox-app-key">App Key</Label>
              <Input
                id="dropbox-app-key"
                value={config.dropbox.appKey}
                onChange={(e) => handleInputChange('dropbox', 'appKey', e.target.value)}
                placeholder="Your Dropbox App Key"
              />
            </div>
            
            <div className="flex gap-2">
              {dropboxConnected ? (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleDisconnectDropbox}
                  className="flex items-center gap-1"
                >
                  <Unlink className="h-4 w-4" />
                  <span>Disconnect</span>
                </Button>
              ) : (
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleConnectDropbox}
                  className="flex items-center gap-1"
                  disabled={!isPlatformConfigured('dropbox')}
                >
                  <Link className="h-4 w-4" />
                  <span>Connect Account</span>
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => window.open("https://www.dropbox.com/developers/apps", "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                <span>Dropbox Console</span>
              </Button>
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
