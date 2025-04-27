
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.4.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? '';
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Update job status in the database
export async function updateJobStatus(
  jobId: string, 
  status: 'pending' | 'processing' | 'completed' | 'failed',
  statusMessage: string, 
  error?: string,
  result?: any
) {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  };

  if (error) {
    updateData.error = error;
  }

  if (result) {
    updateData.result = result;
  }

  try {
    const { error: updateError } = await supabase
      .from('transcriptions')
      .update(updateData)
      .eq('id', jobId);

    if (updateError) {
      console.error(`Error updating job ${jobId} status:`, updateError);
      throw new Error(`Failed to update job status: ${updateError.message}`);
    }

    console.log(`Updated job ${jobId} status to ${status}: ${statusMessage}`);
  } catch (error) {
    console.error(`Error in updateJobStatus for job ${jobId}:`, error);
    throw error;
  }
}

// Helper function to format time for VTT
export function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}

// Helper function to convert text to VTT format
export function convertTextToVTT(text: string): string {
  let vttContent = 'WEBVTT\n\n';
  
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  sentences.forEach((sentence: string, index: number) => {
    const startTime = formatVTTTime(index * 5);
    const endTime = formatVTTTime((index + 1) * 5);
    vttContent += `${startTime} --> ${endTime}\n${sentence.trim()}\n\n`;
  });
  
  return vttContent;
}
