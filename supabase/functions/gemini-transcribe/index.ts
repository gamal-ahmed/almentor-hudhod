
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, DEFAULT_PROMPT } from "./constants.ts";
import { properlyEncodedBase64, createGeminiRequest, convertTextToVTT } from "./utils.ts";

// Maximum number of retries for rate limit errors
const MAX_RETRIES = 3;
// Initial delay in milliseconds before retrying (will increase with backoff)
const INITIAL_RETRY_DELAY = 1000;

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
    
    // Create the Gemini API request
    const geminiRequestBody = createGeminiRequest(prompt, base64Audio, audioFile.type);
    
    // Log the full request body for debugging
    console.log('Full Gemini Request Body:', JSON.stringify(geminiRequestBody, null, 2));
    
    // Implement retry logic for rate limit errors
    let retries = 0;
    let lastError;
    
    while (retries <= MAX_RETRIES) {
      if (retries > 0) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retries - 1);
        console.log(`Rate limit hit. Retry attempt ${retries}/${MAX_RETRIES}. Waiting ${delay}ms before retrying...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      console.log(`Sending request to Gemini API${retries > 0 ? ` (retry ${retries}/${MAX_RETRIES})` : ''}`);
      
      try {
        // Make the request to the Gemini API
        const geminiResponse = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-03-25:generateContent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey
            },
            body: JSON.stringify(geminiRequestBody)
          }
        );

        // Check if we hit a rate limit
        if (geminiResponse.status === 429) {
          console.warn(`Rate limit error (429) encountered on attempt ${retries + 1}/${MAX_RETRIES + 1}`);
          const rateLimitData = await geminiResponse.json();
          console.warn('Rate limit details:', JSON.stringify(rateLimitData));
          
          lastError = new Error(`Gemini API rate limit exceeded: ${JSON.stringify(rateLimitData)}`);
          retries++;
          continue; // Try again after delay
        }

        // Check for other errors in the Gemini response
        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text();
          console.error(`Gemini API error (${geminiResponse.status}): ${errorText}`);
          return new Response(
            JSON.stringify({ 
              error: `Gemini API error: ${geminiResponse.statusText}`,
              details: errorText,
              status: geminiResponse.status
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
      } catch (fetchError) {
        console.error(`Network error on attempt ${retries + 1}/${MAX_RETRIES + 1}:`, fetchError);
        lastError = fetchError;
        retries++;
        
        // If this was the last retry, we'll exit the loop and throw the error
        if (retries > MAX_RETRIES) {
          break;
        }
      }
    }
    
    // If we've exhausted all retries
    throw lastError || new Error('Maximum retry attempts exceeded');
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
