
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLogsStore } from "@/lib/useLogsStore";
import { TranscriptionJob } from "@/lib/api/types/transcription";
import { extractVttContent, getModelDisplayName, convertVttToSrt, convertVttToText } from "@/utils/transcriptionUtils";
import { parseVTT } from "@/lib/vttParser";

export type ExportFormat = 'vtt' | 'srt' | 'text' | 'json';

export function useTranscriptionExport() {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('vtt');
  const { toast } = useToast();
  const { addLog } = useLogsStore();
  
  const exportTranscription = (job: TranscriptionJob) => {
    if (!job) return;
    
    // Extract VTT content from the job
    const vttContent = extractVttContent(job);
    if (!vttContent) {
      toast({
        title: "Export Failed",
        description: "No transcription content to export",
        variant: "destructive",
      });
      return;
    }
    
    // Validate that we have segments
    const segments = parseVTT(vttContent);
    console.log(`Exporting transcription with ${segments.length} segments`);
    addLog(`Exporting transcription with ${segments.length} segments`, "info", {
      source: "useTranscriptionExport",
      model: job.model,
      segments: segments.length
    });
    
    if (segments.length === 0) {
      toast({
        title: "Export Warning",
        description: "The transcription contains no segments or is improperly formatted",
        variant: "destructive",
      });
      // Continue anyway as we'll try to handle it
    }
    
    let fileName = `transcription_${getModelDisplayName(job.model).replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}`;
    let content = '';
    let mimeType = '';
    
    switch (exportFormat) {
      case 'vtt':
        // Ensure proper VTT format with header
        content = vttContent.trim().startsWith("WEBVTT") ? vttContent : `WEBVTT\n\n${vttContent}`;
        fileName += '.vtt';
        mimeType = 'text/vtt';
        break;
      case 'srt':
        content = convertVttToSrt(vttContent);
        fileName += '.srt';
        mimeType = 'text/plain';
        break;
      case 'text':
        content = convertVttToText(vttContent);
        fileName += '.txt';
        mimeType = 'text/plain';
        break;
      case 'json':
        content = JSON.stringify({
          model: job.model,
          modelName: getModelDisplayName(job.model),
          created: job.created_at,
          transcription: convertVttToText(vttContent),
          vtt: vttContent,
          segments: segments.length > 0 ? segments : undefined
        }, null, 2);
        fileName += '.json';
        mimeType = 'application/json';
        break;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    addLog(`Exported transcription as ${exportFormat.toUpperCase()}`, "info", {
      source: "SessionDetails",
      details: `Model: ${getModelDisplayName(job.model)}, File: ${fileName}, Segments: ${segments.length}`
    });
    
    toast({
      title: "Export Successful",
      description: `Transcription exported as ${fileName}`,
    });
  };
  
  return {
    exportFormat,
    setExportFormat,
    exportTranscription
  };
}
