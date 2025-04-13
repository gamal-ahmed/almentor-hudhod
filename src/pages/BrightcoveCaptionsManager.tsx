import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/AuthContext";
import { Header } from "@/components/Header";
import { ArrowLeft, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import {
  fetchBrightcoveKeys,
  getBrightcoveAuthToken,
  listCaptionsForBrightcoveVideo,
  addCaptionToBrightcove,
  deleteCaptionFromBrightcove,
  getVideoDetails,
  listAudioTracksForBrightcoveVideo
} from "@/lib/api";

export default function BrightcoveCaptionsManager() {
  const { isAuthenticated, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [brightcoveKeys, setBrightcoveKeys] = useState<{
    brightcove_client_id?: string;
    brightcove_client_secret?: string;
    brightcove_account_id?: string;
  }>({});
  const [videoId, setVideoId] = useState("");
  const [videoDetails, setVideoDetails] = useState<any>(null);
  const [captionsList, setCaptionsList] = useState<any[]>([]);
  const [audioTracks, setAudioTracks] = useState<any[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedCaption, setSelectedCaption] = useState<any>(null);

  // Fetch Brightcove keys on component mount
  useEffect(() => {
    async function loadBrightcoveKeys() {
      try {
        const keys = await fetchBrightcoveKeys();
        setBrightcoveKeys(keys);
      } catch (error) {
        console.error("Error fetching Brightcove keys:", error);
        toast({
          title: "Error fetching Brightcove keys",
          description: "Failed to load Brightcove API keys. Check the console for details.",
          variant: "destructive",
        });
      }
    }

    loadBrightcoveKeys();
  }, []);

  // Check if user is an admin, redirect if not
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/signin");
    } else if (!loading && isAuthenticated && !isAdmin) {
      navigate("/app");
    } else if (!loading && isAuthenticated) {
      setIsLoading(false);
    }
  }, [isAuthenticated, loading, isAdmin, navigate]);

  const handleFetchVideoDetails = async () => {
    if (!videoId) {
      toast({
        title: "Error",
        description: "Please enter a video ID.",
        variant: "destructive",
      });
      return;
    }

    try {
      const video = await getVideoDetails(videoId);
      setVideoDetails(video);
      toast({
        title: "Video Details",
        description: `Successfully fetched details for video ID: ${videoId}.`,
      });
    } catch (error: any) {
      console.error("Error fetching video details:", error);
      toast({
        title: "Error",
        description: `Failed to fetch video details: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleListCaptions = async () => {
    if (!videoId) {
      toast({
        title: "Error",
        description: "Please enter a video ID.",
        variant: "destructive",
      });
      return;
    }

    try {
      const captions = await listCaptionsForBrightcoveVideo(videoId);
      setCaptionsList(captions);
      toast({
        title: "Captions List",
        description: `Successfully fetched captions list for video ID: ${videoId}.`,
      });
    } catch (error: any) {
      console.error("Error fetching captions list:", error);
      toast({
        title: "Error",
        description: `Failed to fetch captions list: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleListAudioTracks = async () => {
    if (!videoId) {
      toast({
        title: "Error",
        description: "Please enter a video ID.",
        variant: "destructive",
      });
      return;
    }

    try {
      const tracks = await listAudioTracksForBrightcoveVideo(videoId);
      setAudioTracks(tracks);
      toast({
        title: "Audio Tracks List",
        description: `Successfully fetched audio tracks for video ID: ${videoId}.`,
      });
    } catch (error: any) {
      console.error("Error fetching audio tracks:", error);
      toast({
        title: "Error",
        description: `Failed to fetch audio tracks: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleUploadCaption = async () => {
    if (!videoId) {
      toast({
        title: "Error",
        description: "Please enter a video ID.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTrackId) {
      toast({
        title: "Error",
        description: "Please select an audio track.",
        variant: "destructive",
      });
      return;
    }

    if (!captionText) {
      toast({
        title: "Error",
        description: "Please enter caption text.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const newCaption = await addCaptionToBrightcove(videoId, selectedTrackId, captionText, isDefault);
      setCaptionsList([...captionsList, newCaption]);
      setCaptionText("");
      toast({
        title: "Caption Uploaded",
        description: "Successfully uploaded caption to Brightcove.",
      });
    } catch (error: any) {
      console.error("Error uploading caption:", error);
      toast({
        title: "Error",
        description: `Failed to upload caption: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCaption = async () => {
    if (!videoId) {
      toast({
        title: "Error",
        description: "Please enter a video ID.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCaption) {
      toast({
        title: "Error",
        description: "Please select a caption to delete.",
        variant: "destructive",
      });
      return;
    }

    setDeleting(true);
    try {
      await deleteCaptionFromBrightcove(videoId, selectedCaption.id);
      setCaptionsList(captionsList.filter(caption => caption.id !== selectedCaption.id));
      toast({
        title: "Caption Deleted",
        description: "Successfully deleted caption from Brightcove.",
      });
    } catch (error: any) {
      console.error("Error deleting caption:", error);
      toast({
        title: "Error",
        description: `Failed to delete caption: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></span>
          <p className="text-muted-foreground">Loading Brightcove integration...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="container py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/app")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">Brightcove Captions Manager</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Video Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="video-id">Video ID</Label>
              <Input
                id="video-id"
                value={videoId}
                onChange={(e) => setVideoId(e.target.value)}
                placeholder="Enter Brightcove Video ID"
              />
            </div>
            <div className="flex gap-4">
              <Button onClick={handleFetchVideoDetails}>Fetch Video Details</Button>
              <Button onClick={handleListCaptions}>List Captions</Button>
              <Button onClick={handleListAudioTracks}>List Audio Tracks</Button>
            </div>
            {videoDetails && (
              <div className="border rounded-md p-4">
                <h3 className="text-lg font-semibold">Video Information</h3>
                <p>Name: {videoDetails.name}</p>
                <p>Description: {videoDetails.description}</p>
                <p>Duration: {videoDetails.duration}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Upload Caption</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="audio-track">Audio Track</Label>
              <Select onValueChange={setSelectedTrackId}>
                <SelectTrigger id="audio-track">
                  <SelectValue placeholder="Select an audio track" />
                </SelectTrigger>
                <SelectContent>
                  {audioTracks.map((track) => (
                    <SelectItem key={track.id} value={track.id}>
                      {track.label || track.language || track.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="caption-text">Caption Text</Label>
              <Input
                id="caption-text"
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                placeholder="Enter caption text"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="is-default" checked={isDefault} onCheckedChange={(checked) => setIsDefault(checked)} />
              <Label htmlFor="is-default">Set as Default</Label>
            </div>
            <Button onClick={handleUploadCaption} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload Caption"}
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Captions List</CardTitle>
          </CardHeader>
          <CardContent>
            {captionsList.length > 0 ? (
              <ul className="list-none space-y-2">
                {captionsList.map((caption) => (
                  <li
                    key={caption.id}
                    className={`p-3 rounded-md cursor-pointer ${selectedCaption?.id === caption.id ? "bg-secondary" : "hover:bg-muted"}`}
                    onClick={() => setSelectedCaption(caption)}
                  >
                    {caption.label || caption.language || caption.id}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No captions found for this video.</p>
            )}
            <Button
              onClick={handleDeleteCaption}
              disabled={deleting || !selectedCaption}
              className="mt-4"
              variant="destructive"
            >
              {deleting ? "Deleting..." : "Delete Selected Caption"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
