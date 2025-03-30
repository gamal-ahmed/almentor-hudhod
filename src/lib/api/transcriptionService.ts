import { SUPABASE_KEY, API_ENDPOINTS } from './utils';
import { TranscriptionModel } from "@/components/ModelSelector";
import { supabase } from "@/integrations/supabase/client";

// Function to transcribe audio using OpenAI
export async function transcribeAudio(file: File, model: TranscriptionModel, prompt: string): Promise<{ vttContent: string; prompt: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', model);
  formData.append('prompt', prompt);

  let endpointURL = '';

  if (model === 'openai') {
    endpointURL = API_ENDPOINTS.OPENAI_TRANSCRIBE;
  } else if (model === 'gemini-2.0-flash') {
    endpointURL = API_ENDPOINTS.GEMINI_TRANSCRIBE;
  } else if (model === 'phi4') {
    endpointURL = API_ENDPOINTS.PHI4_TRANSCRIBE;
  } else {
    throw new Error(`Unsupported model: ${model}`);
  }

  try {
    const response = await fetch(endpointURL, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Full error response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      console.error('Function error:', data.error);
      throw new Error(`Transcription function error: ${data.error}`);
    }

    return { 
      vttContent: data.vttContent,
      prompt: data.prompt
    };
  } catch (error) {
    console.error("Failed to transcribe audio:", error);
    throw error;
  }
}

// Function to queue a transcription job
export async function queueTranscription(file: File, model: TranscriptionModel): Promise<{ jobId: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('model', model);

  try {
    const response = await fetch(API_ENDPOINTS.QUEUE_TRANSCRIPTION, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { jobId: data.jobId };
  } catch (error) {
    console.error("Failed to queue transcription:", error);
    throw error;
  }
}

// Function to get the status of a transcription job
export async function getTranscriptionStatus(jobId: string): Promise<{ status: string, result?: any, error?: string }> {
    try {
        const response = await fetch(`${API_ENDPOINTS.GET_TRANSCRIPTION_STATUS}?job_id=${jobId}`, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_KEY,
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to get transcription status:", error);
        throw error;
    }
}

// Function to get all transcription jobs for a user
export async function getTranscriptionJobs(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('transcription_jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching transcription jobs:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error getting transcription jobs:', error);
    throw error;
  }
}

// Function to get the latest transcription job for a user
export async function getLatestTranscriptionJob(): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from('transcription_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching latest transcription job:', error);
      throw error;
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error getting latest transcription job:', error);
    throw error;
  }
}

export async function saveTranscriptionResult(
  file: File,
  model: string,
  vttContent: string,
  prompt: string
): Promise<string> {
  try {
    // Upload the file to Supabase Storage
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `audio/${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('transcription-files')
      .upload(filePath, file);
      
    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw uploadError;
    }
    
    // Save the job record to Supabase
    const { data: jobData, error: jobError } = await supabase
      .from('transcription_jobs')
      .insert({
        file_path: filePath,
        model: model,
        file_name: file.name,
        status: 'completed',
        result: {
          vttContent,
          prompt
        }
      });
      
    if (jobError) {
      console.error('Error saving transcription job:', jobError);
      throw jobError;
    }
    
    return filePath;
  } catch (error) {
    console.error('Error saving transcription result:', error);
    throw error;
  }
}
