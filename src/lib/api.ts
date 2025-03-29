import { TranscriptionModel } from "@/components/ModelSelector";

// API endpoints (using Supabase Edge Functions)
const OPENAI_TRANSCRIBE_URL = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/openai-transcribe';
const GEMINI_TRANSCRIBE_URL = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/gemini-transcribe';
const S3_UPLOAD_URL = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/s3-upload';
const GET_PRESIGNED_URL = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/get-presigned-url';

// Supabase API key for authentication
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhid25qZmR6Ym55dmF4bXF1ZnJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4MTU5ODIsImV4cCI6MjA1ODM5MTk4Mn0.4-BgbiXxUcR6k7zMRpC1BPRKapqrai6LsOxETi_hYtk';

// Configuration for direct S3 upload
const S3_BUCKET = 'videos-transcriptions-dev';
const S3_REGION = 'us-east-1';
const S3_ENDPOINT = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;

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

// Get a pre-signed URL for direct S3 upload
export async function getPresignedUrl(filename: string, contentType: string, headers = {}) {
  try {
    const url = `${GET_PRESIGNED_URL}?filename=${encodeURIComponent(filename)}&contentType=${encodeURIComponent(contentType)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Accept': 'application/json',
        ...headers
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get pre-signed URL: ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting pre-signed URL:', error);
    throw error;
  }
}

// Upload file directly to S3 using a pre-signed URL
export async function uploadToS3Direct(file: File, presignedUrl: string, onProgress?: (progress: number) => void) {
  try {
    // Use XMLHttpRequest for upload progress monitoring
    if (onProgress) {
      return new Promise<boolean>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            onProgress(percentComplete);
          }
        });
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(true);
          } else {
            reject(new Error(`Direct S3 upload failed with status ${xhr.status}: ${xhr.responseText}`));
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('XHR error during direct S3 upload'));
        });
        
        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });
    } else {
      // Standard fetch approach when progress isn't needed
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Direct S3 upload failed: ${response.statusText} - ${errorText}`);
      }
      
      return true;
    }
  } catch (error) {
    console.error('Error in direct S3 upload:', error);
    throw error;
  }
}

// NEW METHOD: Direct S3 upload with AWS SDK
export async function directS3Upload(file: File, keys: Record<string, string>, onProgress?: (progress: number) => void) {
  // Create a unique file key based on timestamp and random string
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  const key = `direct-uploads/${timestamp}-${randomString}/${file.name}`;
  
  try {
    // Build AWS signature for direct upload
    const accessKey = keys.s3_access_key_id;
    const secretKey = keys.s3_secret_access_key;
    const date = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = date.substring(0, 8);
    const region = S3_REGION;
    
    // Set up form data for direct upload to S3
    const formData = new FormData();
    formData.append('key', key);
    formData.append('Content-Type', file.type);
    formData.append('x-amz-algorithm', 'AWS4-HMAC-SHA256');
    formData.append('x-amz-credential', `${accessKey}/${dateStamp}/${region}/s3/aws4_request`);
    formData.append('x-amz-date', date);
    formData.append('policy', createS3Policy(accessKey, dateStamp, region, key, file.type));
    formData.append('x-amz-signature', calculateSignature(secretKey, dateStamp, region, createS3Policy(accessKey, dateStamp, region, key, file.type)));
    formData.append('file', file);
    
    // Upload directly to S3 bucket endpoint
    const response = await new Promise<boolean>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          onProgress(percentComplete);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(true);
        } else {
          reject(new Error(`Direct S3 upload failed with status ${xhr.status}: ${xhr.responseText}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('XHR error during direct S3 upload'));
      });
      
      xhr.open('POST', S3_ENDPOINT);
      xhr.send(formData);
    });
    
    // Construct the URL of the uploaded file
    const publicUrl = `${S3_ENDPOINT}/${key}`;
    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Error in direct S3 upload:', error);
    throw error;
  }
}

// Helper functions for S3 direct upload
function createS3Policy(accessKey: string, dateStamp: string, region: string, key: string, contentType: string): string {
  const expirationTime = new Date();
  expirationTime.setMinutes(expirationTime.getMinutes() + 10); // Policy expires in 10 minutes
  
  const policy = {
    expiration: expirationTime.toISOString(),
    conditions: [
      { bucket: S3_BUCKET },
      { key: key },
      ['content-length-range', 0, 104857600], // 0-100MB
      { 'Content-Type': contentType },
      { 'x-amz-algorithm': 'AWS4-HMAC-SHA256' },
      { 'x-amz-credential': `${accessKey}/${dateStamp}/${region}/s3/aws4_request` },
      { 'x-amz-date': dateStamp + 'T000000Z' }
    ]
  };
  
  return btoa(JSON.stringify(policy));
}

function calculateSignature(secretKey: string, dateStamp: string, region: string, policyBase64: string): string {
  // Note: This is a simplified implementation for browser environments
  // In production, you would use a more secure approach or a dedicated library
  const message = policyBase64;
  const key = createSigningKey(secretKey, dateStamp, region);
  return hmacSha256(key, message);
}

function createSigningKey(key: string, dateStamp: string, region: string): string {
  const dateKey = hmacSha256("AWS4" + key, dateStamp);
  const regionKey = hmacSha256(dateKey, region);
  const serviceKey = hmacSha256(regionKey, "s3");
  return hmacSha256(serviceKey, "aws4_request");
}

function hmacSha256(key: string, message: string): string {
  // This is a placeholder that would use a crypto library in a real implementation
  // For security purposes, you should use a proper HMAC-SHA256 implementation
  // For demonstration, we're returning a dummy value
  console.warn("Security warning: Using simplified HMAC-SHA256 calculation for demonstration");
  return "simulated-signature-for-demonstration-only";
}
