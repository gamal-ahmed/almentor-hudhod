
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { cloudStorageService } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';

const OAuthCallback: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { provider } = useParams<{ provider: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    const handleOAuthCallback = async () => {
      if (!isAuthenticated) {
        setError('You must be logged in to connect cloud storage accounts.');
        return;
      }

      if (!provider) {
        setError('Invalid provider specified.');
        return;
      }
      
      try {
        // Parse the code from the URL
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        
        if (!code) {
          const error = urlParams.get('error');
          throw new Error(error || 'No authorization code received');
        }
        
        // Construct the redirect URL that was originally used
        const baseUrl = window.location.origin;
        const redirectUrl = `${baseUrl}/auth/callback/${provider}`;
        
        // Exchange the code for a token
        await cloudStorageService.exchangeCodeForToken(
          provider as any, // Casting to CloudStorageProvider
          code,
          redirectUrl
        );
        
        toast.success('Cloud storage connected successfully!');
        
        // Redirect back to the original page
        const redirectPath = localStorage.getItem('cloud_storage_redirect_path') || '/cloud-storage';
        localStorage.removeItem('cloud_storage_redirect_path');
        navigate(redirectPath);
      } catch (error) {
        console.error('OAuth callback error:', error);
        setError((error as Error).message || 'Failed to connect cloud storage account');
        toast.error('Connection failed', {
          description: (error as Error).message || 'Please try again later.'
        });
      } finally {
        setIsProcessing(false);
      }
    };
    
    handleOAuthCallback();
  }, [provider, location, navigate, isAuthenticated]);
  
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-destructive/10 text-destructive rounded-lg p-4 mb-4 max-w-md text-center">
          <h2 className="text-lg font-medium mb-2">Connection Error</h2>
          <p>{error}</p>
        </div>
        <button 
          className="text-primary hover:underline"
          onClick={() => navigate('/cloud-storage')}
        >
          Return to Cloud Storage
        </button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-medium mb-2">Connecting your account</h2>
        <p className="text-muted-foreground mb-4">
          Please wait while we complete the authentication process...
        </p>
      </div>
    </div>
  );
};

export default OAuthCallback;
