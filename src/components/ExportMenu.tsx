
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Download, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportTranscription, ExportFormat } from "@/lib/api/exportService";
import { useLogsStore } from "@/lib/useLogsStore";

interface ExportMenuProps {
  transcriptionContent: string;
  disabled?: boolean;
  fileName?: string;
}

const ExportMenu = ({ 
  transcriptionContent, 
  disabled = false,
  fileName = `transcription-${Date.now()}`
}: ExportMenuProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("vtt");
  const [customFileName, setCustomFileName] = useState(fileName);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const addLog = useLogsStore(state => state.addLog);
  
  const handleExport = async () => {
    if (!transcriptionContent) {
      toast({
        title: "No Content",
        description: "There is no transcription content to export.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsExporting(true);
      addLog(`Starting export in ${format} format`, "info", {
        source: "ExportMenu",
        details: `File name: ${customFileName}.${format}`
      });
      
      const result = await exportTranscription(transcriptionContent, format, customFileName);
      
      toast({
        title: "Export Successful",
        description: `Your transcription has been exported as ${result.file_name}.${result.format}`,
      });
      
      // Create a temporary download link
      const downloadLink = document.createElement('a');
      downloadLink.href = result.file_url;
      downloadLink.download = `${result.file_name}.${result.format}`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      setIsOpen(false);
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export transcription",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          disabled={disabled || !transcriptionContent}
          className="flex items-center gap-1"
        >
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="space-y-4">
          <h4 className="font-medium">Export Transcription</h4>
          
          <div className="space-y-2">
            <Label htmlFor="fileName">File Name</Label>
            <Input 
              id="fileName" 
              value={customFileName} 
              onChange={(e) => setCustomFileName(e.target.value)}
              placeholder="Enter file name"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Format</Label>
            <RadioGroup 
              value={format} 
              onValueChange={(value) => setFormat(value as ExportFormat)}
              className="grid grid-cols-2 gap-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="vtt" id="vtt" />
                <Label htmlFor="vtt" className="cursor-pointer">VTT</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="srt" id="srt" />
                <Label htmlFor="srt" className="cursor-pointer">SRT</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="txt" id="txt" />
                <Label htmlFor="txt" className="cursor-pointer">Plain Text</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="cursor-pointer">JSON</Label>
              </div>
            </RadioGroup>
          </div>
          
          <Button 
            onClick={handleExport}
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Export & Download
              </>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ExportMenu;
