
import { useState, useEffect } from 'react';
import { parseVTT } from '@/lib/vttParser';
import { useLogsStore } from '@/lib/useLogsStore';

export const useVttParser = (
  vttContent: string | undefined, 
  modelName: string | undefined
) => {
  const [parsed, setParsed] = useState<{
    segments: any[];
    wordCount: number;
  }>({ segments: [], wordCount: 0 });
  
  const addLog = useLogsStore(state => state.addLog);

  useEffect(() => {
    if (!vttContent || typeof vttContent !== 'string') {
      setParsed({ segments: [], wordCount: 0 });
      return;
    }

    try {
      const segments = parseVTT(vttContent);
      
      if (segments.length === 0 && vttContent.length > 0 && modelName && modelName.includes("Gemini")) {
        addLog(`Gemini VTT parsing issue: attempting fallback parsing`, "warning", {
          source: "TranscriptionCard",
          details: `VTT Content (first 200 chars): ${vttContent.substring(0, 200)}...`
        });
        
        const lines = vttContent.split('\n');
        let isInCue = false;
        let currentCue = { startTime: "00:00:00.000", endTime: "00:05:00.000", text: "" };
        let fallbackSegments = [];
        
        for (const line of lines) {
          if (line.includes('-->')) {
            isInCue = true;
            const timeParts = line.split('-->').map(t => t.trim());
            if (timeParts.length === 2) {
              currentCue.startTime = timeParts[0];
              currentCue.endTime = timeParts[1];
            }
          } else if (line.trim() === '' && isInCue) {
            if (currentCue.text) {
              fallbackSegments.push({ ...currentCue });
              currentCue = { startTime: "00:00:00.000", endTime: "00:05:00.000", text: "" };
            }
            isInCue = false;
          } else if (isInCue && line.trim() !== 'WEBVTT') {
            currentCue.text += (currentCue.text ? ' ' : '') + line;
          }
        }
        
        if (currentCue.text) {
          fallbackSegments.push(currentCue);
        }
        
        if (fallbackSegments.length > 0) {
          setParsed({
            segments: fallbackSegments,
            wordCount: vttContent.split(/\s+/).filter(word => word.trim().length > 0).length
          });
          return;
        }
        
        if (fallbackSegments.length === 0) {
          addLog(`Gemini fallback parsing failed: creating single segment with all content`, "warning", {
            source: "TranscriptionCard"
          });
          
          setParsed({
            segments: [{
              startTime: "00:00:00.000",
              endTime: "00:10:00.000",
              text: vttContent.replace('WEBVTT', '').trim()
            }],
            wordCount: vttContent.split(/\s+/).filter(word => word.trim().length > 0).length
          });
          return;
        }
      }
      
      if (modelName && modelName.includes("Gemini") && segments.length === 0 && vttContent.length > 0) {
        addLog(`Gemini VTT parsing issue: content exists but no segments parsed`, "warning", {
          source: "TranscriptionCard",
          details: `VTT Content (first 200 chars): ${vttContent.substring(0, 200)}...`
        });
      }
      
      setParsed({
        segments: segments,
        wordCount: vttContent.split(/\s+/).filter(word => word.trim().length > 0).length
      });
      
    } catch (error: any) {
      console.error(`Error in useVttParser:`, error);
      addLog(`Error parsing VTT: ${error.message}`, "error", {
        source: "useVttParser",
        details: error.stack
      });
      
      if (vttContent && vttContent.length > 0) {
        setParsed({
          segments: [{
            startTime: "00:00:00.000",
            endTime: "00:10:00.000",
            text: vttContent.replace('WEBVTT', '').trim()
          }],
          wordCount: vttContent.split(/\s+/).filter(word => word.trim().length > 0).length
        });
      } else {
        setParsed({ segments: [], wordCount: 0 });
      }
    }
  }, [vttContent, modelName, addLog]);

  return parsed;
};
