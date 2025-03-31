
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.3';

const GOOGLE_DRIVE_FILE_URL = 'https://www.googleapis.com/drive/v3/files';
const DROPBOX_DOWNLOAD_URL = 'https://content.dropboxapi.com/2/files/download';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Create a Supabase client with the auth context of the logged in user
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get query parameters
    const url = new URL(req.url);
    const provider = url.searchParams.get('provider');
    const accountId = url.searchParams.get('accountId');
    const fileId = url.searchParams.get('fileId');

    if (!provider || !accountId || !fileId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get account from database
    const { data: account, error: accountError } = await supabase
      .from('cloud_storage_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      return new Response(
        JSON.stringify({ error: 'Account not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update last_used timestamp
    await supabase
      .from('cloud_storage_accounts')
      .update({ last_used: new Date().toISOString() })
      .eq('id', accountId);

    let fileContent;
    let contentType;

    // Download file based on provider
    if (provider === 'google-drive') {
      // Get file metadata
      const metadataResponse = await fetch(`${GOOGLE_DRIVE_FILE_URL}/${fileId}?fields=name,mimeType`, {
        headers: {
          'Authorization': `Bearer ${account.access_token}`
        }
      });

      if (!metadataResponse.ok) {
        const error = await metadataResponse.json();
        throw new Error(`Google Drive API error: ${JSON.stringify(error)}`);
      }

      const metadata = await metadataResponse.json();
      contentType = metadata.mimeType;

      // Download file content
      const downloadResponse = await fetch(`${GOOGLE_DRIVE_FILE_URL}/${fileId}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${account.access_token}`
        }
      });

      if (!downloadResponse.ok) {
        throw new Error(`Failed to download Google Drive file: ${downloadResponse.statusText}`);
      }

      fileContent = await downloadResponse.arrayBuffer();
    } else if (provider === 'dropbox') {
      const downloadResponse = await fetch(DROPBOX_DOWNLOAD_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${account.access_token}`,
          'Dropbox-API-Arg': JSON.stringify({ path: fileId })
        }
      });

      if (!downloadResponse.ok) {
        throw new Error(`Failed to download Dropbox file: ${downloadResponse.statusText}`);
      }

      contentType = downloadResponse.headers.get('content-type') || 'application/octet-stream';
      fileContent = await downloadResponse.arrayBuffer();
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid provider' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(fileContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType || 'application/octet-stream',
        'Content-Disposition': 'attachment'
      }
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
