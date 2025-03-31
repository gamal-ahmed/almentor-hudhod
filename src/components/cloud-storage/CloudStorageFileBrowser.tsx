
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CloudStorageAccount, CloudStorageFile, CloudStorageProvider } from '@/types/cloudStorage';
import { FileAudio, ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { cloudStorageService } from '@/lib/api/cloudStorageService';
import { toast } from 'sonner';
import { formatBytes } from '@/lib/utils';

interface CloudStorageFileBrowserProps {
  account: CloudStorageAccount;
  onBack: () => void;
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

const CloudStorageFileBrowser: React.FC<CloudStorageFileBrowserProps> = ({ 
  account, 
  onBack,
  onFileSelect,
  isProcessing
}) => {
  const [files, setFiles] = useState<CloudStorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const filesList = await cloudStorageService.listFiles(
        account.provider, 
        account.id, 
        currentFolderId
      );
      setFiles(filesList);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Error loading files', {
        description: error.message || 'Failed to load files from your account. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [account.id, account.provider, currentFolderId]);

  const handleFileSelect = async (file: CloudStorageFile) => {
    try {
      setDownloadingFileId(file.id);
      
      // Download the file
      const blob = await cloudStorageService.downloadFile(
        account.provider,
        account.id,
        file.id
      );
      
      // Convert the blob to a File object
      const fileObject = new File([blob], file.name, { type: file.mimeType });
      
      // Pass the file to the parent component
      onFileSelect(fileObject);
      toast.success('File imported successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Error importing file', {
        description: error.message || 'Failed to download the file. Please try again.',
      });
    } finally {
      setDownloadingFileId(null);
    }
  };

  const getProviderName = (provider: CloudStorageProvider) => {
    switch (provider) {
      case 'google-drive':
        return 'Google Drive';
      case 'dropbox':
        return 'Dropbox';
      default:
        return 'Cloud Storage';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-medium">
            {getProviderName(account.provider)}: {account.name}
          </h3>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchFiles}
          disabled={loading}
          className="h-8"
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center animate-pulse">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm font-medium">Loading files...</p>
          </div>
        </div>
      ) : files.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-3 mb-3">
              <FileAudio className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">No audio files found</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              We couldn't find any audio files in this location. Audio files include MP3, WAV, M4A, OGG, and FLAC formats.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {files.map((file) => (
            <Button
              key={file.id}
              variant="outline"
              className="justify-start h-auto py-2 px-3 text-left"
              onClick={() => handleFileSelect(file)}
              disabled={isProcessing || !!downloadingFileId}
            >
              <div className="flex items-center gap-3 w-full">
                <FileAudio className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                <div className="flex-grow min-w-0">
                  <div className="font-medium truncate">{file.name}</div>
                  <div className="text-xs text-muted-foreground flex gap-1">
                    <span>{formatBytes(file.size)}</span>
                  </div>
                </div>
                {downloadingFileId === file.id && (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                )}
              </div>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CloudStorageFileBrowser;
