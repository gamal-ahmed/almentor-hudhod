
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
    
  );
};

export default ExportControls;
