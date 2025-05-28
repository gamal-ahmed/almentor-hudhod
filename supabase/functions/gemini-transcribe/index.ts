
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory queue for Gemini requests
class GeminiRequestQueue {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private readonly minDelayMs = 2000; // 2 seconds between requests

  async enqueue<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const requestFn = this.queue.shift()!;
      
      // Rate limiting: ensure minimum delay between requests
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.minDelayMs) {
        const delay = this.minDelayMs - timeSinceLastRequest;
        console.log(`Rate limiting: waiting ${delay}ms before next request`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      this.lastRequestTime = Date.now();
      await requestFn();
    }
    
    this.processing = false;
  }
}

const geminiQueue = new GeminiRequestQueue();

// Retry logic with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a rate limit error
      const isRateLimitError = error instanceof Error && 
        (error.message.includes('429') || error.message.includes('rate limit') || error.message.includes('quota'));
      
      // Don't retry non-rate-limit errors or on final attempt
      if (!isRateLimitError || attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

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
7. CRITICAL: Preserve the original language of each word - write English words in English letters, write Arabic words in Arabic script. Do NOT translate between languages.
8. When you hear mixed language speech, keep each word in its original language and script.`;

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    console.error('Missing GEMINI_API_KEY environment variable');
    return new Response(
      JSON.stringify({ error: 'Server configuration error: Missing API key' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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

    // Read the audio file as an array buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    
    // Use a properly formatted base64 encoding method
    const base64Audio = await properlyEncodedBase64(arrayBuffer, audioFile.type);
    
    console.log(`Audio conversion complete, base64 length: ${base64Audio.length}`);
    
    // Queue the Gemini API request to prevent concurrent calls
    const result = await geminiQueue.enqueue(async () => {
      return await retryWithBackoff(async () => {
        // Define the Gemini API request with system instructions
        const geminiRequestBody = {
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

        console.log('Sending request to Gemini API (queued and rate-limited)');
        
        // Use the stable Gemini 1.5 Pro model instead of the experimental preview
        const geminiResponse = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey
            },
            body: JSON.stringify(geminiRequestBody)
          }
        );

        // Check for errors in the Gemini response
        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text();
          console.error(`Gemini API error (${geminiResponse.status}): ${errorText}`);
          
          // Create a more specific error for rate limiting
          if (geminiResponse.status === 429) {
            throw new Error(`Gemini API rate limit exceeded: ${geminiResponse.statusText}`);
          }
          
          throw new Error(`Gemini API error: ${geminiResponse.statusText} - ${errorText}`);
        }

        // Parse the Gemini response
        const geminiData = await geminiResponse.json();
        console.log('Received response from Gemini API');
        
        return geminiData;
      }, 3, 2000); // 3 retries with 2 second base delay
    });
    
    let transcription = '';
    
    // Extract the text from the Gemini response
    if (result.candidates && result.candidates.length > 0 && 
        result.candidates[0].content && 
        result.candidates[0].content.parts && 
        result.candidates[0].content.parts.length > 0) {
      
      transcription = result.candidates[0].content.parts[0].text;
      console.log(`Extracted transcription (${transcription.length} chars)`);
    } else {
      console.error('Unexpected Gemini response format:', JSON.stringify(result, null, 2));
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response format from Gemini API',
          rawResponse: result
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
    
    // Provide more specific error messages for rate limiting
    let errorMessage = 'Error processing transcription request';
    if (error instanceof Error) {
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        errorMessage = 'Gemini API rate limit exceeded. Please try again in a few moments.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
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
