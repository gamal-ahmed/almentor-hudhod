
import React, { useState } from 'react';
import Header from '@/components/Header';
import { Container } from '@/components/ui/container';
import CloudStorageImporter from '@/components/cloud-storage/CloudStorageImporter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const CloudStorage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <Container className="flex-1 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cloud Storage</h1>
          <p className="text-muted-foreground mt-2">
            Connect your cloud storage accounts to import audio files directly
          </p>
        </div>
        
        <Alert variant="default" className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle>About Cloud Storage Integration</AlertTitle>
          <AlertDescription>
            VoiceScribe uses secure OAuth 2.0 to connect to your cloud storage providers. 
            We only request read access to your files and never store your passwords.
          </AlertDescription>
        </Alert>
        
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Cloud Storage Accounts</CardTitle>
                <CardDescription>
                  Connect your accounts to access audio files for transcription
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CloudStorageImporter />
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Privacy & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">How it works</h3>
                  <p className="text-sm text-muted-foreground">
                    When you connect an account, you grant VoiceScribe limited access to your files.
                    We use industry-standard OAuth 2.0 for secure authentication.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Data access</h3>
                  <p className="text-sm text-muted-foreground">
                    VoiceScribe only has read access to your files. We cannot modify or delete any content
                    in your cloud storage accounts.
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-1">Revoking access</h3>
                  <p className="text-sm text-muted-foreground">
                    You can disconnect your accounts at any time from this page or from your
                    cloud storage provider's settings.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default CloudStorage;
