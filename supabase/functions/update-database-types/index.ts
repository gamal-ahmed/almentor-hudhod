
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    // Initialize the Supabase client with Deno environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create the stored procedure to insert brightcove publication records
    const { error: rpcError } = await supabase.rpc('create_insert_brightcove_publication_function', {
      function_sql: `
CREATE OR REPLACE FUNCTION insert_brightcove_publication(
  p_session_id UUID,
  p_video_id TEXT,
  p_model_id UUID,
  p_model_name TEXT,
  p_transcription_url TEXT,
  p_brightcove_response JSONB
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.brightcove_publications (
    session_id,
    video_id,
    model_id,
    model_name,
    transcription_url,
    brightcove_response,
    is_published
  ) VALUES (
    p_session_id,
    p_video_id,
    p_model_id,
    p_model_name,
    p_transcription_url,
    p_brightcove_response,
    TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`
    });

    if (rpcError) {
      throw new Error(`Failed to create RPC function: ${rpcError.message}`);
    }
    
    return new Response(
      JSON.stringify({ success: true, message: 'Database types updated successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in update-database-types function:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
