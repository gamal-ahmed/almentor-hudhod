
import { TranscriptionModel } from "@/components/ModelSelector";

// API endpoints (using Supabase Edge Functions)
const OPENAI_TRANSCRIBE_URL = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/openai-transcribe';
const GEMINI_TRANSCRIBE_URL = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/gemini-transcribe';
const S3_UPLOAD_URL = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/s3-upload';

// Supabase API key for authentication
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhid25qZmR6Ym55dmF4bXF1ZnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4MTU5ODIsImV4cCI6MjA1ODM5MTk4Mn0.4-BgbiXxUcR6k7zMRpC1BPRKapqrai6LsOxETi_hYtk';

// Fetch keys from Supabase
export async function fetchS3Keys() {
  try {
    const response = await fetch(
      'https://xbwnjfdzbnyvaxmqufrw.supabase.co/rest/v1/transcription_integrations?select=key_name%2Ckey_value&key_name=in.%28s3_access_key_id%2Cs3_secret_access_key%29',
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch S3 keys: ${response.statusText}`);
    }
    
    const data = await response.json();
    const keys = data.reduce((acc: Record<string, string>, item: { key_name: string, key_value: string }) => {
      acc[item.key_name] = item.key_value;
      return acc;
    }, {});
    
    return keys;
  } catch (error) {
    console.error('Error fetching S3 keys:', error);
    throw error;
  }
}

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

// Transcribe audio using selected model
export async function transcribeAudio(file: File, model: TranscriptionModel, prompt = "") {
  const formData = new FormData();
  formData.append('audio', file);
  formData.append('prompt', prompt);
  
  const url = model === 'openai' ? OPENAI_TRANSCRIBE_URL : GEMINI_TRANSCRIBE_URL;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.vttContent;
  } catch (error) {
    console.error(`Error in ${model} transcription:`, error);
    throw error;
  }
}

// Upload a file to S3
export async function uploadToS3(file: File, key: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('key', key);
  formData.append('bucket', 'videos-transcriptions-dev');
  formData.append('region', 'us-east-1');
  
  try {
    const response = await fetch(S3_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Accept': 'application/json',
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`S3 upload failed: ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}

// Get Brightcove Auth Token
export async function getBrightcoveAuthToken(clientId: string, clientSecret: string) {
  try {
    const response = await fetch('https://oauth.brightcove.com/v4/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: 'grant_type=client_credentials',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get Brightcove token: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting Brightcove token:', error);
    throw error;
  }
}

// Add caption to Brightcove video
export async function addCaptionToBrightcove(
  videoId: string, 
  captionUrl: string, 
  language = 'ar', 
  label = 'Arabic',
  accountId: string,
  accessToken: string
) {
  try {
    const response = await fetch(
      `https://cms.api.brightcove.com/v1/accounts/${accountId}/videos/${videoId}/text_tracks`, 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          remote_url: captionUrl,
          srclang: language,
          label,
          kind: 'captions',
          default: true,
          mime_type: 'text/vtt'
        }),
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add caption: ${response.statusText} - ${errorText}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error adding caption to Brightcove:', error);
    throw error;
  }
}
