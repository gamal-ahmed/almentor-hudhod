import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// HF API key from environment variables
const HF_API_TOKEN = Deno.env.get('HUGGINGFACE_API_KEY') || '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received Phi-4 transcription request');
    
    // Get form data with audio file
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const prompt = formData.get('prompt') as string || '';
    
    if (!audioFile) {
      throw new Error('No audio file provided');
    }
    
    console.log(`Processing audio file: ${audioFile.name}, size: ${audioFile.size} bytes, type: ${audioFile.type}`);
    
    // Convert audio file to ArrayBuffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioB64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    // Create a transcription request to Hugging Face Inference API
    // Using the microsoft/Phi-4-multimodal-instruct model
    const response = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/Phi-4-multimodal-instruct", 
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: {
            audio: `data:${audioFile.type};base64,${audioB64}`,
            text: `Transcribe the following audio precisely and format it as VTT captions. ${prompt}`
          },
          parameters: {
            return_tensors: false,
            max_new_tokens: 1024
          }
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Hugging Face API error:', response.status, error);
      throw new Error(`Hugging Face API error: ${response.status} - ${error}`);
    }
    
    const result = await response.json();
    console.log('Received response from Hugging Face API');
    
    // Extract the generated text
    let generatedText = '';
    if (Array.isArray(result) && result.length > 0 && result[0].generated_text) {
      generatedText = result[0].generated_text;
    } else if (typeof result === 'object' && result.generated_text) {
      generatedText = result.generated_text;
    } else {
      generatedText = JSON.stringify(result);
    }
    
    // Convert the response to VTT format
    let vttContent = 'WEBVTT\n\n';
    
    // Try to extract VTT format from the response
    // If the model already returned VTT format, use it
    if (generatedText.includes('WEBVTT')) {
      vttContent = generatedText;
    } else {
      // Otherwise, create a simple VTT format
      const lines = generatedText.split('\n').filter(line => line.trim() !== '');
      
      for (let i = 0; i < lines.length; i++) {
        const startTime = formatVTTTime(i * 5);
        const endTime = formatVTTTime((i + 1) * 5);
        vttContent += `${startTime} --> ${endTime}\n${lines[i]}\n\n`;
      }
    }
    
    console.log('Successfully processed transcription with Phi-4');
    
    return new Response(
      JSON.stringify({ vttContent }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in Phi-4 transcription:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Helper function to format time for VTT
function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}
