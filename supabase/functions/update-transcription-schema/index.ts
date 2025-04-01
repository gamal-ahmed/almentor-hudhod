
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
    
    // Check if session_id column exists in transcriptions table
    const { data: columnCheck, error: columnCheckError } = await supabase.rpc('check_column_exists', {
      table_name: 'transcriptions',
      column_name: 'session_id'
    });
    
    if (columnCheckError) {
      throw new Error(`Error checking column: ${columnCheckError.message}`);
    }
    
    // If column doesn't exist, add it
    if (!columnCheck) {
      const { error: alterTableError } = await supabase.rpc('add_column_if_not_exists', {
        table_name: 'transcriptions',
        column_name: 'session_id',
        column_type: 'uuid'
      });
      
      if (alterTableError) {
        throw new Error(`Error altering table: ${alterTableError.message}`);
      }
      
      return new Response(
        JSON.stringify({ success: true, message: 'Added session_id column to transcriptions table' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true, message: 'session_id column already exists' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in update-transcription-schema function:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
