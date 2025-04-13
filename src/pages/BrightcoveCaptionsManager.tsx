
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VideoIdInput from '@/components/VideoIdInput';
import VideoDetails from '@/components/VideoDetails';
import CaptionsList from '@/components/CaptionsList';
import DirectCaptionIngestion from '@/components/DirectCaptionIngestion';
import { toast } from '@/hooks/use-toast';
import AuthGuard from '@/components/AuthGuard';
import { useBrightcovePublishing } from '@/hooks/useBrightcovePublishing';
import { Toaster } from '@/components/ui/toaster';
import { fetchBrightcoveKeys, getBrightcoveAuthToken, getVideoDetails, listCaptionsForBrightcoveVideo } from '@/lib/api';

export default function BrightcoveCaptionsManager() {
  const [videoId, setVideoId] = useState<string>('');
  const [videoDetails, setVideoDetails] = useState<any>(null);
  const [captions, setCaptions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>('lookup');
  const [accountId, setAccountId] = useState<string>('');
  const [authToken, setAuthToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const { publishToBrightcove } = useBrightcovePublishing();

  // Clear states when component unmounts or tab changes
  useEffect(() => {
    return () => {
      clearStates();
    };
  }, [activeTab]);

  const clearStates = () => {
    // Reset state values
    setVideoId('');
    setVideoDetails(null);
    setCaptions([]);
    setIsLoading(false);
  };

  // Handle video ID input change
  const handleVideoIdChange = (value: string) => {
    setVideoId(value);
    if (videoDetails) {
      setVideoDetails(null);
      setCaptions([]);
    }
  };

  // Initialize auth tokens
  const initializeAuth = async () => {
    try {
      const keys = await fetchBrightcoveKeys();
      const token = await getBrightcoveAuthToken(
        keys.brightcove_client_id, 
        keys.brightcove_client_secret
      );
      setAccountId(keys.brightcove_account_id);
      setAuthToken(token);
      return { accountId: keys.brightcove_account_id, token };
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: error.message || "Could not authenticate with Brightcove",
        variant: "destructive"
      });
      return null;
    }
  };

  // Handle searching for a video
  const handleSearchVideo = async () => {
    if (!videoId) {
      toast({
        title: "Video ID Required",
        description: "Please enter a Brightcove video ID to continue.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const auth = await initializeAuth();
      if (!auth) return;
      
      const details = await getVideoDetails(videoId, auth.token);
      setVideoDetails(details);
      
      // Also fetch captions if video details are found
      if (details) {
        await handleFetchCaptions(auth.accountId, auth.token);
      }
    } catch (error: any) {
      toast({
        title: "Error Fetching Video",
        description: error.message || "Could not retrieve video details. Please check the ID and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle fetching captions for a video
  const handleFetchCaptions = async (acctId?: string, token?: string) => {
    if (!videoId) {
      toast({
        title: "Video ID Required",
        description: "Please enter a Brightcove video ID to fetch captions.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const auth = !acctId || !token ? await initializeAuth() : { accountId: acctId, token };
      if (!auth) return;
      
      const captionsData = await listCaptionsForBrightcoveVideo(
        videoId, 
        auth.accountId, 
        auth.token
      );
      setCaptions(captionsData || []);
    } catch (error: any) {
      toast({
        title: "Error Fetching Captions",
        description: error.message || "Could not retrieve captions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle publishing captions to Brightcove
  const handlePublishCaptions = async (captionId: string, language: string, label: string) => {
    if (!videoId || !captionId) {
      toast({
        title: "Missing Information",
        description: "Video ID and caption ID are required to publish captions.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await publishToBrightcove(videoId, captionId, language);
      toast({
        title: "Captions Published",
        description: `Captions for ${label || language} have been published successfully.`,
        variant: "default"
      });
      
      // Refresh captions list after publishing
      await handleFetchCaptions();
    } catch (error: any) {
      toast({
        title: "Error Publishing Captions",
        description: error.message || "Failed to publish captions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Reset states when changing tabs
    clearStates();
  };

  // Handle delete caption
  const handleDeleteCaption = async (captionId: string) => {
    // Implementation would go here
    console.log('Delete caption:', captionId);
  };

  // Handle caption refresh
  const handleRefreshCaptions = async () => {
    await handleFetchCaptions();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-8 px-4 md:px-8">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-2xl">Brightcove Captions Manager</CardTitle>
            <CardDescription>
              Fetch, view, and manage captions for Brightcove videos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="mb-6">
                <TabsTrigger value="lookup">Video Lookup</TabsTrigger>
                <TabsTrigger value="direct">Direct Upload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="lookup" className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="videoId">Video ID</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="videoId"
                        value={videoId}
                        onChange={(e) => handleVideoIdChange(e.target.value)}
                        placeholder="Enter Brightcove video ID"
                        className="shadow-inner-soft focus:ring-2 focus:ring-primary/30"
                      />
                      <Button onClick={handleSearchVideo} disabled={isLoading}>
                        {isLoading ? "Loading..." : "Search"}
                      </Button>
                    </div>
                  </div>
                  
                  {videoDetails && (
                    <>
                      <VideoDetails details={videoDetails} />
                      
                      <div className="space-y-2 pt-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">Captions</h3>
                          <Button 
                            variant="outline" 
                            onClick={handleRefreshCaptions}
                            disabled={isLoading}
                          >
                            Refresh Captions
                          </Button>
                        </div>
                        
                        <CaptionsList 
                          captions={captions} 
                          onDelete={handleDeleteCaption} 
                          onRefresh={handleRefreshCaptions}
                        />
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="direct">
                {authToken && accountId ? (
                  <DirectCaptionIngestion 
                    videoId={videoId}
                    accountId={accountId}
                    authToken={authToken}
                    onSuccess={handleRefreshCaptions}
                  />
                ) : (
                  <Button onClick={initializeAuth}>Connect to Brightcove</Button>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="border-t pt-6 flex flex-col items-start">
            <p className="text-sm text-muted-foreground">
              Note: Caption files must be in WebVTT (.vtt) format. For more information about 
              Brightcove captions, refer to the Brightcove documentation.
            </p>
          </CardFooter>
        </Card>
      </main>
      <Toaster />
    </div>
  );
}
