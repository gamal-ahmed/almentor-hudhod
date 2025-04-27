import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildPrompt(promptConfig: any) {
  const {
    languages = ['ar-EG', 'en-US'],
    segmentDuration = 3,
    noiseHandling = 'ignore',
    customInstructions = null
  } = promptConfig || {};

  let prompt = `You will be provided with an audio file: below
and the primary language of the audio: ${languages.join(' and ')}

CRITICAL LANGUAGE INSTRUCTIONS:
1. For English content:
   - ALWAYS keep English words, phrases, and sentences EXACTLY as spoken
   - DO NOT translate English to Arabic under any circumstances
   - Preserve technical terms, names, and acronyms in their original English form

2. For Arabic content:
   - Write Arabic text using Arabic script (العربية)
   - DO NOT transliterate Arabic using Latin characters
   - DO NOT translate Arabic to English

3. For mixed language content:
   - Keep each language in its original form
   - DO NOT translate between languages
   - Maintain the natural flow of code-switching between Arabic and English

4. Transcribe the speech into properly formatted WebVTT segments
5. Each segment should be ${segmentDuration} seconds long
6. Format each segment exactly like this:

WEBVTT

00:00:00.000 --> 00:00:0${segmentDuration}.000
[Transcribed text preserving both languages exactly as spoken]

00:00:0${segmentDuration}.000 --> 00:00:0${segmentDuration * 2}.000
[Next segment's transcribed text]

7. Maintain exact timing format: HH:MM:SS.mmm`;

  if (noiseHandling === 'transcribe') {
    prompt += '\n8. Include descriptions of significant background sounds and music in [square brackets]';
  } else {
    prompt += '\n8. Ignore background sounds and music';
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

    // Log the full request body for debugging
    console.log('Full Gemini Request Body:', JSON.stringify(geminiRequestBody, null, 2));
    
    console.log('Sending request to Gemini API');
    
    // Make the request to the Gemini API with the updated model
    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-04-17:generateContent",
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
