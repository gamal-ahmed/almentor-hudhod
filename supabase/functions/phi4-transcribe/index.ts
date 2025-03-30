
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract the form data from the request
    const formData = await req.formData();
    const audioFile = formData.get("audio");
    const prompt = formData.get("prompt") || "Please preserve all English words exactly as spoken";

    // Check if audio file is provided
    if (!audioFile || !(audioFile instanceof File)) {
      throw new Error("No audio file provided or invalid file");
    }

    console.log(`Processing audio file: ${audioFile.name}, size: ${audioFile.size} bytes`);
    console.log(`Using prompt: ${prompt}`);

    // Convert audio to buffer for processing
    const audioBuffer = await audioFile.arrayBuffer();

    // Create a FormData for OpenAI API call
    const openAIFormData = new FormData();
    const blob = new Blob([audioBuffer], { type: audioFile.type });
    openAIFormData.append("file", blob, audioFile.name);
    openAIFormData.append("model", "whisper-1");
    openAIFormData.append("response_format", "verbose_json");
    if (prompt) {
      openAIFormData.append("prompt", prompt.toString());
    }

    // Call OpenAI Whisper API as Phi-4 alternative since we can't run the actual model on the server
    console.log("Sending request to OpenAI Whisper API as Phi-4 alternative");
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      },
      body: openAIFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error response from OpenAI: ${response.status}, ${errorText}`);
      throw new Error(`Transcription failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Received response from OpenAI");

    // Generate VTT content with timestamps if available
    let vttContent = "WEBVTT\n\n";
    if (data.segments && data.segments.length > 0) {
      console.log(`Found ${data.segments.length} segments with timestamps`);
      
      data.segments.forEach((segment, index) => {
        const startTime = formatVTTTime(segment.start);
        const endTime = formatVTTTime(segment.end);
        vttContent += `${startTime} --> ${endTime}\n${segment.text.trim()}\n\n`;
      });
    } else {
      console.log("No segments found, creating VTT from plain text");
      // If no segments, create basic VTT content from text
      const text = data.text;
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      
      sentences.forEach((sentence, index) => {
        const startTime = formatVTTTime(index * 5);
        const endTime = formatVTTTime((index + 1) * 5);
        vttContent += `${startTime} --> ${endTime}\n${sentence.trim()}\n\n`;
      });
    }

    console.log(`Generated VTT content (${vttContent.length} chars)`);

    return new Response(
      JSON.stringify({
        vttContent,
        text: data.text,
        prompt: prompt
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in phi4-transcribe function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
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
