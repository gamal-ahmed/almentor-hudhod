
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
    <div className="mt-4 border-t pt-4">
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Export Options</h3>
        
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Select 
              value={exportFormat}
              onValueChange={(value) => onExportFormatChange(value as ExportFormat)}
              disabled={!selectedJob || selectedJob.status !== 'completed'}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vtt">VTT Subtitles</SelectItem>
                <SelectItem value="srt">SRT Subtitles</SelectItem>
                <SelectItem value="text">Plain Text</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={onExport}
              disabled={!selectedJob || selectedJob.status !== 'completed'}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            
            <Button
              variant="default"
              className="w-full"
              onClick={onSave}
              disabled={!selectedJob || selectedJob.status !== 'completed'}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportControls;
