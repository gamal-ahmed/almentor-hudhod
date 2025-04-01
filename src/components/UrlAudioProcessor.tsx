
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Link2, AlertCircle, Youtube, FileAudio } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface UrlAudioProcessorProps {
  onAudioProcessed: (file: File) => void;
  isProcessing?: boolean;
}

const UrlAudioProcessor: React.FC<UrlAudioProcessorProps> = ({ 
  onAudioProcessed,
  isProcessing = false 
}) => {
  const [url, setUrl] = useState('');
  const [fetchingAudio, setFetchingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectUrlType = (url: string): string | null => {
    if (!url) return null;
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    } else if (url.includes('dropbox.com')) {
      return 'dropbox';
    } else if (url.includes('drive.google.com')) {
      return 'google-drive';
    } else if (url.includes('facebook.com') || url.includes('fb.watch')) {
      return 'facebook';
    } else if (url.includes('twitter.com') || url.includes('x.com')) {
      return 'twitter';
    } else if (url.includes('.mp3') || url.includes('.wav') || url.includes('.ogg') || url.includes('.m4a')) {
      return 'direct-audio';
    }
    
    return null;
  };

  const getSourceIcon = (sourceType: string | null) => {
    switch (sourceType) {
      case 'youtube':
        return <Youtube className="h-4 w-4 text-red-500" />;
      case 'dropbox':
        // Custom Dropbox SVG icon since it's not available in lucide-react
        return (
          <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 6.296L12 10.59L18 6.296L12 2L6 6.296Z" fill="currentColor"/>
            <path d="M6 17.704L12 22L18 17.704L12 13.41L6 17.704Z" fill="currentColor"/>
            <path d="M12 10.59L6 14.885L0 10.59L6 6.296L12 10.59Z" fill="currentColor"/>
            <path d="M24 10.59L18 14.885L12 10.59L18 6.296L24 10.59Z" fill="currentColor"/>
          </svg>
        );
      case 'google-drive':
        return <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M4.5 24l4.5-8h11L15 24H4.5z"/><path fill="#0F9D58" d="M11 8l-4.5 8L2 8h9z"/><path fill="#FFCD32" d="M20 8h-9l4.5 8H24L20 8z"/><path fill="#3986F7" d="M15 16l-4.5-8L15 0l4.5 8L15 16z"/><path fill="#EA4435" d="M2 8l4.5 8 4.5-8L6.5 0 2 8z"/></svg>;
      case 'facebook':
        return <svg className="h-4 w-4 text-blue-600" viewBox="0 0 24 24"><path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
      case 'twitter':
        return <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24"><path fill="currentColor" d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>;
      case 'direct-audio':
        return <FileAudio className="h-4 w-4 text-green-500" />;
      default:
        return <Link2 className="h-4 w-4 text-primary" />;
    }
  };

  const processUrl = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    const urlType = detectUrlType(url);
    if (!urlType) {
      setError('Unsupported URL type. Please use YouTube, Dropbox, Google Drive, Facebook, Twitter/X, or a direct audio URL');
      return;
    }

    setFetchingAudio(true);
    setError(null);

    try {
      // Call our edge function to process the URL
      const { data, error: functionError } = await supabase.functions.invoke('url-audio-processor', {
        body: { url, sourceType: urlType }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to process URL');
      }

      if (!data || !data.audioUrl) {
        throw new Error('No audio data received');
      }

      // Download the processed audio file
      const response = await fetch(data.audioUrl);
      const blob = await response.blob();
      
      // Create a file object from the blob
      const filename = data.filename || `audio-${Date.now()}.mp3`;
      const file = new File([blob], filename, { type: 'audio/mpeg' });
      
      // Pass the file to the parent component
      onAudioProcessed(file);
      
      toast.success('Audio extracted successfully!');
      setUrl('');

    } catch (error) {
      console.error('Error processing URL:', error);
      setError((error as Error).message || 'Failed to process URL');
      toast.error('Error processing audio from URL', {
        description: (error as Error).message || 'Please try another URL or upload directly'
      });
    } finally {
      setFetchingAudio(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center mb-2">
        <Link2 className="h-4 w-4 text-primary mr-2" />
        <h3 className="text-sm font-medium">Extract Audio from URL</h3>
      </div>
      
      <div className="flex gap-2">
        <div className="relative flex-grow">
          <Input
            placeholder="Paste YouTube, Dropbox, Drive, Facebook, or Twitter/X URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={fetchingAudio || isProcessing}
            className="flex-grow pl-9"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !fetchingAudio && !isProcessing && url.trim()) {
                processUrl();
              }
            }}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {getSourceIcon(detectUrlType(url))}
          </div>
        </div>
        <Button 
          onClick={processUrl} 
          disabled={fetchingAudio || isProcessing || !url.trim()}
          className="shrink-0"
          variant="default"
        >
          {fetchingAudio ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4 mr-2" />
              Extract
            </>
          )}
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="mt-1 text-xs text-muted-foreground">
        <p>Supported: YouTube, Dropbox, Google Drive, Facebook, Twitter/X, and direct audio URLs</p>
      </div>
    </div>
  );
};

export default UrlAudioProcessor;
