
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Video, Captions, CaptionsOff, Upload, Trash2, Search } from "lucide-react";
import { 
  fetchBrightcoveKeys, 
  getBrightcoveAuthToken, 
  getVideoDetails, 
  listCaptionsForBrightcoveVideo, 
  deleteCaptionFromBrightcove 
} from "@/lib/api";
import { useLogsStore } from "@/lib/useLogsStore";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/AuthContext";
import VideoIdInput from "@/components/VideoIdInput";
import VideoDetails from "@/components/VideoDetails";
import CaptionsList from "@/components/CaptionsList";
import DirectCaptionIngestion from "@/components/DirectCaptionIngestion";

interface Caption {
  id: string;
  src: string;
  srclang: string;
  label: string;
  kind: string;
  default: boolean;
  mime_type: string;
}

const BrightcoveCaptionsManager = () => {
  const [videoId, setVideoId] = useState("");
  const [loading, setLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [videoDetails, setVideoDetails] = useState<any>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  
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
    }
  };

  const handleCaptionSuccess = () => {
    // Refresh captions list after a successful upload
    setTimeout(() => {
      fetchCaptions();
    }, 3000); // Give Brightcove time to process the ingestion
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Brightcove Caption Manager</h1>
        
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
                <VideoIdInput 
                  videoId={videoId} 
                  onChange={setVideoId} 
                  disabled={loading}
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
            <VideoDetails details={videoDetails} />
            
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
                <CaptionsList 
                  captions={captions} 
                  onDelete={handleDeleteCaption}
                  onRefresh={fetchCaptions}
                />
              </TabsContent>
              
              <TabsContent value="add">
                {authToken && videoId && (
                  <DirectCaptionIngestion
                    videoId={videoId}
                    accountId={accountId || ''}
                    authToken={authToken}
                    onSuccess={handleCaptionSuccess}
                  />
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default BrightcoveCaptionsManager;
