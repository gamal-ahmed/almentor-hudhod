
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.3';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USER_INFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
const DROPBOX_TOKEN_URL = 'https://api.dropboxapi.com/oauth2/token';
const DROPBOX_USER_INFO_URL = 'https://api.dropboxapi.com/2/users/get_current_account';

const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');
const DROPBOX_CLIENT_ID = Deno.env.get('DROPBOX_CLIENT_ID');
const DROPBOX_CLIENT_SECRET = Deno.env.get('DROPBOX_CLIENT_SECRET');

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

    // Parse request body
    const { provider, code, redirectUrl } = await req.json();

    if (!provider || !code || !redirectUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Exchange the authorization code for access token and user info
    let accessToken, refreshToken, expiresIn, userEmail, userName;

    if (provider === 'google-drive') {
      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return new Response(
          JSON.stringify({ error: 'Google Drive client credentials not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Exchange code for token
      const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          code,
          redirect_uri: redirectUrl,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        throw new Error(`Google token exchange failed: ${JSON.stringify(error)}`);
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;
      refreshToken = tokenData.refresh_token;
      expiresIn = tokenData.expires_in;

      // Get user info
      const userResponse = await fetch(GOOGLE_USER_INFO_URL, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get Google user info');
      }

      const userData = await userResponse.json();
      userEmail = userData.email;
      userName = userData.name;

    } else if (provider === 'dropbox') {
      if (!DROPBOX_CLIENT_ID || !DROPBOX_CLIENT_SECRET) {
        return new Response(
          JSON.stringify({ error: 'Dropbox client credentials not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Exchange code for token
      const tokenResponse = await fetch(DROPBOX_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: DROPBOX_CLIENT_ID,
          client_secret: DROPBOX_CLIENT_SECRET,
          code,
          redirect_uri: redirectUrl,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        throw new Error(`Dropbox token exchange failed: ${JSON.stringify(error)}`);
      }

      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;
      refreshToken = tokenData.refresh_token;
      expiresIn = tokenData.expires_in;

      // Get user info
      const userResponse = await fetch(DROPBOX_USER_INFO_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get Dropbox user info');
      }

      const userData = await userResponse.json();
      userEmail = userData.email;
      userName = `${userData.name.given_name} ${userData.name.surname}`.trim();
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid provider' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate expiration date if expiresIn is provided
    let expiresAt = null;
    if (expiresIn) {
      expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    }

    // Insert or update account in the database
    const { data: existingAccount, error: fetchError } = await supabase
      .from('cloud_storage_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider', provider)
      .eq('email', userEmail)
      .maybeSingle();

    let accountId;

    if (existingAccount) {
      // Update existing account
      const { data, error } = await supabase
        .from('cloud_storage_accounts')
        .update({
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          last_used: new Date().toISOString(),
        })
        .eq('id', existingAccount.id)
        .select()
        .single();

      if (error) throw error;
      accountId = data.id;
    } else {
      // Insert new account
      const { data, error } = await supabase
        .from('cloud_storage_accounts')
        .insert({
          user_id: user.id,
          provider,
          email: userEmail,
          name: userName,
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
          last_used: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      accountId = data.id;
    }

    return new Response(
      JSON.stringify({
        account: {
          id: accountId,
          provider,
          email: userEmail,
          name: userName,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing OAuth token:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
