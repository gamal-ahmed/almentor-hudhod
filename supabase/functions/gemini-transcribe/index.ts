
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./helpers/corsHeaders.ts";
import { DEFAULT_PROMPT, enhanceUserPrompt } from "./config/prompts.ts";
import { transcribeWithGemini, extractTranscriptionFromResponse } from "./services/geminiService.ts";
import { convertTextToVTT } from "./helpers/vttUtils.ts";

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
    const userPrompt = formData.get('prompt');
    
    // Enhance the user prompt
    const prompt = enhanceUserPrompt(userPrompt as string | null);
    
    if (!audioFile || !(audioFile instanceof File)) {
      return new Response(
        JSON.stringify({ error: 'Missing audio file' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Received audio file: ${audioFile.name}, size: ${audioFile.size} bytes`);
    console.log(`Using prompt: ${prompt}`);

    // Send the transcription request to Gemini
    const geminiResponse = await transcribeWithGemini({
      prompt,
      audioFile,
      apiKey
    });

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
    
    try {
      // Extract the text from the Gemini response
      transcription = extractTranscriptionFromResponse(geminiData);
      console.log(`Extracted transcription (${transcription.length} chars)`);
    } catch (error) {
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
    let vttContent = isVttFormat ? transcription : convertTextToVTT(transcription);
    
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
