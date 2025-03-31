
import React from 'react';
import Header from "@/components/Header";
import { CloudStorageConfig } from "@/components/cloud-storage/CloudStorageConfig";
import { CloudStorageImporter } from "@/components/cloud-storage/CloudStorageImporter";
import { 
  getConnectionStatus, 
  isPlatformConfigured 
} from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Cloud, 
  HardDrive, 
  Settings,
  GoogleDrive,
  Dropbox
} from "lucide-react";

const CloudStoragePage = () => {
  const connectionStatus = getConnectionStatus();
  const googleDriveConfigured = isPlatformConfigured('googleDrive');
  const dropboxConfigured = isPlatformConfigured('dropbox');

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-muted/20">
      <Header />
      
      <main className="flex-1 container max-w-6xl py-8 px-4">
        <div className="mb-8 animate-fade-in">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Cloud className="h-3.5 w-3.5" />
            <span>Cloud Storage Integration</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-3">
            Manage Cloud Storage
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Connect and manage your cloud storage accounts to easily import files for transcription.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          <div className="lg:col-span-4 space-y-6">
            <Card className="border shadow-soft overflow-hidden bg-card/95 backdrop-blur-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="bg-primary/5 border-b border-border/50 pb-4">
                <CardTitle className="flex items-center text-xl font-medium">
                  <Settings className="mr-2 h-5 w-5 text-primary" />
                  Storage Configuration
                </CardTitle>
                <CardDescription>
                  Configure your cloud storage credentials
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-6">
                <CloudStorageConfig />
              </CardContent>
            </Card>

            <Card className="border shadow-soft overflow-hidden bg-card/95 backdrop-blur-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="p-4 border-b">
                <CardTitle className="text-base">Connection Status</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GoogleDrive className="h-5 w-5 text-blue-500" />
                    <span>Google Drive</span>
                  </div>
                  {googleDriveConfigured ? (
                    connectionStatus.googleDrive ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                        Configured
                      </Badge>
                    )
                  ) : (
                    <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20">
                      Not Configured
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Dropbox className="h-5 w-5 text-blue-600" />
                    <span>Dropbox</span>
                  </div>
                  {dropboxConfigured ? (
                    connectionStatus.dropbox ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                        Configured
                      </Badge>
                    )
                  ) : (
                    <Badge variant="outline" className="bg-slate-500/10 text-slate-500 border-slate-500/20">
                      Not Configured
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-8">
            <Card className="border shadow-soft bg-card/95 backdrop-blur-sm hover:shadow-md transition-shadow duration-300">
              <CardHeader className="bg-green-500/5 border-b border-border/50 pb-4">
                <CardTitle className="text-xl font-medium flex items-center">
                  <HardDrive className="mr-2 h-5 w-5 text-green-500" />
                  Import Files
                </CardTitle>
                <CardDescription>
                  Import files from your connected cloud storage
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-6">
                <Tabs defaultValue="import" className="w-full">
                  <TabsList className="grid w-full max-w-md grid-cols-1 mb-4">
                    <TabsTrigger value="import" className="text-base py-2">
                      File Browser
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="import" className="space-y-4">
                    <CloudStorageImporter />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="py-6 border-t bg-gradient-to-r from-background to-secondary/30 backdrop-blur-sm mt-auto">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">VoiceScribe — Cloud Storage</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Support</a>
            <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} VoiceScribe</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CloudStoragePage;
