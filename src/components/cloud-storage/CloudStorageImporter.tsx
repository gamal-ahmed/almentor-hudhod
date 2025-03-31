
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import GoogleDriveImporter from './GoogleDriveImporter';
import DropboxImporter from './DropboxImporter';

interface CloudStorageImporterProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

const CloudStorageImporter: React.FC<CloudStorageImporterProps> = ({ 
  onFilesSelected, 
  isProcessing 
}) => {
  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4 space-y-4">
        <Tabs defaultValue="google-drive" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="google-drive">Google Drive</TabsTrigger>
            <TabsTrigger value="dropbox">Dropbox</TabsTrigger>
          </TabsList>
          
          <TabsContent value="google-drive" className="mt-0">
            <GoogleDriveImporter 
              onFilesSelected={onFilesSelected} 
              isProcessing={isProcessing} 
            />
          </TabsContent>
          
          <TabsContent value="dropbox" className="mt-0">
            <DropboxImporter 
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
