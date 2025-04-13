
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VideoIdInput } from '@/components/VideoIdInput';
import { VideoDetails } from '@/components/VideoDetails';
import CaptionsList from '@/components/CaptionsList';
import DirectCaptionIngestion from '@/components/DirectCaptionIngestion';
import { toast } from '@/hooks/use-toast';
import { AuthGuard } from '@/components/AuthGuard';
import { useBrightcovePublishing } from '@/hooks/useBrightcovePublishing';
import { Toaster } from '@/components/ui/toaster';

export default function BrightcoveCaptionsManager() {
  const [videoId, setVideoId] = useState<string>('');
  const [videoDetails, setVideoDetails] = useState<any>(null);
  const [captions, setCaptions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>('lookup');
  const { 
    publishCaptions, 
    fetchVideoDetails, 
    fetchCaptions, 
    processingState, 
    clearState 
  } = useBrightcovePublishing();

  // Clear states when component unmounts or tab changes
  useEffect(() => {
    return () => {
      clearState();
    };
  }, [clearState, activeTab]);

  // Handle video ID input change
  const handleVideoIdChange = (value: string) => {
    setVideoId(value);
    if (videoDetails) {
      setVideoDetails(null);
      setCaptions([]);
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

    try {
      const details = await fetchVideoDetails(videoId);
      setVideoDetails(details);
      
      // Also fetch captions if video details are found
      if (details) {
        handleFetchCaptions();
      }
    } catch (error: any) {
      toast({
        title: "Error Fetching Video",
        description: error.message || "Could not retrieve video details. Please check the ID and try again.",
        variant: "destructive"
      });
    }
  };

  // Handle fetching captions for a video
  const handleFetchCaptions = async () => {
    if (!videoId) {
      toast({
        title: "Video ID Required",
        description: "Please enter a Brightcove video ID to fetch captions.",
        variant: "destructive"
      });
      return;
    }

    try {
      const captionsData = await fetchCaptions(videoId);
      setCaptions(captionsData || []);
    } catch (error: any) {
      toast({
        title: "Error Fetching Captions",
        description: error.message || "Could not retrieve captions. Please try again.",
        variant: "destructive"
      });
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

    try {
      await publishCaptions(videoId, captionId, language);
      toast({
        title: "Captions Published",
        description: `Captions for ${label || language} have been published successfully.`,
        variant: "default"
      });
      
      // Refresh captions list after publishing
      handleFetchCaptions();
    } catch (error: any) {
      toast({
        title: "Error Publishing Captions",
        description: error.message || "Failed to publish captions. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Reset states when changing tabs
    setVideoId('');
    setVideoDetails(null);
    setCaptions([]);
    clearState();
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
                      <VideoIdInput videoId={videoId} onChange={handleVideoIdChange} />
                      <Button onClick={handleSearchVideo} disabled={processingState.isLoading}>
                        {processingState.isLoading ? "Loading..." : "Search"}
                      </Button>
                    </div>
                  </div>
                  
                  {videoDetails && (
                    <>
                      <VideoDetails video={videoDetails} />
                      
                      <div className="space-y-2 pt-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">Captions</h3>
                          <Button 
                            variant="outline" 
                            onClick={handleFetchCaptions}
                            disabled={processingState.isLoading}
                          >
                            Refresh Captions
                          </Button>
                        </div>
                        
                        <CaptionsList 
                          captions={captions} 
                          videoId={videoId} 
                          onPublish={handlePublishCaptions} 
                          isLoading={processingState.isLoading}
                        />
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="direct">
                <DirectCaptionIngestion />
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
