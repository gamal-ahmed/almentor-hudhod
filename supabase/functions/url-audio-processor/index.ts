
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.4.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? '';
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, sourceType } = await req.json();

    if (!url) {
      throw new Error("URL is required");
    }

    console.log(`Processing ${sourceType} URL: ${url}`);

    let audioUrl: string;
    let filename: string;

    // Process based on URL type
    switch (sourceType) {
      case "youtube":
        ({ audioUrl, filename } = await processYouTubeUrl(url));
        break;
      case "dropbox":
        ({ audioUrl, filename } = await processDropboxUrl(url));
        break;
      case "google-drive":
        ({ audioUrl, filename } = await processGoogleDriveUrl(url));
        break;
      case "facebook":
        ({ audioUrl, filename } = await processFacebookUrl(url));
        break;
      case "twitter":
        ({ audioUrl, filename } = await processTwitterUrl(url));
        break;
      case "direct-audio":
        ({ audioUrl, filename } = await processDirectAudioUrl(url));
        break;
      default:
        throw new Error(`Unsupported source type: ${sourceType}`);
    }

    return new Response(
      JSON.stringify({ audioUrl, filename }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing URL:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Helper function to extract video ID from YouTube URL
function extractYouTubeVideoId(url: string): string {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : "";
}

// Process YouTube URL using an external service
async function processYouTubeUrl(url: string): Promise<{ audioUrl: string; filename: string }> {
  const videoId = extractYouTubeVideoId(url);
  
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }
  
  // Temporary solution: Use a YouTube to MP3 API service
  // Note: In a production app, you'd want to implement proper YouTube API integration
  const apiUrl = `https://youtube-mp3-download1.p.rapidapi.com/dl?id=${videoId}`;
  
  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": Deno.env.get("RAPIDAPI_KEY") || "",
      "X-RapidAPI-Host": "youtube-mp3-download1.p.rapidapi.com",
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to extract audio from YouTube: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.link) {
    throw new Error("Could not extract audio from this YouTube video");
  }
  
  return {
    audioUrl: data.link,
    filename: `youtube-${videoId}.mp3`,
  };
}

// Process direct audio URL
async function processDirectAudioUrl(url: string): Promise<{ audioUrl: string; filename: string }> {
  // Check if URL is accessible
  const response = await fetch(url, { method: "HEAD" });
  
  if (!response.ok) {
    throw new Error("Could not access the audio URL");
  }
  
  // Extract filename from URL or use default
  const urlObj = new URL(url);
  const pathSegments = urlObj.pathname.split("/");
  const filenameFromUrl = pathSegments[pathSegments.length - 1];
  
  return {
    audioUrl: url,
    filename: filenameFromUrl || `audio-${Date.now()}.mp3`,
  };
}

// Process Dropbox URL
async function processDropboxUrl(url: string): Promise<{ audioUrl: string; filename: string }> {
  // Convert share URL to direct download URL
  let directUrl = url.replace("dropbox.com", "dl.dropboxusercontent.com");
  
  // If URL contains ?dl=0, replace with ?dl=1, otherwise add it
  if (directUrl.includes("?dl=0")) {
    directUrl = directUrl.replace("?dl=0", "?dl=1");
  } else if (!directUrl.includes("?dl=1")) {
    directUrl += "?dl=1";
  }
  
  // Verify the URL works
  const response = await fetch(directUrl, { method: "HEAD" });
  
  if (!response.ok) {
    throw new Error("Could not access the Dropbox file");
  }
  
  // Extract filename from URL
  const urlObj = new URL(url);
  const pathSegments = urlObj.pathname.split("/");
  const filenameFromUrl = pathSegments[pathSegments.length - 1];
  
  return {
    audioUrl: directUrl,
    filename: filenameFromUrl || `dropbox-audio-${Date.now()}.mp3`,
  };
}

// Process Google Drive URL
async function processGoogleDriveUrl(url: string): Promise<{ audioUrl: string; filename: string }> {
  // Extract file ID from Google Drive URL
  const fileIdMatch = url.match(/\/d\/(.*?)\//) || url.match(/id=(.*?)(&|$)/);
  
  if (!fileIdMatch) {
    throw new Error("Invalid Google Drive URL");
  }
  
  const fileId = fileIdMatch[1];
  const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  
  // For files that might trigger the virus scan warning, we'd need a more complex solution
  // This basic approach works for smaller files
  
  return {
    audioUrl: directUrl,
    filename: `drive-${fileId}.mp3`,
  };
}

// Process Facebook URL
async function processFacebookUrl(url: string): Promise<{ audioUrl: string; filename: string }> {
  // Facebook requires authentication to access content
  // This is a placeholder implementation
  throw new Error("Facebook URL processing is not fully implemented. Please download the audio manually and upload it directly.");
}

// Process Twitter/X URL
async function processTwitterUrl(url: string): Promise<{ audioUrl: string; filename: string }> {
  // Twitter/X requires authentication to access content
  // This is a placeholder implementation
  throw new Error("Twitter/X URL processing is not fully implemented. Please download the audio manually and upload it directly.");
}
