import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Video, Captions, CaptionsOff, Upload, Trash2 } from "lucide-react";
import { fetchBrightcoveKeys, getBrightcoveAuthToken, getVideoDetails, listCaptionsForBrightcoveVideo, deleteCaptionFromBrightcove, addCaptionToBrightcove } from "@/lib/api";
import { useLogsStore } from "@/lib/useLogsStore";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/AuthContext";

interface Caption {
  id: string;
  src: string;
  srclang: string;
  label: string;
  kind: string;
  default: boolean;
  mime_type: string;
}

const BrightcoveCaptions = () => {
  const [videoId, setVideoId] = useState("");
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [videoDetails, setVideoDetails] = useState<any>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [vttUrl, setVttUrl] = useState("");
  const [captionLanguage, setCaptionLanguage] = useState("en");
  const [captionLabel, setCaptionLabel] = useState("English");
  const [deletingCaptionId, setDeletingCaptionId] = useState<string | null>(null);
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
      
      await fetchCaptions();
    } catch (error) {
      console.error("Error fetching video details:", error);
      addLog(`Failed to fetch video details: ${error instanceof Error ? error.message : String(error)}`, "error");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch video details",
        variant: "destructive",
      });
      setVideoDetails(null);
      setCaptions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCaptions = async () => {
    if (!videoId || !authToken || !accountId) return;
    
    try {
      const captionsList = await listCaptionsForBrightcoveVideo(videoId, accountId, authToken);
      setCaptions(captionsList);
      addLog(`Retrieved ${captionsList.length} captions for video ${videoId}`, "info");
    } catch (error) {
      console.error("Error fetching captions:", error);
      addLog(`Failed to fetch captions: ${error instanceof Error ? error.message : String(error)}`, "error");
      toast({
        title: "Error",
        description: "Failed to fetch captions",
        variant: "destructive",
      });
      setCaptions([]);
    }
  };

  const handleDeleteCaption = async (captionId: string) => {
    if (!videoId || !authToken || !accountId) return;
    
    setDeletingCaptionId(captionId);
    try {
      await deleteCaptionFromBrightcove(videoId, captionId, accountId, authToken);
      addLog(`Deleted caption ${captionId} from video ${videoId}`, "info");
      toast({
        title: "Success",
        description: "Caption deleted successfully",
      });
      
      await fetchCaptions();
    } catch (error) {
      console.error("Error deleting caption:", error);
      addLog(`Failed to delete caption: ${error instanceof Error ? error.message : String(error)}`, "error");
      toast({
        title: "Error",
        description: "Failed to delete caption",
        variant: "destructive",
      });
    } finally {
      setDeletingCaptionId(null);
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
        captionLanguage,
        captionLabel,
        vttUrl
      );
      
      addLog(`Added caption to video ${videoId} using ${vttUrl}`, "info");
      toast({
        title: "Success",
        description: "Caption ingestion started successfully",
      });
      
      setVttUrl("");
      
      setTimeout(() => {
        fetchCaptions();
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
        <h1 className="text-3xl font-bold mb-6">Brightcove Caption Manager</h1>
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
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
                  
                  {videoDetails.duration && (
                    <div>
                      <Label className="text-sm text-muted-foreground">Duration</Label>
                      <p className="font-medium">{Math.round(videoDetails.duration / 1000)} seconds</p>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-sm text-muted-foreground">Master URL Available</Label>
                    <p className="font-medium">{videoDetails.master_url ? "Yes" : "No"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Tabs defaultValue="existing" className="mb-8">
              <TabsList className="mb-4">
                <TabsTrigger value="existing" className="flex items-center gap-1">
                  <Captions className="h-4 w-4" />
                  Existing Captions
                </TabsTrigger>
                <TabsTrigger value="add" className="flex items-center gap-1">
                  <Upload className="h-4 w-4" />
                  Add Caption
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="existing">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Captions className="h-5 w-5" />
                      Existing Captions
                    </CardTitle>
                    <CardDescription>Current captions associated with this video</CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {captions.length === 0 ? (
                      <div className="text-center py-8 flex flex-col items-center">
                        <CaptionsOff className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No captions found for this video</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {captions.map((caption) => (
                          <div key={caption.id} className="border rounded-md p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{caption.label || caption.srclang}</h3>
                                <p className="text-sm text-muted-foreground">Language: {caption.srclang}</p>
                                <p className="text-sm text-muted-foreground">Type: {caption.kind}</p>
                                {caption.default && (
                                  <span className="inline-flex items-center px-2 py-1 mt-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                    Default
                                  </span>
                                )}
                              </div>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteCaption(caption.id)}
                                disabled={deletingCaptionId === caption.id}
                              >
                                {deletingCaptionId === caption.id ? (
                                  "Deleting..."
                                ) : (
                                  <>
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </>
                                )}
                              </Button>
                            </div>
                            
                            {caption.src && (
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground mb-1">Source URL:</p>
                                <div className="p-2 bg-secondary/20 rounded text-xs break-all">
                                  {caption.src}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter>
                    <Button variant="outline" onClick={fetchCaptions}>
                      Refresh Captions
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="add">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5" />
                      Add New Caption
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="caption-language">Language Code</Label>
                          <Input
                            id="caption-language"
                            placeholder="en"
                            value={captionLanguage}
                            onChange={(e) => setCaptionLanguage(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Language code (e.g., en, fr, es)
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="caption-label">Caption Label</Label>
                          <Input
                            id="caption-label"
                            placeholder="English"
                            value={captionLabel}
                            onChange={(e) => setCaptionLabel(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Display name for the caption track
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      onClick={handleAddCaption} 
                      disabled={uploadingCaption || !vttUrl || !videoId}
                    >
                      {uploadingCaption ? "Uploading..." : "Add Caption"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default BrightcoveCaptions;
