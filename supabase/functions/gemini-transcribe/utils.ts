
// Helper function for proper base64 encoding
export async function properlyEncodedBase64(buffer: ArrayBuffer, mimeType: string): Promise<string> {
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
  return btoa(binary);
}

// Creates the Gemini request body
export function createGeminiRequest(prompt: string, base64Audio: string, audioType: string) {
  return {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${prompt}\n\nTranscribe the following audio file and return the transcript with timestamps in WebVTT format. Do not translate any words - preserve ALL English words exactly as spoken, including names, technical terms, and acronyms.`
          },
          {
            inline_data: {
              mime_type: audioType,
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
}

export function convertTextToVTT(text: string): string {
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

function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}

