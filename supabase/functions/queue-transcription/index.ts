
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
      console.error("No Authorization header provided");
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Initialize Supabase client with the token
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://xbwnjfdzbnyvaxmqufrw.supabase.co';
    const supabaseKey = authHeader.replace('Bearer ', '');
    
    // Create client with the JWT token from the request
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the JWT token and get user data
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Authentication error:", userError);
        return new Response(
          JSON.stringify({ error: 'Authentication failed', details: userError.message }),
          {
            status: 401,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }
      
      if (!user) {
        console.error("User not found in token");
        return new Response(
          JSON.stringify({ error: 'Authentication required' }),
          {
            status: 401,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      console.log(`Authenticated user: ${user.id}, ${user.email}`);

      // Extract form data
      const formData = await req.formData();
      const audioFile = formData.get("audio");
      const model = formData.get("model")?.toString() || "openai";
      const fileName = formData.get("fileName")?.toString() || audioFile?.name || "audio-file";

      // Validate request
      if (!audioFile || !(audioFile instanceof File)) {
        throw new Error("No audio file provided or invalid file");
      }

      if (!["openai", "gemini-2.0-flash", "phi4"].includes(model)) {
        throw new Error("Invalid model specified");
      }

      console.log(`Queueing transcription for file: ${fileName}, using model: ${model}`);

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
        .from('transcription_jobs')
        .insert({
          user_id: user.id,
          file_path: storagePath,
          file_name: fileName,
          model: model,
          status: 'pending',
          status_message: 'Job queued and waiting to be processed'
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
          jobId: job.id,
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
    } catch (authError) {
      console.error("Authentication error:", authError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: authError.message }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }
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
