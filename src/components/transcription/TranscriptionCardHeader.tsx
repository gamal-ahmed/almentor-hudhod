
import React from "react";
import { CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getModelColor } from "./utils/modelUtils";

interface TranscriptionCardHeaderProps {
  modelName: string;
  prompt: string;
  isSelected: boolean;
  wordCount: number;
  segmentCount: number;
  isLoading: boolean;
  vttContent: string;
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
    <div className={`pb-2 ${getModelColor(modelName)}`}>
      <div className="flex justify-between items-center">
        <CardTitle className="text-lg flex items-center">
          {modelName}
          {prompt && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="font-medium mb-1">Prompt Used:</div>
                  <div className="text-xs">{prompt}</div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
        <Badge variant={isSelected ? "default" : "outline"}>
          {isSelected ? "Selected" : "Not Selected"}
        </Badge>
      </div>
      {!isLoading && vttContent && (
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{wordCount} words</span>
          <span>{segmentCount} segments</span>
        </div>
      )}
    </div>
  );
};

export default TranscriptionCardHeader;
