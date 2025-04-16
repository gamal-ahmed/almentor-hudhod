
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { getModelDisplayName } from './utils/modelUtils';
import { Loader2 } from "lucide-react";

interface TranscriptionCardHeaderProps {
  modelName: string;
  prompt?: string;
  isSelected?: boolean;
  wordCount?: number;
  segmentCount?: number;
  isLoading?: boolean;
  vttContent?: string;
}

const TranscriptionCardHeader: React.FC<TranscriptionCardHeaderProps> = ({
  modelName,
  prompt,
  isSelected,
  wordCount,
  segmentCount,
  isLoading,
  vttContent
}) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{getModelDisplayName(modelName)}</h3>
          {prompt && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              Prompt: {prompt}
            </p>
          )}
        </div>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
      
      {!isLoading && vttContent && (
        <div className="flex gap-2">
          {wordCount !== undefined && (
            <Badge variant="outline" className="text-xs">
              {wordCount} words
            </Badge>
          )}
          {segmentCount !== undefined && (
            <Badge variant="outline" className="text-xs">
              {segmentCount} segments
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default TranscriptionCardHeader;
