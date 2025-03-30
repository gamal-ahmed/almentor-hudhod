
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://xbwnjfdzbnyvaxmqufrw.supabase.co';
    const supabaseKey = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    // Extract form data
    const formData = await req.formData();
    const audioFile = formData.get("audio");
    const model = formData.get("model")?.toString() || "openai";

    // Validate request
    if (!audioFile || !(audioFile instanceof File)) {
      throw new Error("No audio file provided or invalid file");
    }

    if (!["openai", "gemini-2.0-flash", "phi4"].includes(model)) {
      throw new Error("Invalid model specified");
    }

    console.log(`Queueing transcription for file: ${audioFile.name}, using model: ${model}`);

    // Generate a unique file path in storage
    const timestamp = new Date().getTime();
    const fileExt = audioFile.name.split('.').pop() || 'mp3';
    const storagePath = `${user.id}/${timestamp}-${audioFile.name}`;
    
    // Upload the file to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('transcription-files')
      .upload(storagePath, audioFile, {
        contentType: audioFile.type,
        upsert: false
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    console.log(`File uploaded to storage: ${storagePath}`);

    // Create a new transcription job
    const { data: job, error: jobError } = await supabase
      .from('transcriptions')
      .insert({
        user_id: user.id,
        file_path: storagePath,
        model: model,
        status: 'pending',
      })
      .select()
      .single();

    if (jobError) {
      console.error("Job creation error:", jobError);
      
      // Clean up the uploaded file if job creation fails
      await supabase.storage
        .from('transcription-files')
        .remove([storagePath]);
      
      throw new Error(`Failed to create transcription job: ${jobError.message}`);
    }

    console.log(`Created transcription job: ${job.id}`);

    // Return job information
    return new Response(
      JSON.stringify({
        job_id: job.id,
        status: job.status,
        message: "Transcription job queued successfully",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in queue-transcription function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
