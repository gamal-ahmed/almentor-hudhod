
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Cloud configuration
const PROJECT_ID = "silicon-talent-454813-a2";
const LOCATION = "global";
const MODEL_NAME = "gemini-2.5-pro-preview-06-05";

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

// Generate JWT token for Google Cloud authentication
async function generateJWT() {
  const serviceAccountKey = Deno.env.get('GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY');
  
  if (!serviceAccountKey) {
    throw new Error('Missing GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY environment variable');
  }

  // Check if we have a valid cached token
  if (cachedToken && Date.now() < cachedToken.expires) {
    return cachedToken.token;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    
    // Create JWT header
    const header = {
      "alg": "RS256",
      "typ": "JWT"
    };

    // Create JWT payload
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      "iss": serviceAccount.client_email,
      "scope": "https://www.googleapis.com/auth/cloud-platform",
      "aud": "https://oauth2.googleapis.com/token",
      "exp": now + 3600, // 1 hour
      "iat": now
    };

    // Encode header and payload
    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    // Create signature (simplified - in production use proper crypto library)
    const message = `${encodedHeader}.${encodedPayload}`;
    
    // Import the private key
    const privateKeyPem = serviceAccount.private_key;
    const privateKeyDer = pemToDer(privateKeyPem);
    
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

    // Sign the message
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      new TextEncoder().encode(message)
    );

    // Encode signature
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const jwt = `${message}.${encodedSignature}`;

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
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    
    // Cache the token
    cachedToken = {
      token: tokenData.access_token,
      expires: Date.now() + (tokenData.expires_in - 300) * 1000 // 5 min buffer
    };

    return tokenData.access_token;
  } catch (error) {
    console.error('JWT generation failed:', error);
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

// Helper function to convert PEM to DER
function pemToDer(pem: string): ArrayBuffer {
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = pem.replace(pemHeader, "").replace(pemFooter, "").replace(/\s/g, "");
  
  const binaryString = atob(pemContents);
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
    // Get the form data from the request
    const formData = await req.formData();
    const audioFile = formData.get('audio');
    const promptConfig = formData.get('promptConfig') ? JSON.parse(formData.get('promptConfig') as string) : null;
    
    const prompt = buildPrompt(promptConfig);
    
    if (!audioFile || !(audioFile instanceof File)) {
      return new Response(
        JSON.stringify({ error: 'Missing audio file' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Received audio file: ${audioFile.name}, size: ${audioFile.size} bytes`);
    console.log(`Using prompt: ${prompt}`);

    // Get authentication token
    const accessToken = await generateJWT();
    console.log('Successfully obtained access token');

    // Read the audio file as an array buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    
    // Use a properly formatted base64 encoding method
    const base64Audio = await properlyEncodedBase64(arrayBuffer, audioFile.type);
    
    console.log(`Audio conversion complete, base64 length: ${base64Audio.length}`);
    
    // Define the Vertex AI request with proper structure
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
        max_output_tokens: 540
      }
    };

    // Log the request for debugging
    console.log('Vertex AI Request Body:', JSON.stringify(vertexAIRequestBody, null, 2));
    
    console.log('Sending request to Vertex AI');
    
    // Make the request to Vertex AI
    const vertexAIUrl = `https://global-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_NAME}:generateContent`;
    
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
          details: errorText
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
  // This needs to be called once on the complete binary string
  // to ensure proper padding and formatting
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
