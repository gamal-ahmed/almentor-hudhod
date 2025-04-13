
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced default prompt with more explicit instructions
const DEFAULT_PROMPT = "IMPORTANT: Transcribe the exact words as spoken. Do not translate, paraphrase, or modify any English words, names, acronyms, or technical terms. Preserve all English words exactly as they are spoken.";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get the API key from environment variables
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    console.error('Missing GEMINI_API_KEY environment variable');
    return new Response(
      JSON.stringify({ error: 'Server configuration error: Missing API key' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Only process POST requests with form data
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Processing Gemini transcription request');
    
    // Get the form data from the request
    const formData = await req.formData();
    const audioFile = formData.get('audio');
    let prompt = formData.get('prompt') || DEFAULT_PROMPT;
    
    // Enhance user prompt if it doesn't already have strong preservation instructions
    if (!prompt.toLowerCase().includes('preserve') && !prompt.toLowerCase().includes('exact')) {
      prompt = `${DEFAULT_PROMPT}\n\nAdditional context: ${prompt}`;
    }
    
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
    
    // Define the Gemini API request with system instructions
    const geminiRequestBody = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${prompt}\n\nTranscribe the following audio file and return the transcript with timestamps in WebVTT format. Do not translate any words - preserve ALL English words exactly as spoken, including names, technical terms, and acronyms.`
            },
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
        temperature: 0.1, // Reduced from 0.2 to 0.1 for more deterministic output
        top_p: 0.95,
        top_k: 40,
        max_output_tokens: 8192
      }
    };

    console.log('Sending request to Gemini API');
    
    // Make the request to the Gemini API with the updated model
    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
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
      return new Response(
        JSON.stringify({ 
          error: `Gemini API error: ${geminiResponse.statusText}`,
          details: errorText
        }),
        { 
          status: geminiResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse the Gemini response
    const geminiData = await geminiResponse.json();
    console.log('Received response from Gemini API');
    
    let transcription = '';
    
    // Extract the text from the Gemini response
    if (geminiData.candidates && geminiData.candidates.length > 0 && 
        geminiData.candidates[0].content && 
        geminiData.candidates[0].content.parts && 
        geminiData.candidates[0].content.parts.length > 0) {
      
      transcription = geminiData.candidates[0].content.parts[0].text;
      console.log(`Extracted transcription (${transcription.length} chars)`);
    } else {
      console.error('Unexpected Gemini response format:', JSON.stringify(geminiData, null, 2));
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response format from Gemini API',
          rawResponse: geminiData
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
