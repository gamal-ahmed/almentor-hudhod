
// Supabase Edge Function for transcription-related services
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';
import { v4 as uuidv4 } from 'https://esm.sh/uuid@9.0.1';

// Set up CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/').pop();

    // Handle different endpoints
    if (path === 'export-file') {
      return await handleExportFile(req);
    }

    // Default response for unmatched paths
    return new Response(JSON.stringify({ error: 'Endpoint not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Handle file export requests
async function handleExportFile(req: Request) {
  try {
    const formData = await req.formData();
    const content = formData.get('content')?.toString() || '';
    const format = formData.get('format')?.toString() || 'vtt';
    let fileName = formData.get('fileName')?.toString() || `transcription-${Date.now()}`;
    
    // Ensure file name doesn't have illegal characters
    fileName = fileName.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    if (!content) {
      return new Response(JSON.stringify({ error: 'No content provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    let fileContent = content;
    let mimeType = 'text/vtt';
    
    // Process content based on format
    switch (format) {
      case 'srt':
        // Add SRT conversion logic if needed
        mimeType = 'text/srt';
        break;
      case 'txt':
        // Add plain text conversion logic if needed
        mimeType = 'text/plain';
        break;
      case 'json':
        mimeType = 'application/json';
        break;
      default: // vtt
        mimeType = 'text/vtt';
    }
    
    // Create a Blob with the content
    const blob = new Blob([fileContent], { type: mimeType });
    const fileId = uuidv4();
    const filePath = `transcription-exports/${fileId}/${fileName}.${format}`;
    
    // Upload file to Supabase Storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('transcriptions')
      .upload(filePath, blob, { contentType: mimeType, upsert: false });
    
    if (storageError) {
      console.error('Storage error:', storageError);
      throw new Error(`Failed to upload file: ${storageError.message}`);
    }
    
    // Get public URL for the file
    const { data: urlData } = await supabase.storage
      .from('transcriptions')
      .getPublicUrl(filePath);
    
    const fileUrl = urlData.publicUrl;
    
    // Get file size
    const sizeBytes = blob.size;
    
    // Get the user ID from the request
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error('Auth error:', authError);
      // Proceed anyway, but log the user as anonymous
    }
    
    // Store the export info in the database
    const { data: dbData, error: dbError } = await supabase
      .from('transcription_exports')
      .insert({
        file_name: fileName,
        format: format,
        file_url: fileUrl,
        user_id: user?.id || 'anonymous',
        size_bytes: sizeBytes
      })
      .select('id')
      .single();
    
    if (dbError) {
      console.error('Database error:', dbError);
      // Don't fail the whole operation if db insert fails, just log it
    }
    
    return new Response(JSON.stringify({
      id: dbData?.id || fileId,
      fileName,
      format,
      fileUrl,
      sizeBytes
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error exporting file:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
