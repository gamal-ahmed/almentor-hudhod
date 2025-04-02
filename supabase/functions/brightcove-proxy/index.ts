
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
    } else if (path === 'check-video') {
      return await handleCheckVideo(req);
    } else if (path === 'list-captions') {
      return await handleListCaptions(req);
    } else if (path === 'delete-caption') {
      return await handleDeleteCaption(req);
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

// Handle checking if a video exists in Brightcove
async function handleCheckVideo(req: Request) {
  const { videoId, accountId, accessToken } = await req.json();

  if (!videoId || !accountId || !accessToken) {
    const missingFields = {
      videoId: !videoId,
      accountId: !accountId,
      accessToken: !accessToken
    };
    console.error('Video check request missing required fields:', missingFields);
    return new Response(JSON.stringify({ error: 'Missing required fields', details: missingFields }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log(`Checking if Brightcove video ${videoId} exists...`);
    
    const apiUrl = `https://cms.api.brightcove.com/v1/accounts/${accountId}/videos/${videoId}`;
    console.log('brightcove token ', accessToken);
    console.log('Video check request details:', {
      url: apiUrl,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const responseData = await response.text();
    console.log('Brightcove video check response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseData.substring(0, 200) + (responseData.length > 200 ? '...' : '') // Truncate long response
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.error('Brightcove video not found:', videoId);
        return new Response(JSON.stringify({ error: 'Video not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      console.error('Brightcove video check error:', response.status, responseData);
      throw new Error(`Failed to check video: ${response.status} - ${responseData}`);
    }

    const videoData = JSON.parse(responseData);
    console.log('Video found:', videoId);
    
    return new Response(JSON.stringify({ 
      success: true, 
      video: { 
        id: videoData.id,
        name: videoData.name,
        duration: videoData.duration 
      } 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error checking Brightcove video:', error);
    throw error;
  }
}

// Handle Brightcove Caption Addition using Ingest API
async function handleBrightcoveCaptions(req: Request) {
  const { videoId, vttContent, language, label, accountId, accessToken, selected_transcription_url } = await req.json();

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
    console.log(`Adding caption to Brightcove video ${videoId} using Ingest API...`);
    
    // Use the provided transcription URL instead of a data URL
    const vttDataUrl = selected_transcription_url;
    
    // Request body for Brightcove Ingest API
    const requestBody = {
      text_tracks: [
        {
          url: vttDataUrl,
          srclang: language || 'ar',
          kind: 'captions',
          label: label || 'Arabic',
          default: true,
          status: 'published',
          embed_closed_caption: true
        }
      ]
    };

    // Use the Ingest API URL
    const apiUrl = `https://ingest.api.brightcove.com/v1/accounts/${accountId}/videos/${videoId}/ingest-requests`;
    console.log('Caption ingest request details:', {
      url: apiUrl,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: {
        ...requestBody,
        vttContentLength: vttContent.length
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
    console.log('Brightcove caption ingest response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseData
    });

    if (!response.ok) {
      console.error('Brightcove caption ingest error:', response.status, responseData);
      
      // Try to parse the error response to provide a better error message
      try {
        const errorData = JSON.parse(responseData);
        if (errorData.error_code === 'ILLEGAL_DATA_URL') {
          throw new Error('Cannot use data URLs directly with the Ingest API. The VTT file must be hosted on a publicly accessible URL.');
        }
        throw new Error(`Failed to add caption: ${response.status} - ${JSON.stringify(errorData)}`);
      } catch (e) {
        throw new Error(`Failed to add caption: ${response.status} - ${responseData}`);
      }
    }

    const responseJson = JSON.parse(responseData);
    console.log('Successfully initiated caption ingestion for Brightcove video');
    
    return new Response(JSON.stringify({ 
      success: true,
      ingestJobId: responseJson.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in Brightcove caption addition:', error);
    throw error;
  }
}

// Handle listing captions for a Brightcove video
async function handleListCaptions(req: Request) {
  const { videoId, accountId, accessToken } = await req.json();

  if (!videoId || !accountId || !accessToken) {
    console.error('List captions request missing required fields');
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log(`Listing captions for Brightcove video ${videoId}...`);
    
    const apiUrl = `https://cms.api.brightcove.com/v1/accounts/${accountId}/videos/${videoId}/text_tracks`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const responseData = await response.text();
    
    if (!response.ok) {
      console.error('Brightcove list captions error:', response.status, responseData);
      throw new Error(`Failed to list captions: ${response.status} - ${responseData}`);
    }

    const data = JSON.parse(responseData);
    console.log(`Found ${data.length} captions for video ${videoId}`);
    
    return new Response(JSON.stringify({ text_tracks: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error listing Brightcove captions:', error);
    throw error;
  }
}

// Handle deleting a caption from a Brightcove video
async function handleDeleteCaption(req: Request) {
  const { videoId, captionId, accountId, accessToken } = await req.json();

  if (!videoId || !captionId || !accountId || !accessToken) {
    console.error('Delete caption request missing required fields');
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    console.log(`Deleting caption ${captionId} from Brightcove video ${videoId}...`);
    
    const apiUrl = `https://cms.api.brightcove.com/v1/accounts/${accountId}/videos/${videoId}/text_tracks/${captionId}`;
    
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    // DELETE operations usually return no content on success
    if (!response.ok) {
      const responseData = await response.text();
      console.error('Brightcove delete caption error:', response.status, responseData);
      throw new Error(`Failed to delete caption: ${response.status} - ${responseData}`);
    }

    console.log(`Successfully deleted caption ${captionId} from video ${videoId}`);
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting Brightcove caption:', error);
    throw error;
  }
}
