
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Cloud configuration
const PROJECT_ID = "silicon-talent-454813-a2";
const LOCATION = "global";
const MODEL_NAME = "gemini-2.0-flash-exp";

// Cache for JWT token
let cachedToken: { token: string; expires: number } | null = null;

function buildPrompt(promptConfig: any) {
  const {
    languages = ['ar-EG', 'en-US'],
    segmentDuration = 3,
    noiseHandling = 'ignore',
    customInstructions = null
  } = promptConfig || {};

  let prompt = `You will be provided with an audio file: below
and the primary language of the audio: ${languages.join(' and ')}

Instructions:

1. Listen to the provided audio file.
2. Transcribe the speech into properly formatted WebVTT segments.
3. Each segment should be ${segmentDuration} seconds long.
4. Format each segment exactly like this:

WEBVTT

00:00:00.000 --> 00:00:0${segmentDuration}.000
[Transcribed text for this segment]

00:00:0${segmentDuration}.000 --> 00:00:0${segmentDuration * 2}.000
[Next segment's transcribed text]

5. Maintain exact timing format: HH:MM:SS.mmm
6. Do not include timestamps or numbers within the transcribed text
7. Preserve the original language of each word exactly as spoken - write English words in English script and Arabic words in Arabic script
8. Do not translate any words - maintain the exact language they were spoken in`;

  if (noiseHandling === 'transcribe') {
    prompt += '\n9. Include descriptions of significant background sounds and music in [square brackets]';
  } else {
    prompt += '\n9. Ignore background sounds and music';
  }

  if (customInstructions) {
    prompt += `\n\nAdditional Instructions:\n${customInstructions}`;
  }

  prompt += '\n\nOutput Format: WebVTT only, no additional text or explanations';

  return prompt;
}

// Validate service account key structure
function validateServiceAccountKey(keyString: string): any {
  try {
    const key = JSON.parse(keyString);
    
    const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email', 'client_id', 'auth_uri', 'token_uri'];
    
    for (const field of requiredFields) {
      if (!key[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    if (key.type !== 'service_account') {
      throw new Error('Invalid key type. Expected "service_account"');
    }
    
    console.log('Service account key validation successful');
    return key;
  } catch (error) {
    console.error('Service account key validation failed:', error.message);
    throw new Error(`Invalid service account key format: ${error.message}`);
  }
}

// Generate JWT token for Google Cloud authentication
async function generateJWT() {
  const serviceAccountKey = Deno.env.get('GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY');
  
  if (!serviceAccountKey) {
    throw new Error('Missing GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY environment variable');
  }

  console.log('Service account key found, length:', serviceAccountKey.length);

  // Check if we have a valid cached token
  if (cachedToken && Date.now() < cachedToken.expires) {
    console.log('Using cached JWT token');
    return cachedToken.token;
  }

  try {
    // Validate and parse service account key
    const serviceAccount = validateServiceAccountKey(serviceAccountKey);
    console.log('Service account email:', serviceAccount.client_email);
    console.log('Service account project:', serviceAccount.project_id);
    
    // Create JWT header
    const header = {
      "alg": "RS256",
      "typ": "JWT",
      "kid": serviceAccount.private_key_id
    };

    // Create JWT payload with correct scopes for Vertex AI
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      "iss": serviceAccount.client_email,
      "scope": "https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/generative-language.retriever",
      "aud": "https://oauth2.googleapis.com/token",
      "exp": now + 3600, // 1 hour
      "iat": now
    };

    console.log('JWT payload created, expires at:', new Date(payload.exp * 1000).toISOString());

    // Encode header and payload
    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    
    // Create signature
    const message = `${encodedHeader}.${encodedPayload}`;
    
    // Import the private key
    const privateKeyPem = serviceAccount.private_key;
    
    // Clean up the private key format
    const cleanPrivateKey = privateKeyPem
      .replace(/\\n/g, '\n')
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '');
    
    const privateKeyDer = base64Decode(cleanPrivateKey);
    
    console.log('Importing private key...');
    const cryptoKey = await crypto.subtle.importKey(
      "pkcs8",
      privateKeyDer,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["sign"]
    );

    console.log('Signing JWT...');
    // Sign the message
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      new TextEncoder().encode(message)
    );

    // Encode signature
    const encodedSignature = base64UrlEncode(signature);
    const jwt = `${message}.${encodedSignature}`;

    console.log('JWT created, exchanging for access token...');
    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion': jwt
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', tokenResponse.status, errorText);
      throw new Error(`Token exchange failed (${tokenResponse.status}): ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Access token obtained successfully');
    
    // Cache the token
    cachedToken = {
      token: tokenData.access_token,
      expires: Date.now() + (tokenData.expires_in - 300) * 1000 // 5 min buffer
    };

    return tokenData.access_token;
  } catch (error) {
    console.error('JWT generation failed:', error);
    console.error('Error stack:', error.stack);
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

// Helper function for base64 URL encoding
function base64UrlEncode(data: string | ArrayBuffer): string {
  let base64: string;
  if (typeof data === 'string') {
    base64 = btoa(data);
  } else {
    const bytes = new Uint8Array(data);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(binary);
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Helper function for base64 decoding
function base64Decode(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('=== Gemini Transcription Request Started ===');
    
    // Get the form data from the request
    const formData = await req.formData();
    const audioFile = formData.get('audio');
    const promptConfig = formData.get('promptConfig') ? JSON.parse(formData.get('promptConfig') as string) : null;
    
    const prompt = buildPrompt(promptConfig);
    
    if (!audioFile || !(audioFile instanceof File)) {
      console.error('Missing or invalid audio file');
      return new Response(
        JSON.stringify({ error: 'Missing audio file' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Received audio file: ${audioFile.name}, size: ${audioFile.size} bytes, type: ${audioFile.type}`);

    // Get authentication token
    console.log('Getting authentication token...');
    const accessToken = await generateJWT();
    console.log('Authentication successful');

    // Read the audio file as an array buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    
    // Convert to base64
    const base64Audio = await properlyEncodedBase64(arrayBuffer, audioFile.type);
    console.log(`Audio conversion complete, base64 length: ${base64Audio.length}`);
    
    // Define the Vertex AI request with proper structure for Gemini 2.0 Flash
    const vertexAIRequestBody = {
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: audioFile.type,
                data: base64Audio
              }
            }
          ]
        }
      ],
      generation_config: {
        temperature: 0.1,
        top_p: 0.95,
        top_k: 40,
        max_output_tokens: 8192
      }
    };
    
    console.log('Sending request to Vertex AI Gemini...');
    
    // Make the request to Vertex AI
    const vertexAIUrl = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_NAME}:generateContent`;
    
    const vertexResponse = await fetch(vertexAIUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify(vertexAIRequestBody)
    });

    // Check for errors in the Vertex AI response
    if (!vertexResponse.ok) {
      const errorText = await vertexResponse.text();
      console.error(`Vertex AI error (${vertexResponse.status}): ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: `Vertex AI error: ${vertexResponse.statusText}`,
          details: errorText,
          status: vertexResponse.status
        }),
        { 
          status: vertexResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse the Vertex AI response
    const vertexData = await vertexResponse.json();
    console.log('Received response from Vertex AI');
    
    let transcription = '';
    
    // Extract the text from the Vertex AI response
    if (vertexData.candidates && vertexData.candidates.length > 0 && 
        vertexData.candidates[0].content && 
        vertexData.candidates[0].content.parts && 
        vertexData.candidates[0].content.parts.length > 0) {
      
      transcription = vertexData.candidates[0].content.parts[0].text;
      console.log(`Extracted transcription (${transcription.length} chars)`);
    } else {
      console.error('Unexpected Vertex AI response format:', JSON.stringify(vertexData, null, 2));
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response format from Vertex AI',
          rawResponse: vertexData
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Determine if the response is already in VTT format or needs conversion
    const isVttFormat = transcription.trim().startsWith('WEBVTT');
    let vttContent = '';
    
    if (isVttFormat) {
      vttContent = transcription;
    } else {
      // Convert plain text to VTT format
      vttContent = convertTextToVTT(transcription);
    }
    
    console.log(`Generated VTT content (${vttContent.length} chars)`);
    console.log('=== Gemini Transcription Request Completed Successfully ===');

    // Return the successful response
    return new Response(
      JSON.stringify({ 
        vttContent,
        prompt
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error processing transcription request:', error);
    console.error('Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: 'Error processing transcription request',
        message: error.message,
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Properly encode to base64 for Gemini API
async function properlyEncodedBase64(buffer: ArrayBuffer, mimeType: string): Promise<string> {
  const bytes = new Uint8Array(buffer);
  
  // Convert to a binary string first
  let binary = '';
  const chunkSize = 1024; // Use small chunks to avoid stack issues
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, Math.min(i + chunkSize, bytes.length));
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  
  // Use btoa for standard base64 encoding
  return btoa(binary);
}

// Helper function to convert text to VTT format
function convertTextToVTT(text: string): string {
  let vttContent = 'WEBVTT\n\n';
  
  // Split text into sentences or chunks
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  // Create a VTT cue for each sentence with appropriate timestamps
  sentences.forEach((sentence, index) => {
    const startTime = formatVTTTime(index * 5);
    const endTime = formatVTTTime((index + 1) * 5);
    vttContent += `${startTime} --> ${endTime}\n${sentence.trim()}\n\n`;
  });
  
  return vttContent;
}

// Helper function to format time in seconds to VTT timestamp format (HH:MM:SS.mmm)
function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}
