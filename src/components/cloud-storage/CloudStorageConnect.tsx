
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CloudStorageProvider } from '@/types/cloudStorage';
import { FileCloud, Cloud, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cloudStorageService } from '@/lib/api/cloudStorageService';

interface CloudStorageConnectProps {
  onSuccess: () => void;
}

const CloudStorageConnect: React.FC<CloudStorageConnectProps> = ({ onSuccess }) => {
  const [isConnecting, setIsConnecting] = useState<CloudStorageProvider | null>(null);
  
  // URL for handling OAuth callback
  const callbackUrl = `${window.location.origin}/cloud-storage/callback`;

  // Listen for OAuth redirects
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const provider = localStorage.getItem('cloudStorageProvider') as CloudStorageProvider;
    const state = params.get('state');
    const error = params.get('error');
    
    if (error) {
      toast.error('Authentication failed', {
        description: error,
      });
      localStorage.removeItem('cloudStorageProvider');
      return;
    }
    
    if (code && provider) {
      const handleCallback = async () => {
        try {
          setIsConnecting(provider);
          await cloudStorageService.handleOAuthCallback(provider, code, callbackUrl);
          localStorage.removeItem('cloudStorageProvider');
          toast.success('Connected successfully', {
            description: `Your ${provider === 'google-drive' ? 'Google Drive' : 'Dropbox'} account has been connected.`,
          });
          onSuccess();
          
          // Clean up URL parameters
          const url = new URL(window.location.href);
          url.search = '';
          window.history.replaceState({}, document.title, url.toString());
        } catch (error) {
          console.error('Error connecting account:', error);
          toast.error('Connection failed', {
            description: error.message || 'Failed to connect your account. Please try again.',
          });
        } finally {
          setIsConnecting(null);
        }
      };
      
      handleCallback();
    }
  }, [callbackUrl, onSuccess]);

  const connectProvider = async (provider: CloudStorageProvider) => {
    try {
      setIsConnecting(provider);
      localStorage.setItem('cloudStorageProvider', provider);
      
      const authUrl = await cloudStorageService.getAuthUrl(provider, callbackUrl);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error starting OAuth flow:', error);
      setIsConnecting(null);
      localStorage.removeItem('cloudStorageProvider');
      toast.error('Connection failed', {
        description: error.message || 'Failed to start authentication. Please try again.',
      });
    }
  };

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
      <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20">
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-blue-500" />
            Dropbox
          </CardTitle>
          <CardDescription>
            Connect your Dropbox account to import audio files
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">
            Access your Dropbox audio files directly from VoiceScribe.
            We only request read access to your files.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => connectProvider('dropbox')}
            disabled={isConnecting !== null}
            className="w-full"
          >
            {isConnecting === 'dropbox' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>Connect Dropbox</>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-900/20">
          <CardTitle className="flex items-center gap-2">
            <FileCloud className="h-5 w-5 text-red-500" />
            Google Drive
          </CardTitle>
          <CardDescription>
            Connect your Google Drive account to import audio files
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground">
            Access your Google Drive audio files directly from VoiceScribe.
            We only request read access to your files.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => connectProvider('google-drive')}
            disabled={isConnecting !== null}
            className="w-full"
          >
            {isConnecting === 'google-drive' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>Connect Google Drive</>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CloudStorageConnect;
