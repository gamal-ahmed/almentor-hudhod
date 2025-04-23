
import { useState } from 'react';
import { ExportFormat } from "@/components/transcription/types";

export const useFormatConversion = () => {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('vtt');

  const convertVttToSrt = (vtt: string): string => {
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

  const convertVttToText = (vtt: string): string => {
    if (!vtt) return "";
    
    let content = vtt.replace(/^WEBVTT\s*/, '');
    
    const cues = content.trim().split(/\n\s*\n/);
    const textLines: string[] = [];
    
    cues.forEach(cue => {
      const lines = cue.split('\n').filter(line => line.trim());
      
      const textOnlyLines = lines.filter(line => !line.includes('-->') && !/^\d+$/.test(line));
      
      if (textOnlyLines.length) {
        textLines.push(...textOnlyLines);
      }
    });
    
    return textLines.join('\n');
  };
  
  return {
    exportFormat,
    setExportFormat,
    convertVttToSrt,
    convertVttToText
  };
};
