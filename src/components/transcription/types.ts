
export interface TranscriptionCardProps {
  modelName?: string;
  vttContent?: string;
  prompt?: string;
  onSelect?: () => void;
  isSelected?: boolean;
  audioSrc?: string | null;
  isLoading?: boolean;
  className?: string;
  showPagination?: boolean;
  showExportOptions?: boolean;
  showAudioControls?: boolean;
  onExport?: (format?: ExportFormat) => void;
  onAccept?: () => void;
}

export type ExportFormat = 'vtt' | 'srt' | 'text' | 'json';

export interface VTTSegment {
  startTime: string;
  endTime: string;
  text: string;
}

export interface JobUpdateStatus {
  id: string;
  status: string;
  previousStatus: string;
  model: string;
}
