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

  const url = new URL(req.url);
  const endpoint = url.pathname.split('/').pop();

  try {
    if (endpoint === 'auth') {
      return await handleBrightcoveAuth(req);
    } else if (endpoint === 'captions') {
      return await handleBrightcoveCaptions(req);
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid endpoint" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error(`Error in brightcove-proxy (${endpoint}):`, error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Handle Brightcove authentication
async function handleBrightcoveAuth(req: Request) {
  try {
    const { client_id, client_secret } = await req.json();
    
    if (!client_id || !client_secret) {
      throw new Error("Missing client ID or client secret");
    }
    
    console.log("Requesting Brightcove auth token...");
    
    // Encode credentials for Basic Auth
    const credentials = btoa(`${client_id}:${client_secret}`);
    
    // Request body for auth token
    const reqBody = "grant_type=client_credentials";
    
    const requestDetails = {
      url: "https://oauth.brightcove.com/v4/access_token",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${credentials}`
      }
    };
    
    console.log("Auth request details:", JSON.stringify(requestDetails, null, 2));
    
    // Request auth token
    const response = await fetch(requestDetails.url, {
      method: requestDetails.method,
      headers: requestDetails.headers,
      body: reqBody
    });
    
    console.log("Brightcove auth response:", JSON.stringify(response, null, 2));
    
    if (!response.ok) {
      throw new Error(`Failed to get auth token: ${response.status} - ${await response.text()}`);
    }
    
    const data = await response.json();
    console.log("Brightcove auth successful");
    
    return new Response(
      JSON.stringify(data),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in Brightcove authentication:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
}

// Handle adding captions to Brightcove videos
async function handleBrightcoveCaptions(req: Request) {
  try {
    // Parse request body
    const requestBody = await req.json();
    const { 
      videoId, 
      vttContent, 
      vttUrl,
      language = "ar", 
      label = "Arabic", 
      accountId, 
      accessToken,
      useUrl = false
    } = requestBody;
    
    if (!videoId || (!vttContent && !vttUrl) || !accountId || !accessToken) {
      throw new Error("Missing required parameters");
    }
    
    console.log(`Adding caption to Brightcove video ${videoId}...`);
    
    let captionData: any = {
      srclang: language,
      label: label,
      kind: "captions",
      default: true,
      mime_type: "text/vtt"
    };
    
    if (useUrl && vttUrl) {
      // Use the URL directly if provided and useUrl is true
      captionData.src = vttUrl;
      console.log(`Using external VTT URL: ${vttUrl}`);
    } else {
      // Otherwise use inline base64 encoded content
      // Encode the VTT content as base64
      const vttContentLength = vttContent.length;
      const encoder = new TextEncoder();
      const vttBytes = encoder.encode(vttContent);
      const base64Content = btoa(String.fromCharCode(...vttBytes));
      const base64Length = base64Content.length;
      
      captionData.src = `data:text/vtt;base64,${base64Content}`;
      captionData.vttContentLength = vttContentLength;
      captionData.base64Length = base64Length;
    }
    
    const requestDetails = {
      url: `https://cms.api.brightcove.com/v1/accounts/${accountId}/videos/${videoId}/text_tracks`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: captionData
    };
    
    console.log("Caption request details:", JSON.stringify(requestDetails, null, 2));
    
    // Make the request to Brightcove
    const response = await fetch(requestDetails.url, {
      method: requestDetails.method,
      headers: requestDetails.headers,
      body: JSON.stringify(requestDetails.body)
    });
    
    console.log("Brightcove caption response:", JSON.stringify(response, null, 2));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Brightcove caption error:", response.status, errorText);
      throw new Error(`Failed to add caption: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Save this upload in the database for tracking
    const { error: dbError } = await supabase
      .from('caption_uploads')
      .insert({
        video_id: videoId,
        language: language,
        label: label,
        brightcove_track_id: data.id,
        brightcove_response: data,
        s3_url: useUrl ? vttUrl : null,
        s3_key: useUrl ? `transcriptions/${videoId}.vtt` : null
      });
    
    if (dbError) {
      console.warn("Failed to record caption upload in database:", dbError);
    }
    
    return new Response(
      JSON.stringify({
        message: "Caption added successfully",
        track_id: data.id
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in Brightcove caption addition:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
}
