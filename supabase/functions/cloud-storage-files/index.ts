
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.3';

const GOOGLE_DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const DROPBOX_FILES_URL = 'https://api.dropboxapi.com/2/files/list_folder';

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
    const folderId = url.searchParams.get('folderId');

    if (!provider || !accountId) {
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

    let files = [];

    // List files based on provider
    if (provider === 'google-drive') {
      let url = GOOGLE_DRIVE_FILES_URL;
      const params = new URLSearchParams({
        fields: 'files(id,name,mimeType,size,iconLink,thumbnailLink,webViewLink,modifiedTime)',
        orderBy: 'folder,name',
        pageSize: '100',
        q: 'trashed=false and mimeType contains "audio/"'
      });

      // Add parent folder filter if specified
      if (folderId) {
        params.set('q', `'${folderId}' in parents and trashed=false and mimeType contains "audio/"`);
      }

      const response = await fetch(`${url}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${account.access_token}`
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Google Drive API error: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      files = data.files.map(file => ({
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: parseInt(file.size || '0', 10),
        iconLink: file.iconLink,
        thumbnailLink: file.thumbnailLink,
        webViewLink: file.webViewLink,
        modifiedTime: file.modifiedTime
      }));
    } else if (provider === 'dropbox') {
      const path = folderId || '';
      const response = await fetch(DROPBOX_FILES_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${account.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path: path === '' ? '' : path,
          recursive: false,
          include_media_info: true,
          include_deleted: false,
          include_has_explicit_shared_members: false
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Dropbox API error: ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      files = data.entries
        .filter(entry => !entry.is_folder && entry.path_lower.match(/\.(mp3|wav|m4a|ogg|flac)$/i))
        .map(entry => ({
          id: entry.id,
          name: entry.name,
          mimeType: entry.media_info?.metadata?.dimensions ? 'audio/mp3' : 'application/octet-stream',
          size: entry.size,
          path: entry.path_lower,
          modifiedTime: entry.server_modified
        }));
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid provider' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ files }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error listing files:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
