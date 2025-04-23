
import { useToast } from "@/hooks/use-toast";
import { useLogsStore } from "@/lib/useLogsStore";
import { ExportFormat } from "@/components/transcription/types";
import { useFormatConversion } from "./useFormatConversion";

export const useTranscriptionExport = () => {
  const { toast } = useToast();
  const { addLog } = useLogsStore();
  const { exportFormat, setExportFormat, convertVttToSrt, convertVttToText } = useFormatConversion();

  const exportTranscription = (
    selectedTranscription: string | null,
    selectedModel: string | null
  ) => {
    if (!selectedTranscription || !selectedModel) {
      toast({
        title: "Export Failed",
        description: "No transcription selected to export",
        variant: "destructive",
      });
      return;
    }
    
    let fileName = `transcription_${selectedModel.replace(/[^\w]/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}`;
    let content = '';
    let mimeType = '';
    
    switch (exportFormat) {
      case 'vtt':
        content = selectedTranscription;
        fileName += '.vtt';
        mimeType = 'text/vtt';
        break;
      case 'srt':
        content = convertVttToSrt(selectedTranscription);
        fileName += '.srt';
        mimeType = 'text/plain';
        break;
      case 'text':
        content = convertVttToText(selectedTranscription);
        fileName += '.txt';
        mimeType = 'text/plain';
        break;
      case 'json':
        content = JSON.stringify({
          model: selectedModel,
          modelName: selectedModel === "openai" 
            ? "OpenAI Whisper" 
            : selectedModel === "gemini-2.0-flash" 
              ? "Gemini 2.0 Flash" 
              : "Microsoft Phi-4",
          created: new Date().toISOString(),
          transcription: convertVttToText(selectedTranscription),
          vtt: selectedTranscription
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
      source: "ResultsPublishStep",
      details: `Model: ${selectedModel}, File: ${fileName}`
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
};
