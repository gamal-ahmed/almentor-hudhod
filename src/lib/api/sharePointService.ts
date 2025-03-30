
import { API_ENDPOINTS, SUPABASE_KEY } from "./utils";

// Fetch MP3 files from SharePoint
export async function fetchSharePointFiles(sharePointUrl: string): Promise<{name: string, url: string, size: number, lastModified: string}[]> {
  try {
    console.log(`Fetching SharePoint files from: ${sharePointUrl}`);
    const response = await fetch(`${API_ENDPOINTS.SHAREPOINT_PROXY}/list-files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        sharePointUrl
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch SharePoint files: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    console.log(`Received ${data.files.length} files from SharePoint proxy`);
    
    // Return all files, filtering will be done in the component
    return data.files;
  } catch (error) {
    console.error('Error fetching SharePoint files:', error);
    throw error;
  }
}

// Download a single file from SharePoint
export async function downloadSharePointFile(fileUrl: string): Promise<File> {
  try {
    console.log(`Downloading file from: ${fileUrl}`);
    const response = await fetch(`${API_ENDPOINTS.SHAREPOINT_PROXY}/download-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({
        fileUrl
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to download file: ${response.status} - ${errorText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    // Extract file name from URL
    const fileName = fileUrl.split('/').pop() || 'audio.mp3';
    
    // Create a File object from the array buffer
    return new File([arrayBuffer], fileName, { type: 'audio/mpeg' });
  } catch (error) {
    console.error('Error downloading SharePoint file:', error);
    throw error;
  }
}
