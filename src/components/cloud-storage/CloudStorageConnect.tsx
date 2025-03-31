
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CloudStorageProvider } from '@/types/cloudStorage';
import { FileIcon, Cloud } from 'lucide-react';
import { cloudStorageService } from '@/lib/api';

interface CloudStorageConnectProps {
  onConnected: () => void;
}

const CloudStorageConnect: React.FC<CloudStorageConnectProps> = ({ onConnected }) => {
  const connectToProvider = async (provider: CloudStorageProvider) => {
    try {
      const authUrl = await cloudStorageService.getAuthUrl(provider);
      // Open the OAuth window
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error getting auth URL:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-xl font-semibold">Connect to Cloud Storage</div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileIcon className="h-5 w-5 text-red-500" />
              <CardTitle className="text-base">Google Drive</CardTitle>
            </div>
            <CardDescription>
              Connect your Google Drive account to import audio files.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Access your audio files directly from Google Drive.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="default" 
              className="w-full bg-red-500 hover:bg-red-600"
              onClick={() => connectToProvider('google-drive')}
            >
              Connect Google Drive
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-base">Dropbox</CardTitle>
            </div>
            <CardDescription>
              Connect your Dropbox account to import audio files.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Access your audio files directly from Dropbox.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              variant="default" 
              className="w-full bg-blue-500 hover:bg-blue-600"
              onClick={() => connectToProvider('dropbox')}
            >
              Connect Dropbox
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default CloudStorageConnect;
