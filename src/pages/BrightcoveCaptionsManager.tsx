
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Video, Captions, Upload, Trash2, Search } from "lucide-react";
import { 
  fetchBrightcoveKeys, 
  getBrightcoveAuthToken, 
  getVideoDetails, 
  listAudioTracksForBrightcoveVideo,
  addCaptionToBrightcove
} from "@/lib/api";
import { useLogsStore } from "@/lib/useLogsStore";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/lib/AuthContext";

interface AudioTrack {
  id: string;
  src: string;
  srclang: string;
  label: string;
  kind: string;
  default: boolean;
}

const BrightcoveCaptionsManager = () => {
  const [videoId, setVideoId] = useState("");
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [videoDetails, setVideoDetails] = useState<any>(null);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [vttUrl, setVttUrl] = useState("");
  const [uploadingCaption, setUploadingCaption] = useState(false);

  const { toast } = useToast();
  const { addLog } = useLogsStore();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You need to be logged in to access this page",
        variant: "destructive",
      });
      navigate("/signin");
    }
  }, [user, navigate, toast]);

  useEffect(() => {
    async function initBrightcove() {
      try {
        const keys = await fetchBrightcoveKeys();
        if (keys.brightcove_account_id) {
          setAccountId(keys.brightcove_account_id);
          
          const token = await getBrightcoveAuthToken(
            keys.brightcove_client_id,
            keys.brightcove_client_secret
          );
          
          setAuthToken(token);
          addLog("Brightcove authentication successful", "info");
        } else {
          toast({
            title: "Configuration Error",
            description: "Brightcove keys not properly configured",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Failed to initialize Brightcove:", error);
        addLog(`Brightcove initialization failed: ${error instanceof Error ? error.message : String(error)}`, "error");
        toast({
          title: "Authentication Failed",
          description: "Could not authenticate with Brightcove",
          variant: "destructive",
        });
      }
    }
    
    initBrightcove();
  }, [toast, addLog]);

  const fetchVideoDetails = async () => {
    if (!videoId || !authToken || !accountId) {
      toast({
        title: "Missing Information",
        description: "Please enter a video ID",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    try {
      const details = await getVideoDetails(videoId, authToken);
      setVideoDetails(details);
      addLog(`Retrieved details for video: ${videoId}`, "info");
      
      await fetchAudioTracks();
    } catch (error) {
      console.error("Error fetching video details:", error);
      addLog(`Failed to fetch video details: ${error instanceof Error ? error.message : String(error)}`, "error");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch video details",
        variant: "destructive",
      });
      setVideoDetails(null);
      setAudioTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAudioTracks = async () => {
    if (!videoId || !authToken || !accountId) return;
    
    try {
      const tracksList = await listAudioTracksForBrightcoveVideo(videoId, accountId, authToken);
      setAudioTracks(tracksList);
      addLog(`Retrieved ${tracksList.length} audio tracks for video ${videoId}`, "info");
    } catch (error) {
      console.error("Error fetching audio tracks:", error);
      addLog(`Failed to fetch audio tracks: ${error instanceof Error ? error.message : String(error)}`, "error");
      toast({
        title: "Error",
        description: "Failed to fetch audio tracks",
        variant: "destructive",
      });
      setAudioTracks([]);
    }
  };

  const handleAddCaption = async () => {
    if (!videoId || !authToken || !vttUrl) {
      toast({
        title: "Missing Information",
        description: "Please provide a video ID and VTT URL",
        variant: "destructive",
      });
      return;
    }
    
    setUploadingCaption(true);
    try {
      const tempSessionId = `caption-upload-${Date.now()}`;
      
      await addCaptionToBrightcove(
        videoId,
        tempSessionId,
        authToken,
        undefined,
        undefined,
        'en', // default language
        'English', // default label
        vttUrl
      );
      
      addLog(`Added caption to video ${videoId} using ${vttUrl}`, "info");
      toast({
        title: "Success",
        description: "Caption ingestion started successfully",
      });
      
      setVttUrl("");
      
      setTimeout(() => {
        fetchAudioTracks();
      }, 3000);
    } catch (error) {
      console.error("Error adding caption:", error);
      addLog(`Failed to add caption: ${error instanceof Error ? error.message : String(error)}`, "error");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add caption",
        variant: "destructive",
      });
    } finally {
      setUploadingCaption(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Brightcove Captions Manager</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Video Lookup
            </CardTitle>
            <CardDescription>Enter a Brightcove video ID to manage its captions</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Enter Brightcove Video ID"
                  value={videoId}
                  onChange={(e) => setVideoId(e.target.value)}
                />
              </div>
              <Button 
                onClick={fetchVideoDetails} 
                disabled={loading || !authToken || !videoId}
              >
                {loading ? "Loading..." : "Fetch Video"}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {videoDetails && (
          <>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Video Details</CardTitle>
                <CardDescription>Information about the selected video</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Video ID</Label>
                    <p className="font-medium">{videoDetails.id}</p>
                  </div>
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">Name</Label>
                    <p className="font-medium">{videoDetails.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Captions className="h-5 w-5" />
                  Audio Tracks
                </CardTitle>
                <CardDescription>Captions and audio tracks for this video</CardDescription>
              </CardHeader>
              
              <CardContent>
                {audioTracks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No audio tracks found
                  </div>
                ) : (
                  <div className="space-y-4">
                    {audioTracks.map((track) => (
                      <div key={track.id} className="border rounded-md p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{track.label || track.srclang}</h3>
                            <p className="text-sm text-muted-foreground">Language: {track.srclang}</p>
                            <p className="text-sm text-muted-foreground">Type: {track.kind}</p>
                            {track.default && (
                              <span className="inline-flex items-center px-2 py-1 mt-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {track.src && (
                          <div className="mt-2">
                            <p className="text-xs text-muted-foreground mb-1">Source URL:</p>
                            <div className="p-2 bg-secondary/20 rounded text-xs break-all">
                              {track.src}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Add Caption
                </CardTitle>
                <CardDescription>Add a new caption track to this video</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="vtt-url">Caption VTT URL</Label>
                    <Input
                      id="vtt-url"
                      placeholder="https://example.com/caption.vtt"
                      value={vttUrl}
                      onChange={(e) => setVttUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Provide a publicly accessible URL to a VTT caption file
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleAddCaption} 
                    disabled={uploadingCaption || !vttUrl || !videoId}
                  >
                    {uploadingCaption ? "Uploading..." : "Add Caption"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default BrightcoveCaptionsManager;
