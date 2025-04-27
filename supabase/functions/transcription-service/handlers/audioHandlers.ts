
import { corsHeaders } from "../utils/cors.ts";

export async function handleDownloadAudio(req: Request, headers: HeadersInit) {
  try {
    const { url } = await req.json();
    
    if (!url) {
      throw new Error("No URL provided");
    }
    
    console.log(`Downloading audio from URL: ${url}`);
    
    // Extract filename from URL
    let filename = 'audio.mp3';
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const lastPathPart = pathParts[pathParts.length - 1];
      
      if (lastPathPart && (lastPathPart.endsWith('.mp3') || lastPathPart.endsWith('.wav') || lastPathPart.endsWith('.m4a'))) {
        filename = lastPathPart;
      }
    } catch (e) {
      console.warn('Could not parse URL for filename, using default');
    }
    
    let finalUrl = url;
    
    // Handle Dropbox URLs
    if (url.includes('dropbox.com')) {
      finalUrl = url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
      if (!finalUrl.includes('dl=0') && !finalUrl.includes('dl=1')) {
        finalUrl += '?dl=1';
      } else {
        finalUrl = finalUrl.replace('dl=0', 'dl=1');
      }
    }
    
    // Handle Google Drive URLs
    if (url.includes('drive.google.com/file/d/')) {
      const fileId = url.match(/\/d\/(.+?)\/|\/d\/(.+)$/);
      if (fileId && (fileId[1] || fileId[2])) {
        const driveId = fileId[1] || fileId[2];
        finalUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
      }
    }
    
    console.log(`Fetching audio from adjusted URL: ${finalUrl}`);
    
    const response = await fetch(finalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download audio from URL: ${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('audio/') && !contentType.includes('video/') && !contentType.includes('application/octet-stream')) {
      console.warn(`Unexpected content type: ${contentType} for URL: ${finalUrl}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    return new Response(
      arrayBuffer,
      {
        headers: {
          ...corsHeaders,
          'Content-Type': contentType || 'audio/mpeg',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      }
    );
  } catch (error) {
    console.error("Error downloading audio from URL:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers
      }
    );
  }
}
