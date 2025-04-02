
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

// Extract VTT content from job result
export const extractVttContent = (job: TranscriptionJob) => {
  if (!job?.result) return "";
  
  try {
    if (typeof job.result === 'string') {
      try {
        const parsedResult = JSON.parse(job.result);
        // Ensure we're returning the full VTT content
        return parsedResult.vttContent || "";
      } catch {
        // If parsing fails, return empty string
        console.error("Failed to parse job result as JSON");
        return "";
      }
    } else if (typeof job.result === 'object') {
      if (Array.isArray(job.result)) {
        console.error("Job result is an array, expected object");
        return "";
      }
      
      const resultObj = job.result as { vttContent?: string };
      // Make sure we return the complete VTT content
      return resultObj.vttContent || "";
    }
  } catch (error) {
    console.error("Error extracting VTT content:", error);
    return "";
  }
  
  return "";
};

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
