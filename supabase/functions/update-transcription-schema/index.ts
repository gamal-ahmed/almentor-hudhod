
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
      
      // Also add vtt_file_url column to transcription_sessions if it doesn't exist
      const { data: vttUrlColumnCheck, error: vttUrlColumnCheckError } = await supabase.rpc('check_column_exists', {
        table_name: 'transcription_sessions',
        column_name: 'vtt_file_url'
      });
      
      if (vttUrlColumnCheckError) {
        throw new Error(`Error checking vtt_file_url column: ${vttUrlColumnCheckError.message}`);
      }
      
      if (!vttUrlColumnCheck) {
        const { error: addVttUrlColumnError } = await supabase.rpc('add_column_if_not_exists', {
          table_name: 'transcription_sessions',
          column_name: 'vtt_file_url',
          column_type: 'text'
        });
        
        if (addVttUrlColumnError) {
          throw new Error(`Error adding vtt_file_url column: ${addVttUrlColumnError.message}`);
        }
      }
      
      // Add selected_model_id column to transcription_sessions if it doesn't exist
      const { data: selectedModelIdColumnCheck, error: selectedModelIdColumnCheckError } = await supabase.rpc('check_column_exists', {
        table_name: 'transcription_sessions',
        column_name: 'selected_model_id'
      });
      
      if (selectedModelIdColumnCheckError) {
        throw new Error(`Error checking selected_model_id column: ${selectedModelIdColumnCheckError.message}`);
      }
      
      if (!selectedModelIdColumnCheck) {
        const { error: addSelectedModelIdColumnError } = await supabase.rpc('add_column_if_not_exists', {
          table_name: 'transcription_sessions',
          column_name: 'selected_model_id',
          column_type: 'uuid'
        });
        
        if (addSelectedModelIdColumnError) {
          throw new Error(`Error adding selected_model_id column: ${addSelectedModelIdColumnError.message}`);
        }
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Added session_id column to transcriptions table, vtt_file_url and selected_model_id columns to transcription_sessions table' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if selected_model_id column exists in transcription_sessions table
    const { data: selectedModelIdCheck, error: selectedModelIdCheckError } = await supabase.rpc('check_column_exists', {
      table_name: 'transcription_sessions',
      column_name: 'selected_model_id'
    });
    
    if (selectedModelIdCheckError) {
      throw new Error(`Error checking selected_model_id column: ${selectedModelIdCheckError.message}`);
    }
    
    if (!selectedModelIdCheck) {
      const { error: addSelectedModelIdError } = await supabase.rpc('add_column_if_not_exists', {
        table_name: 'transcription_sessions',
        column_name: 'selected_model_id',
        column_type: 'uuid'
      });
      
      if (addSelectedModelIdError) {
        throw new Error(`Error adding selected_model_id column: ${addSelectedModelIdError.message}`);
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Added selected_model_id column to transcription_sessions table' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true, message: 'All required columns already exist' }),
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
