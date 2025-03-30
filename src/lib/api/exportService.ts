
import { API_ENDPOINTS, SUPABASE_KEY } from "./utils";
import { useLogsStore } from "@/lib/useLogsStore";
import { supabase } from "@/integrations/supabase/client";

const getLogsStore = () => useLogsStore.getState();

export type ExportFormat = 'vtt' | 'srt' | 'txt' | 'json';

interface ExportResponse {
  fileUrl: string;
  fileName: string;
  format: ExportFormat;
}

// Export transcription to server and get a download URL
export async function exportTranscription(
  transcriptionContent: string, 
  format: ExportFormat,
  fileName: string = `transcription-${Date.now()}`
): Promise<ExportResponse> {
  const addLog = getLogsStore().addLog;
  const startTimedLog = getLogsStore().startTimedLog;
  
  const logOperation = startTimedLog(`Exporting transcription as ${format}`, "info", "Export");
  
  try {
    // Prepare FormData for the export request
    const formData = new FormData();
    formData.append('content', transcriptionContent);
    formData.append('format', format);
    formData.append('fileName', fileName);
    
    addLog(`Exporting transcription as ${format}`, "info", {
      source: "Export",
      details: `File: ${fileName}.${format}`
    });
    
    // Send request to save file on server
    const response = await fetch(`${API_ENDPOINTS.TRANSCRIPTION_SERVICE}/export-file`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to export transcription: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    addLog(`Successfully exported transcription`, "success", {
      source: "Export",
      details: `Generated file: ${data.fileName}.${data.format}`
    });
    
    logOperation.complete(`Exported transcription as ${format}`, `File saved as ${data.fileName}.${data.format}`);
    
    return data;
  } catch (error) {
    addLog(`Error exporting transcription: ${error.message}`, "error", {
      source: "Export",
      details: error.stack
    });
    console.error(`Error exporting transcription:`, error);
    logOperation.error(`${error.message}`, error.stack);
    throw error;
  }
}

// Get user's exported transcription files
export async function getUserExportedFiles() {
  try {
    const { data, error } = await supabase
      .from('transcription_exports')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch user exports: ${error.message}`);
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching user exported files:', error);
    throw error;
  }
}

// Convert VTT to SRT format
export function convertVttToSrt(vttContent: string): string {
  if (!vttContent.trim()) return '';
  
  // Remove WEBVTT header and notes
  let content = vttContent.replace(/^WEBVTT.*$/m, '').trim();
  
  // Split by double newline to get cues
  const cues = content.split(/\n\s*\n/).filter(cue => cue.trim());
  
  // Process each cue
  return cues.map((cue, index) => {
    // Split by line
    const lines = cue.trim().split('\n');
    
    // Extract timestamp line (should contain -->)
    const timestampLine = lines.find(line => line.includes('-->'));
    if (!timestampLine) return '';
    
    // Convert timestamp format from HH:MM:SS.mmm to HH:MM:SS,mmm
    const convertedTimestamp = timestampLine.replace(/(\d+):(\d+):(\d+)\.(\d+)/g, '$1:$2:$3,$4');
    
    // Get all lines after timestamp (these are the text content)
    const startIndex = lines.indexOf(timestampLine) + 1;
    const textContent = lines.slice(startIndex).join('\n');
    
    // Format as SRT
    return `${index + 1}\n${convertedTimestamp}\n${textContent}`;
  }).join('\n\n');
}

// Convert VTT to plain text
export function convertVttToText(vttContent: string): string {
  if (!vttContent.trim()) return '';
  
  // Remove WEBVTT header and notes
  let content = vttContent.replace(/^WEBVTT.*$/m, '').trim();
  
  // Split by double newline to get cues
  const cues = content.split(/\n\s*\n/).filter(cue => cue.trim());
  
  // Process each cue
  return cues.map(cue => {
    // Split by line
    const lines = cue.trim().split('\n');
    
    // Find the timestamp line
    const timestampLineIndex = lines.findIndex(line => line.includes('-->'));
    if (timestampLineIndex === -1) return '';
    
    // Extract text (all lines after timestamp line)
    return lines.slice(timestampLineIndex + 1).join(' ');
  }).join(' ');
}

// Convert VTT to JSON format
export function convertVttToJson(vttContent: string): string {
  if (!vttContent.trim()) return '[]';
  
  // Remove WEBVTT header and notes
  let content = vttContent.replace(/^WEBVTT.*$/m, '').trim();
  
  // Split by double newline to get cues
  const cues = content.split(/\n\s*\n/).filter(cue => cue.trim());
  
  // Process each cue into a JSON object
  const jsonCues = cues.map(cue => {
    // Split by line
    const lines = cue.trim().split('\n');
    
    // Find and parse timestamp line
    const timestampLine = lines.find(line => line.includes('-->'));
    if (!timestampLine) return null;
    
    const [startTime, endTime] = timestampLine.split('-->').map(t => t.trim());
    
    // Extract text (all lines after timestamp line)
    const startIndex = lines.indexOf(timestampLine) + 1;
    const text = lines.slice(startIndex).join(' ');
    
    return {
      startTime,
      endTime,
      text
    };
  }).filter(Boolean);
  
  return JSON.stringify(jsonCues, null, 2);
}
