
import React from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, CheckCircle } from "lucide-react";

export type ExportFormat = 'vtt' | 'srt' | 'text' | 'json';

interface ExportControlsProps {
  selectedJob: any | null;
  exportFormat: ExportFormat;
  onExportFormatChange: (format: ExportFormat) => void;
  onExport: () => void;
  onSave: () => void;
}

const ExportControls: React.FC<ExportControlsProps> = ({
  selectedJob,
  exportFormat,
  onExportFormatChange,
  onExport,
  onSave,
}) => {
  return (
    <div className="w-full flex justify-end gap-2 mt-3">
      <Select
        value={exportFormat}
        onValueChange={(value) => onExportFormatChange(value as ExportFormat)}
      >
        <SelectTrigger className="w-[110px] text-xs h-9">
          <SelectValue placeholder="Format" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="vtt">VTT</SelectItem>
          <SelectItem value="srt">SRT</SelectItem>
          <SelectItem value="text">Text</SelectItem>
          <SelectItem value="json">JSON</SelectItem>
        </SelectContent>
      </Select>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1.5"
        disabled={!selectedJob || selectedJob.status !== 'completed'}
        onClick={onExport}
      >
        <Download className="h-4 w-4" />
        Export
      </Button>
      
      <Button 
        size="sm" 
        className="flex items-center gap-1.5"
        disabled={!selectedJob || selectedJob.status !== 'completed'}
        onClick={onSave}
      >
        <CheckCircle className="h-4 w-4" />
        Save
      </Button>
    </div>
  );
};

export default ExportControls;
