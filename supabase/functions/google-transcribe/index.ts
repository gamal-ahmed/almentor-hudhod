
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_API_KEY = Deno.env.get("GOOGLE_CLOUD_API_KEY");
const SPEECH_TO_TEXT_API = "https://speech.googleapis.com/v1p1beta1/speech:recognize";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const requestData = await req.formData();
    const audioFile = requestData.get('audio') as File;
    const languageCode = requestData.get('languageCode') as string || 'en-US';
    const enableWordTimeOffsets = requestData.get('enableWordTimeOffsets') === 'true';
    const enableAutomaticPunctuation = requestData.get('enableAutomaticPunctuation') === 'true';
    
    if (!audioFile) {
      throw new Error('No audio file provided');
    }

    console.log(`Processing audio file: ${audioFile.name}, size: ${audioFile.size} bytes`);
    
    // Convert the audio file to base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    // Prepare request to Google Cloud Speech-to-Text API
    const requestBody = {
      config: {
        languageCode,
        enableWordTimeOffsets,
        enableAutomaticPunctuation,
        model: "video", // Specifically for video content
        useEnhanced: true,
        audioChannelCount: 2,
      },
      audio: {
        content: base64Audio
      }
    };
    
    console.log("Sending request to Google Speech-to-Text API...");
    
    // Make the API request
    const response = await fetch(`${SPEECH_TO_TEXT_API}?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("Google API error:", errorData);
      throw new Error(`Google Speech-to-Text API error: ${response.status} ${errorData}`);
    }
    
    const data = await response.json();
    
    // Process the transcription result into VTT format
    let vttContent = "WEBVTT\n\n";
    let plainText = "";
    
    if (data.results && data.results.length > 0) {
      data.results.forEach((result: any, index: number) => {
        if (result.alternatives && result.alternatives.length > 0) {
          const transcript = result.alternatives[0].transcript;
          plainText += transcript + " ";
          
          // Extract word timing information if available
          if (enableWordTimeOffsets && result.alternatives[0].words) {
            const words = result.alternatives[0].words;
            let currentStartTime = formatTime(words[0].startTime);
            let currentEndTime = formatTime(words[words.length - 1].endTime);
            
            vttContent += `${currentStartTime} --> ${currentEndTime}\n${transcript}\n\n`;
          } else {
            // Default timing if words aren't available (simulated)
            const startTime = formatTime({ seconds: index * 5 });
            const endTime = formatTime({ seconds: (index + 1) * 5 });
            vttContent += `${startTime} --> ${endTime}\n${transcript}\n\n`;
          }
        }
      });
    }
    
    return new Response(
      JSON.stringify({ 
        vttContent, 
        plainText: plainText.trim(),
        rawResponse: data
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error("Error in google-transcribe function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

// Helper function to format time values into VTT format
function formatTime(timeObj: any): string {
  let seconds = 0;
  
  if (typeof timeObj === 'object') {
    if (timeObj.seconds) {
      seconds += parseInt(timeObj.seconds);
    }
    if (timeObj.nanos) {
      seconds += timeObj.nanos / 1000000000;
    }
  } else if (typeof timeObj === 'number') {
    seconds = timeObj;
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}
