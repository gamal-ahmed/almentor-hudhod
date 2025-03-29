
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  S3Client, 
  PutObjectCommand 
} from "https://esm.sh/@aws-sdk/client-s3@3.456.0"; 
import { getSignedUrl } from "https://esm.sh/@aws-sdk/s3-request-presigner@3.456.0"; 

// Set CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  
  try {
    const url = new URL(req.url);
    const filename = url.searchParams.get("filename");
    const contentType = url.searchParams.get("contentType");
    
    if (!filename || !contentType) {
      return new Response(
        JSON.stringify({ error: "filename and contentType are required query parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Get AWS credentials from environment variables
    const AWS_ACCESS_KEY_ID = Deno.env.get("AWS_ACCESS_KEY_ID");
    const AWS_SECRET_ACCESS_KEY = Deno.env.get("AWS_SECRET_ACCESS_KEY");
    
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
      return new Response(
        JSON.stringify({ error: "AWS credentials not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Create a minimal S3 client for Deno environment
    const s3Client = new S3Client({
      region: "us-east-1",
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
      // Disable file system configuration completely
      loadConfigFile: false,
    });
    
    // Set up the S3 bucket and key for the file
    const bucket = "videos-transcriptions-dev";
    const key = `client-uploads/${Date.now()}-${filename}`;
    
    // Create the command to put an object in S3
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });
    
    // Generate a pre-signed URL (expires in 10 minutes)
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });
    
    console.log("Successfully generated presigned URL");
    
    // Return the pre-signed URL and the eventual public URL
    return new Response(
      JSON.stringify({ 
        presignedUrl,
        publicUrl: `https://${bucket}.s3.amazonaws.com/${key}`
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
