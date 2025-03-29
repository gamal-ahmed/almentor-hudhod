
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
    console.error('Auth request missing credentials:', { client_id: !!client_id, client_secret: !!client_secret });
    return new Response(JSON.stringify({ error: 'Missing client credentials' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log('Requesting Brightcove auth token...');
    console.log('Auth request details:', {
      url: 'https://oauth.brightcove.com/v4/access_token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${client_id}:${client_secret}`)}`,
      }
    });

    const response = await fetch('https://oauth.brightcove.com/v4/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${client_id}:${client_secret}`)}`,
      },
      body: 'grant_type=client_credentials',
    });

    const responseData = await response.text();
    console.log('Brightcove auth response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseData
    });

    if (!response.ok) {
      console.error('Brightcove auth error:', response.status, responseData);
      throw new Error(`Brightcove auth failed: ${response.statusText} - ${responseData}`);
    }

    const data = JSON.parse(responseData);
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
    const missingFields = {
      videoId: !videoId,
      vttContent: !vttContent,
      accountId: !accountId,
      accessToken: !accessToken
    };
    console.error('Caption request missing required fields:', missingFields);
    return new Response(JSON.stringify({ error: 'Missing required fields', details: missingFields }), {
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
      src: `data:text/vtt;base64,${vttBase64}`
    };

    const apiUrl = `https://cms.api.brightcove.com/v1/accounts/${accountId}/videos/${videoId}/text_tracks`;
    console.log('Caption request details:', {
      url: apiUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: {
        ...requestBody,
        vttContentLength: vttContent.length,
        base64Length: vttBase64.length
      }
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.text();
    console.log('Brightcove caption response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseData
    });

    if (!response.ok) {
      console.error('Brightcove caption error:', response.status, responseData);
      throw new Error(`Failed to add caption: ${response.status} - ${responseData}`);
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
