
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@aws-sdk/client-s3@3.204.0";
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.204.0";
import { PutObjectCommand } from "https://esm.sh/@aws-sdk/client-s3@3.204.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};


// Get AWS credentials from environment variables
const AWS_ACCESS_KEY_ID = Deno.env.get('AWS_ACCESS_KEY_ID');
const AWS_SECRET_ACCESS_KEY = Deno.env.get('AWS_SECRET_ACCESS_KEY');

// Create an S3 client
const s3Client = new createClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID || "",
    secretAccessKey: AWS_SECRET_ACCESS_KEY || "",
  },
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    });
  }
  
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
      });
    }

    // Parse the multipart form data from the request
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const key = formData.get("key") as string;
    const bucket = formData.get("bucket") as string || "videos-transcriptions-dev";
    const region = formData.get("region") as string || "us-east-1";

    if (!file || !key) {
      return new Response(
        JSON.stringify({ error: "File and key are required" }),
        {
          status: 400,
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          },
        }
      );
    }

    // Read the file content
    const fileBuffer = await file.arrayBuffer();
    const fileContent = new Uint8Array(fileBuffer);

    // Create the upload command
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileContent,
      ContentType: file.type,
    });

    // Upload the file to S3
    const result = await s3Client.send(command);
    
    // Generate the URL for the uploaded file
    const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

    return new Response(
      JSON.stringify({
        success: true,
        url: url,
        key: key,
        bucket: bucket,
        region: region,
      }),
      {
        status: 200,
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
      }
    );
  } catch (error) {
    console.error("Error uploading to S3:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to upload file", 
        details: error.message 
      }),
      {
        status: 500,
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
      }
    );
  }
});
