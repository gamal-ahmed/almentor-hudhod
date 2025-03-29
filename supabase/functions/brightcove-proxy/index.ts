
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get URL path
  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();

  try {
    // Handle different endpoints
    if (path === 'auth') {
      return await handleBrightcoveAuth(req);
    } else if (path === 'captions') {
      return await handleBrightcoveCaptions(req);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error(`Error in brightcove-proxy (${path}):`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Handle Brightcove Authentication
async function handleBrightcoveAuth(req: Request) {
  const { client_id, client_secret } = await req.json();

  if (!client_id || !client_secret) {
    return new Response(JSON.stringify({ error: 'Missing client credentials' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('Requesting Brightcove auth token...');
    const response = await fetch('https://oauth.brightcove.com/v4/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${client_id}:${client_secret}`)}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Brightcove auth error:', response.status, errorText);
      throw new Error(`Brightcove auth failed: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Brightcove auth successful');
    
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in Brightcove auth:', error);
    throw error;
  }
}

// Handle Brightcove Caption Addition
async function handleBrightcoveCaptions(req: Request) {
  const { videoId, vttContent, language, label, accountId, accessToken } = await req.json();

  if (!videoId || !vttContent || !accountId || !accessToken) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log(`Adding caption to Brightcove video ${videoId}...`);
    
    // Create a Base64 representation of the VTT content
    const vttBase64 = btoa(unescape(encodeURIComponent(vttContent)));
    
    // Request body for Brightcove API
    const requestBody = {
      srclang: language || 'ar',
      label: label || 'Arabic',
      kind: 'captions',
      default: true,
      mime_type: 'text/vtt',
      // Use a data URI for the src
      src: `data:text/vtt;base64,${vttBase64}`
    };

    const response = await fetch(
      `https://cms.api.brightcove.com/v1/accounts/${accountId}/videos/${videoId}/text_tracks`, 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Brightcove caption error:', response.status, errorText);
      throw new Error(`Failed to add caption: ${response.status} - ${errorText}`);
    }

    console.log('Successfully added caption to Brightcove video');
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in Brightcove caption addition:', error);
    throw error;
  }
}
