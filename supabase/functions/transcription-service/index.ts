
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
    else if (path === 'start-job') {
      return await handleStartJob(req);
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

// Handle starting a transcription job
async function handleStartJob(req: Request) {
  console.log("Starting transcription job");
  
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio');
    const prompt = formData.get('prompt')?.toString() || '';
    const jobId = formData.get('jobId')?.toString();
    
    if (!audioFile || !(audioFile instanceof File)) {
      return new Response(JSON.stringify({ error: 'No audio file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!jobId) {
      return new Response(JSON.stringify({ error: 'No job ID provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`Received job ID: ${jobId}, audioFile: ${audioFile.name}, size: ${audioFile.size}`);
    
    // Get the auth header to determine the user
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    // Update job status to processing
    const { error: updateError } = await supabase
      .from('transcriptions')
      .update({ 
        status: 'processing',
        status_message: 'Job started, processing audio file',
        user_id: user?.id || null
      })
      .eq('id', jobId);
    
    if (updateError) {
      console.error('Error updating job status:', updateError);
      throw new Error(`Failed to update job status: ${updateError.message}`);
    }
    
    // Start processing in the background
    EdgeRuntime.waitUntil(processTranscription(jobId, audioFile, prompt));
    
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Transcription job started',
      jobId
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error starting transcription job:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Process the transcription in the background
async function processTranscription(jobId: string, audioFile: File, prompt: string) {
  try {
    console.log(`Processing transcription for job ${jobId}`);
    
    // Get model from the database
    const { data: jobData, error: jobError } = await supabase
      .from('transcriptions')
      .select('model')
      .eq('id', jobId)
      .single();
    
    if (jobError) {
      throw new Error(`Error retrieving job: ${jobError.message}`);
    }
    
    const model = jobData.model;
    console.log(`Using transcription model: ${model}`);
    
    // Choose the appropriate API based on the model
    let apiEndpoint = '';
    
    switch (model) {
      case 'openai':
        apiEndpoint = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/openai-transcribe';
        break;
      case 'gemini-2.0-flash':
        apiEndpoint = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/gemini-transcribe';
        break;
      case 'phi4':
        apiEndpoint = 'https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/phi4-transcribe';
        break;
      default:
        throw new Error(`Unsupported model: ${model}`);
    }
    
    // Prepare FormData for the transcription request
    const transcriptionData = new FormData();
    transcriptionData.append('audio', audioFile);
    transcriptionData.append('prompt', prompt);
    
    console.log(`Sending request to ${apiEndpoint}`);
    
    // Call the appropriate transcription service
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: transcriptionData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Transcription API error: ${response.status} - ${errorText}`);
    }
    
    const transcriptionResult = await response.json();
    console.log(`Transcription completed successfully for job ${jobId}`);
    
    // Update job with successful results
    const { error: updateError } = await supabase
      .from('transcriptions')
      .update({
        status: 'completed',
        result: transcriptionResult,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
    
    if (updateError) {
      throw new Error(`Failed to update job with results: ${updateError.message}`);
    }
    
    console.log(`Job ${jobId} marked as completed`);
    
  } catch (error) {
    console.error(`Error processing transcription for job ${jobId}:`, error);
    
    // Update job with error status
    try {
      await supabase
        .from('transcriptions')
        .update({
          status: 'failed',
          error: error.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
    } catch (updateError) {
      console.error('Failed to update job with error status:', updateError);
    }
  }
}
