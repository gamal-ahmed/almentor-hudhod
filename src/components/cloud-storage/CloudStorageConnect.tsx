
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CloudStorageProvider } from '@/types/cloudStorage';
import { FileIcon, Cloud, CloudIcon } from 'lucide-react';
import { cloudStorageService } from '@/lib/api';
import { toast } from 'sonner';

interface CloudStorageConnectProps {
  onConnected: () => void;
}

const CloudStorageConnect: React.FC<CloudStorageConnectProps> = ({ onConnected }) => {
  const connectToProvider = async (provider: CloudStorageProvider) => {
    try {
      // Get the current URL to construct the redirect URL
      const baseUrl = window.location.origin;
      const redirectUrl = `${baseUrl}/auth/callback/${provider}`;
      
      console.log('Connecting to provider:', provider, 'with redirectUrl:', redirectUrl);
      
      // Request the auth URL from our backend
      const authUrl = await cloudStorageService.getAuthUrl(provider, redirectUrl);
      
      console.log('Received auth URL:', authUrl);
      
      // Store the current path so we can return after auth
      localStorage.setItem('cloud_storage_redirect_path', window.location.pathname);
      
      // Redirect to the OAuth provider
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error getting auth URL:', error);
      toast.error('Failed to connect to cloud storage', {
        description: (error as Error).message || 'Please try again later.'
      });
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
              <CloudIcon className="h-5 w-5 text-blue-500" />
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
