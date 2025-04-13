
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileAudio, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { showNotification } from "@/lib/notifications";

interface FileQueueProps {
  files: File[];
  currentIndex: number;
  onProcessNext: () => void;
  onSkip: () => void;
  onReset: () => void;
  isProcessing: boolean;
  notificationsEnabled: boolean;
}

const FileQueue = ({
  files,
  currentIndex,
  onProcessNext,
  onSkip,
  onReset,
  isProcessing,
  notificationsEnabled
}: FileQueueProps) => {
  const { toast } = useToast();
  
  const handleConfirm = () => {
    if (notificationsEnabled) {
      showNotification("File Confirmed", {
        body: `Confirmed: ${files[currentIndex - 1]?.name || "Unknown file"}. Moving to next file.`,
        tag: "file-queue"
      });
    }
    
    onProcessNext();
  };
  
  const handleSkip = () => {
    if (notificationsEnabled) {
      showNotification("File Skipped", {
        body: `Skipped: ${files[currentIndex]?.name || "Unknown file"}. Moving to next file.`,
        tag: "file-queue"
      });
    }
    
    onSkip();
  };
  
  if (!files.length) {
    return null;
  }
  
  return (
    <Card className="overflow-hidden border-t-4 border-t-purple-500 shadow-md hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold flex items-center">
          <FileAudio className="mr-2 h-5 w-5 text-purple-500" />
          MP3 Queue ({currentIndex}/{files.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-48 rounded-md border p-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className={`flex items-center justify-between p-2 mb-1 rounded-md ${
                index === currentIndex
                  ? "bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700"
                  : index < currentIndex
                  ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300"
                  : "bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400"
              }`}
            >
              <div className="flex items-center">
                <FileAudio
                  className={`h-4 w-4 mr-2 ${
                    index === currentIndex
                      ? "text-purple-500"
                      : index < currentIndex
                      ? "text-green-500"
                      : "text-gray-400"
                  }`}
                />
                <span className={index < currentIndex ? "line-through opacity-70" : ""}>
                  {file.name}
                </span>
              </div>
              {index < currentIndex && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {index === currentIndex && (
                <div className="flex items-center text-xs px-2 py-1 rounded-full bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-300">
                  Current
                </div>
              )}
            </div>
          ))}
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        {currentIndex > 0 && currentIndex < files.length ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSkip}
              disabled={isProcessing}
            >
              <XCircle className="mr-1 h-4 w-4" />
              Skip This File
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              className="bg-gradient-to-r from-green-500 to-emerald-600"
              disabled={isProcessing}
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              Confirm & Next
            </Button>
          </>
        ) : currentIndex === files.length ? (
          <Button
            size="sm"
            onClick={onReset}
            className="ml-auto"
          >
            Queue Complete - Reset
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={onProcessNext}
            disabled={isProcessing}
            className="ml-auto"
          >
            <ArrowRight className="mr-1 h-4 w-4" />
            Start Processing
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default FileQueue;
