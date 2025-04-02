
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLogsStore } from "@/lib/useLogsStore";
import { TranscriptionJob } from "@/lib/api/types/transcription";
import { extractVttContent, getModelDisplayName, convertVttToSrt, convertVttToText } from "@/utils/transcriptionUtils";

export type ExportFormat = 'vtt' | 'srt' | 'text' | 'json';

export function useTranscriptionExport() {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('vtt');
  const { toast } = useToast();
  const { addLog } = useLogsStore();
  
  const exportTranscription = (job: TranscriptionJob) => {
    if (!job) return;
    
    const vttContent = extractVttContent(job);
    if (!vttContent) {
      toast({
        title: "Export Failed",
        description: "No transcription content to export",
        variant: "destructive",
      });
      return;
    }
    
    let fileName = `transcription_${getModelDisplayName(job.model).replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}`;
    let content = '';
    let mimeType = '';
    
    switch (exportFormat) {
      case 'vtt':
        content = vttContent;
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
          vtt: vttContent
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
      details: `Model: ${getModelDisplayName(job.model)}, File: ${fileName}`
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
