
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Extract the path for different operations
  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();

  try {
    const { sharePointUrl, fileUrl } = await req.json();

    if (path === 'list-files') {
      // Log for debugging
      console.log(`Processing SharePoint list request for: ${sharePointUrl}`);

      // For security, we'll check if the URL is a valid SharePoint URL
      if (!isValidSharePointUrl(sharePointUrl)) {
        return new Response(
          JSON.stringify({ error: 'Invalid SharePoint URL' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // In a real implementation, we would use Microsoft Graph API or SharePoint API
      // Since direct integration requires authentication, we'll use our simulated data
      // based on the URLs provided for now
      
      // This is a simulated response - in a real implementation, this would call
      // the SharePoint API with proper authentication
      const files = simulateSharePointListResponse(sharePointUrl);

      return new Response(
        JSON.stringify({ files }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } 
    else if (path === 'download-file') {
      // Log for debugging
      console.log(`Processing file download request for: ${fileUrl}`);

      if (!isValidSharePointUrl(fileUrl)) {
        return new Response(
          JSON.stringify({ error: 'Invalid SharePoint file URL' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // In a real implementation, we would download the file from SharePoint
      // For this demo, we'll create a simple audio file that can be transcribed
      const audioContent = await generateDemoAudioContent();

      return new Response(
        audioContent,
        { headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg' } }
      );
    }
    else {
      return new Response(
        JSON.stringify({ error: 'Unknown operation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in SharePoint proxy:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Validate SharePoint URLs
function isValidSharePointUrl(url: string): boolean {
  // Basic validation - should be improved in production
  return url.indexOf('sharepoint.com') !== -1 || 
         url.indexOf('onedrive.live.com') !== -1 || 
         url.indexOf('1drv.ms') !== -1;
}

// Simulate SharePoint list response with some demo files
function simulateSharePointListResponse(sharePointUrl: string) {
  console.log(`Simulating file list for: ${sharePointUrl}`);
  
  // Generate a predictable set of files based on URL to ensure consistency
  const hash = stringToSimpleHash(sharePointUrl);
  const fileCount = (hash % 5) + 3; // Generate between 3-7 files
  
  const files = [];
  
  // Add some consistent file names with the URL's hash to ensure variety
  const baseNames = [
    'Meeting_Recording', 
    'Interview', 
    'Conference_Call', 
    'Team_Discussion',
    'Project_Update',
    'Client_Presentation',
    'Quarterly_Review'
  ];
  
  for (let i = 0; i < fileCount; i++) {
    const nameIndex = (hash + i) % baseNames.length;
    const name = `${baseNames[nameIndex]}_${(hash % 100) + i}.mp3`;
    
    files.push({
      name,
      url: `${sharePointUrl}/${name}`,
      size: Math.floor(Math.random() * 1000000) + 500000, // Random size between 500KB and 1.5MB
      lastModified: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
    });
  }
  
  return files;
}

// Generate a simple numeric hash from a string
function stringToSimpleHash(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash);
}

// Generate demo audio content (a small MP3 file)
async function generateDemoAudioContent(): Promise<ArrayBuffer> {
  // This is a very small MP3 file with just a beep sound
  // In a real implementation, this would download the actual file from SharePoint
  const response = await fetch('https://filesamples.com/samples/audio/mp3/sample3.mp3');
  return await response.arrayBuffer();
}
