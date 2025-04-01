
import { API_ENDPOINTS, SUPABASE_KEY } from "./utils";
import { useLogsStore } from "@/lib/useLogsStore";

const getLogsStore = () => useLogsStore.getState();

// Fetch audio from any URL (Dropbox, Google Drive, YouTube, etc.)
export async function fetchAudioFromUrl(url: string): Promise<File> {
  const addLog = getLogsStore().addLog;
  
  try {
    console.log(`Fetching audio from URL: ${url}`);
    addLog(`Fetching audio from URL: ${url}`, "info", {
      source: "AudioDownloader",
      details: `URL: ${url}`
    });
    
    const response = await fetch(`${API_ENDPOINTS.TRANSCRIPTION_SERVICE}/download-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        url
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to download audio: ${response.status} - ${errorText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    // Extract filename from URL or use default
    let fileName = 'audio.mp3';
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const lastPathPart = pathParts[pathParts.length - 1];
      
      if (lastPathPart && (lastPathPart.endsWith('.mp3') || lastPathPart.endsWith('.wav') || lastPathPart.endsWith('.m4a'))) {
        fileName = lastPathPart;
      }
    } catch (e) {
      console.warn('Could not parse URL for filename, using default');
    }
    
    // Determine content type based on file extension
    let contentType = 'audio/mpeg';
    if (fileName.endsWith('.wav')) {
      contentType = 'audio/wav';
    } else if (fileName.endsWith('.m4a')) {
      contentType = 'audio/m4a';
    }
    
    // Create a File object
    const file = new File([arrayBuffer], fileName, { type: contentType });
    
    addLog(`Successfully downloaded audio from URL`, "success", {
      source: "AudioDownloader",
      details: `Filename: ${fileName}, Size: ${file.size} bytes`
    });
    
    return file;
  } catch (error) {
    console.error('Error downloading audio from URL:', error);
    addLog(`Failed to download audio from URL: ${error.message}`, "error", {
      source: "AudioDownloader",
      details: error.stack
    });
    throw error;
  }
}
