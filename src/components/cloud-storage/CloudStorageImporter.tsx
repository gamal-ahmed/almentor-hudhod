
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import GoogleDriveImporter from './GoogleDriveImporter';
import DropboxImporter from './DropboxImporter';
import CloudStorageConfigForm from './CloudStorageConfig';
import { DatabaseIcon } from 'lucide-react';

interface CloudStorageImporterProps {
  onFilesSelected?: (files: File[]) => void;
  isProcessing?: boolean;
}

const CloudStorageImporter: React.FC<CloudStorageImporterProps> = ({ 
  onFilesSelected = () => {}, 
  isProcessing = false
}) => {
  const [refreshKey, setRefreshKey] = React.useState(0);
  
  const handleConfigSaved = () => {
    // Refresh the importers when config is saved
    setRefreshKey(prev => prev + 1);
  };
  
  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <DatabaseIcon className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Cloud Storage</CardTitle>
          </div>
          <CloudStorageConfigForm onConfigSaved={handleConfigSaved} />
        </div>
        <CardDescription>
          Import audio files from your cloud storage accounts
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <Tabs defaultValue="google-drive" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="google-drive">Google Drive</TabsTrigger>
            <TabsTrigger value="dropbox">Dropbox</TabsTrigger>
          </TabsList>
          
          <TabsContent value="google-drive" className="mt-0">
            <GoogleDriveImporter 
              key={`google-${refreshKey}`}
              onFilesSelected={onFilesSelected} 
              isProcessing={isProcessing} 
            />
          </TabsContent>
          
          <TabsContent value="dropbox" className="mt-0">
            <DropboxImporter 
              key={`dropbox-${refreshKey}`}
              onFilesSelected={onFilesSelected} 
              isProcessing={isProcessing} 
            />
          </TabsContent>
        </Tabs>
        
        <p className="text-xs text-center text-muted-foreground mt-2">
          Only audio files (MP3, WAV, M4A, FLAC) will be available for selection
        </p>
      </CardContent>
    </Card>
  );
};

export default CloudStorageImporter;
