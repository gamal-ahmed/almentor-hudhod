
import { properlyEncodedBase64 } from "../helpers/base64Utils.ts";

interface GeminiRequestOptions {
  prompt: string;
  audioFile: File;
  apiKey: string;
}

/**
 * Create a request body for the Gemini API
 */
export function createGeminiRequestBody(options: GeminiRequestOptions) {
  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${options.prompt}\n\nTranscribe the following audio file and return the transcript with timestamps in WebVTT format. Do not translate any words - preserve ALL English words exactly as spoken, including names, technical terms, and acronyms.`
          },
          {
            inline_data: {
              mime_type: options.audioFile.type,
              data: options.audioFile // Will be replaced with base64 data
            }
          }
        ]
      }
    ],
    generation_config: {
      temperature: 0.1, // Reduced temperature for more deterministic output
      top_p: 0.95,
      top_k: 40,
      max_output_tokens: 8192
    }
  };
}

/**
 * Send a transcription request to the Gemini API
 */
export async function transcribeWithGemini(options: GeminiRequestOptions): Promise<Response> {
  console.log('Processing audio file for Gemini API');
  
  // Read the audio file as an array buffer
  const arrayBuffer = await options.audioFile.arrayBuffer();
  
  // Convert the audio to base64
  const base64Audio = await properlyEncodedBase64(arrayBuffer, options.audioFile.type);
  
  console.log(`Audio conversion complete, base64 length: ${base64Audio.length}`);
  
  // Create the request body
  const requestBody = createGeminiRequestBody(options);
  
  // Replace the placeholder with the actual base64 data
  requestBody.contents[0].parts[1].inline_data.data = base64Audio;
  
  console.log('Sending request to Gemini API');
  
  // Make the request to the Gemini API
  return fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": options.apiKey
      },
      body: JSON.stringify(requestBody)
    }
  );
}

/**
 * Extract transcription text from Gemini API response
 */
export function extractTranscriptionFromResponse(geminiData: any): string {
  if (geminiData.candidates && 
      geminiData.candidates.length > 0 && 
      geminiData.candidates[0].content && 
      geminiData.candidates[0].content.parts && 
      geminiData.candidates[0].content.parts.length > 0) {
    
    return geminiData.candidates[0].content.parts[0].text;
  }
  
  throw new Error('Unexpected Gemini response format');
}
