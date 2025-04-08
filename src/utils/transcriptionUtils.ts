import { TranscriptionJob } from "@/lib/api/types/transcription";

// Helper function to get model display name
export const getModelDisplayName = (model: string) => {
  switch (model) {
    case "openai":
      return "OpenAI Whisper";
    case "gemini-2.0-flash":
      return "Gemini 2.0 Flash";
    case "phi4":
      return "Microsoft Phi-4";
    default:
      return model;
  }
};

// Safely extract VTT content from a transcription job
export function extractVttContent(job: any): string {
  if (!job) return '';
  
  // Handle different result structures
  if (job.result) {
    // If result has vttContent property directly
    if (typeof job.result.vttContent === 'string') {
      return job.result.vttContent;
    }
    
    // If result is a string (sometimes it can be stringified JSON)
    if (typeof job.result === 'string') {
      try {
        const parsed = JSON.parse(job.result);
        if (parsed && typeof parsed.vttContent === 'string') {
          return parsed.vttContent;
        }
      } catch (e) {
        // If it's not valid JSON, just return the string itself if it looks like VTT
        if (job.result.includes('-->')) {
          return job.result;
        }
      }
    }
    
    // If there's a transcription property
    if (job.result.transcription) {
      return job.result.transcription;
    }
    
    // If result is an object with text property
    if (job.result.text) {
      return convertTextToVTT(job.result.text);
    }
  }
  
  // If we have a direct vtt_file_url property, it might mean the content was saved elsewhere
  // This is just a placeholder - the actual content would need to be fetched from that URL
  if (job.vtt_file_url) {
    return `WEBVTT\n\n00:00:00.000 --> 00:00:05.000\nTranscription available at URL: ${job.vtt_file_url}\n\n`;
  }
  
  // If session has a selected_transcription
  if (job.selected_transcription && typeof job.selected_transcription === 'string') {
    return job.selected_transcription;
  }
  
  // If we couldn't find any content, return an empty string
  return '';
}

// Convert plain text to VTT format
function convertTextToVTT(text: string): string {
  if (!text || typeof text !== 'string') return 'WEBVTT\n\n';
  
  let vttContent = 'WEBVTT\n\n';
  
  // Split text into sentences or chunks
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  
  sentences.forEach((sentence, index) => {
    const startTime = formatVTTTime(index * 5);
    const endTime = formatVTTTime((index + 1) * 5);
    vttContent += `${startTime} --> ${endTime}\n${sentence.trim()}\n\n`;
  });
  
  return vttContent;
}

// Format time for VTT (00:00:00.000)
function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}

// Convert VTT to SRT format
export const convertVttToSrt = (vtt: string): string => {
  if (!vtt) return "";
  
  let content = vtt.replace(/^WEBVTT\s*/, '');
  
  const cues = content.trim().split(/\n\s*\n/);
  
  return cues.map((cue, index) => {
    const lines = cue.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) return '';
    
    const timestampLine = lines.find(line => line.includes('-->'));
    if (!timestampLine) return '';
    
    const timestamps = timestampLine.split('-->').map(ts => ts.trim().replace('.', ','));
    
    const textIndex = lines.indexOf(timestampLine) + 1;
    const text = lines.slice(textIndex).join('\n');
    
    return `${index + 1}\n${timestamps[0]} --> ${timestamps[1]}\n${text}`;
  }).filter(cue => cue).join('\n\n');
};

// Convert VTT to plain text
export const convertVttToText = (vtt: string): string => {
  if (!vtt) return "";
  
  let content = vtt.replace(/^WEBVTT\s*/, '');
  
  const cues = content.trim().split(/\n\s*\n/);
  const textLines: string[] = [];
  
  cues.forEach(cue => {
    const lines = cue.split('\n').filter(line => line.trim());
    
    const textLinesFromCue = lines.filter(line => !line.includes('-->') && !/^\d+$/.test(line));
    
    if (textLinesFromCue.length) {
      textLines.push(...textLinesFromCue);
    }
  });
  
  return textLines.join('\n');
};
