
import { SUPABASE_KEY } from './utils';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

export interface ExportFile {
  id: string;
  file_name: string;
  format: string;
  file_url: string;
  user_id: string;
  created_at: string;
  size_bytes?: number;
}

export type ExportFormat = 'vtt' | 'srt' | 'txt' | 'json';

/**
 * Export transcription to file and save it in storage
 */
export async function exportTranscription(
  content: string,
  format: ExportFormat = 'vtt',
  fileName: string = `transcription-${Date.now()}`
): Promise<ExportFile> {
  const formData = new FormData();
  formData.append('content', content);
  formData.append('format', format);
  formData.append('fileName', fileName);

  // Get authorization token
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || '';

  // Make request to edge function
  const response = await fetch('https://xbwnjfdzbnyvaxmqufrw.supabase.co/functions/v1/transcription-service/export-file', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_KEY,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to export transcription');
  }

  const data = await response.json();
  
  return {
    id: data.id,
    file_name: data.fileName,
    format: data.format,
    file_url: data.fileUrl,
    user_id: 'current', // This will be set by the edge function
    created_at: new Date().toISOString(),
    size_bytes: data.sizeBytes
  };
}

/**
 * Get all exported files for the current user
 */
export async function getUserExportedFiles(): Promise<ExportFile[]> {
  try {
    // Since transcription_exports is not in the generated type, we need to use string literal
    const { data, error } = await supabase
      .from('transcription_exports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching exported files:', error);
      throw error;
    }

    return (data || []) as ExportFile[];
  } catch (error) {
    console.error('Failed to get user exported files:', error);
    throw error;
  }
}

/**
 * Convert VTT to SRT format
 */
export function convertVttToSrt(vttContent: string): string {
  // Simple conversion logic - in a real app, this would be more sophisticated
  const lines = vttContent.split('\n');
  let srtContent = '';
  let counter = 1;
  
  // Skip the WEBVTT header
  let i = 1;
  while (i < lines.length) {
    if (lines[i].match(/\d\d:\d\d:\d\d\.\d\d\d --> \d\d:\d\d:\d\d\.\d\d\d/)) {
      // Add counter
      srtContent += counter + '\n';
      counter++;
      
      // Convert timestamp format from HH:MM:SS.mmm --> HH:MM:SS.mmm to HH:MM:SS,mmm --> HH:MM:SS,mmm
      const timestamp = lines[i].replace(/\./g, ',');
      srtContent += timestamp + '\n';
      
      // Add text content
      i++;
      while (i < lines.length && lines[i].trim() !== '') {
        srtContent += lines[i] + '\n';
        i++;
      }
      
      // Add a blank line between entries
      srtContent += '\n';
    }
    i++;
  }
  
  return srtContent;
}

/**
 * Convert VTT to plain text format
 */
export function convertVttToText(vttContent: string): string {
  // Simple conversion logic - in a real app, this would be more sophisticated
  const lines = vttContent.split('\n');
  let textContent = '';
  
  // Skip the WEBVTT header
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].match(/^\d\d:\d\d:\d\d\.\d\d\d --> \d\d:\d\d:\d\d\.\d\d\d/) && 
        lines[i].trim() !== '' && 
        !lines[i].startsWith('WEBVTT')) {
      textContent += lines[i] + ' ';
    }
  }
  
  return textContent.trim();
}

/**
 * Convert VTT to JSON format
 */
export function convertVttToJson(vttContent: string): string {
  // Simple conversion logic - in a real app, this would be more sophisticated
  const lines = vttContent.split('\n');
  const segments: Array<{text: string, startTime: string, endTime: string}> = [];
  
  let currentText = '';
  let currentStartTime = '';
  let currentEndTime = '';
  
  for (let i = 0; i < lines.length; i++) {
    const timestampMatch = lines[i].match(/(\d\d:\d\d:\d\d\.\d\d\d) --> (\d\d:\d\d:\d\d\.\d\d\d)/);
    
    if (timestampMatch) {
      currentStartTime = timestampMatch[1];
      currentEndTime = timestampMatch[2];
      currentText = '';
      
      // Collect all text lines until empty line
      i++;
      while (i < lines.length && lines[i].trim() !== '') {
        if (currentText) currentText += ' ';
        currentText += lines[i].trim();
        i++;
      }
      
      segments.push({
        startTime: currentStartTime,
        endTime: currentEndTime,
        text: currentText
      });
    }
  }
  
  return JSON.stringify({
    type: "transcription",
    segments
  }, null, 2);
}
