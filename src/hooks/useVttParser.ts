
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
      // Ensure there's always a WEBVTT header
      let contentToProcess = vttContent;
      if (!contentToProcess.trim().startsWith('WEBVTT')) {
        contentToProcess = `WEBVTT\n\n${contentToProcess}`;
      }
      
      // Try to parse VTT into segments
      const segments = parseVTT(contentToProcess);
      
      // Calculate word count from the content
      const wordCount = contentToProcess
        .split(/\s+/)
        .filter(word => word.trim().length > 0 && !word.includes('-->'))
        .length;
      
      if (segments.length === 0 && contentToProcess.length > 0) {
        addLog(`VTT parsing issue for ${modelName || 'unknown model'}: Content exists but no segments parsed`, "warning", {
          source: "useVttParser",
          details: `VTT Content (first 200 chars): ${contentToProcess.substring(0, 200)}...`
        });
        
        // Fallback: Create manual segments by splitting on empty lines
        const fallbackSegments = createFallbackSegments(contentToProcess);
        
        if (fallbackSegments.length > 0) {
          setParsed({
            segments: fallbackSegments,
            wordCount
          });
          return;
        }
        
        // Ultimate fallback: Create a single segment with all content
        setParsed({
          segments: [{
            startTime: "00:00:00.000",
            endTime: "00:10:00.000",
            text: contentToProcess.replace('WEBVTT', '').trim()
          }],
          wordCount
        });
        return;
      }
      
      setParsed({
        segments,
        wordCount
      });
      
    } catch (error: any) {
      console.error(`Error in useVttParser:`, error);
      addLog(`Error parsing VTT: ${error.message}`, "error", {
        source: "useVttParser",
        details: error.stack
      });
      
      if (vttContent && vttContent.length > 0) {
        // Error fallback: create a single segment with all content
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

// Helper function to create segments from VTT content when regular parsing fails
function createFallbackSegments(vttContent: string) {
  const lines = vttContent.split('\n');
  let isInCue = false;
  let currentCue = { startTime: "00:00:00.000", endTime: "00:05:00.000", text: "" };
  let fallbackSegments = [];
  let timeIndex = 0;
  
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
        // Create next segment with estimated timing
        timeIndex += 5;
        currentCue = { 
          startTime: `00:00:${String(timeIndex).padStart(2, '0')}.000`, 
          endTime: `00:00:${String(timeIndex + 5).padStart(2, '0')}.000`,
          text: "" 
        };
      }
      isInCue = false;
    } else if (isInCue && line.trim() !== 'WEBVTT' && line.trim() !== '') {
      currentCue.text += (currentCue.text ? ' ' : '') + line.trim();
    } else if (!isInCue && line.trim() !== 'WEBVTT' && line.trim() !== '') {
      // If we encounter text outside of a cue, create a new segment
      currentCue.text += (currentCue.text ? ' ' : '') + line.trim();
      isInCue = true;
    }
  }
  
  // Add the last segment if it has content
  if (currentCue.text) {
    fallbackSegments.push(currentCue);
  }
  
  return fallbackSegments;
}
