
import { API_ENDPOINTS, SUPABASE_KEY } from "./utils";

// Fetch Brightcove keys from Supabase
export async function fetchBrightcoveKeys() {
  try {
    const response = await fetch(
      'https://xbwnjfdzbnyvaxmqufrw.supabase.co/rest/v1/transcription_integrations?select=key_name%2Ckey_value&key_name=in.%28brightcove_client_id%2Cbrightcove_client_secret%2Cbrightcove_account_id%29',
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Brightcove keys: ${response.statusText}`);
    }
    
    const data = await response.json();
    const keys = data.reduce((acc: Record<string, string>, item: { key_name: string, key_value: string }) => {
      acc[item.key_name] = item.key_value;
      return acc;
    }, {});
    
    return keys;
  } catch (error) {
    console.error('Error fetching Brightcove keys:', error);
    throw error;
  }
}

// Get Brightcove Auth Token using our proxy
export async function getBrightcoveAuthToken(clientId: string, clientSecret: string) {
  try {
    const response = await fetch(`${API_ENDPOINTS.BRIGHTCOVE_PROXY_URL}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret
      }),
    });
    
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'Unable to get error details';
      }
      
      throw new Error(`Failed to get Brightcove token: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting Brightcove token:', error);
    throw error;
  }
}

// Add caption to Brightcove video using our proxy and Ingest API with simplified parameters
export async function addCaptionToBrightcove(
  videoId: string,
  sessionId: string,
  accessToken: string
) {
  try {
    // Validate inputs
    if (!videoId || !sessionId || !accessToken) {
      throw new Error('Missing required parameters for adding caption');
    }
    
    // First, check if the video exists to provide better error messages
    const { brightcove_account_id } = await fetchBrightcoveKeys();
    
    const checkResponse = await fetch(`${API_ENDPOINTS.BRIGHTCOVE_PROXY_URL}/check-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        videoId,
        accountId: brightcove_account_id,
        accessToken
      }),
    });
    
    if (!checkResponse.ok) {
      if (checkResponse.status === 404) {
        throw new Error(`Video ID ${videoId} not found in Brightcove. Please check the ID and try again.`);
      }
      
      const errorText = await checkResponse.text();
      throw new Error(`Error checking video: ${checkResponse.status} - ${errorText}`);
    }
    
    // Once we know the video exists, add the caption using the Ingest API
    const response = await fetch(`${API_ENDPOINTS.BRIGHTCOVE_PROXY_URL}/captions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        videoId,
        accessToken,
        sessionId
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      
      // Handle different error cases
      if (response.status === 409) {
        throw new Error('A caption track with this language already exists. Please delete it first or choose a different language.');
      } else if (response.status === 413) {
        throw new Error('The caption file is too large. Please reduce the size and try again.');
      } else {
        throw new Error(`Failed to add caption: ${response.status} - ${errorText}`);
      }
    }
    
    // Get the response data to check for the ingest job ID
    const responseData = await response.json();
    console.log('Caption ingestion started:', responseData);
    
    return responseData;
  } catch (error) {
    console.error('Error adding caption to Brightcove:', error);
    throw error;
  }
}

// Delete caption from Brightcove video
export async function deleteCaptionFromBrightcove(
  videoId: string,
  captionId: string,
  accountId: string,
  accessToken: string
) {
  try {
    const response = await fetch(`${API_ENDPOINTS.BRIGHTCOVE_PROXY_URL}/delete-caption`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        videoId,
        captionId,
        accountId,
        accessToken
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete caption: ${response.status} - ${errorText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting caption from Brightcove:', error);
    throw error;
  }
}

// List captions for a video
export async function listCaptionsForBrightcoveVideo(
  videoId: string,
  accountId: string,
  accessToken: string
) {
  try {
    const response = await fetch(`${API_ENDPOINTS.BRIGHTCOVE_PROXY_URL}/list-captions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        videoId,
        accountId,
        accessToken
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to list captions: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    return data.text_tracks || [];
  } catch (error) {
    console.error('Error listing captions for Brightcove video:', error);
    throw error;
  }
}
