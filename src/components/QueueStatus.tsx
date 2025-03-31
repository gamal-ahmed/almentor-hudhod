
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle, Loader2, RefreshCw, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { resetAllJobs } from '@/lib/api';

interface QueueStatusProps {
  onReset: () => void;
}

const QueueStatus: React.FC<QueueStatusProps> = ({ onReset }) => {
  const [isResetting, setIsResetting] = useState(false);
  const { toast } = useToast();

  const handleResetAllJobs = async () => {
    try {
      setIsResetting(true);
      
      await resetAllJobs();
      
      toast({
        title: "Queue Reset",
        description: "All transcription jobs have been deleted.",
      });
      
      // Call the parent component's onReset callback
      onReset();
    } catch (err) {
      console.error('Error resetting jobs:', err);
      toast({
        title: "Reset Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <Card className="overflow-hidden border-t-4 border-t-red-500 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-semibold flex items-center">
          <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
          System Maintenance
        </CardTitle>
        <CardDescription>
          Having trouble with transcriptions? Try resetting the job queue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            If transcriptions are stuck in "Waiting in queue" status, you can reset the queue to fix the issue.
          </AlertDescription>
        </Alert>
        
        <Button 
          variant="destructive" 
          onClick={handleResetAllJobs}
          disabled={isResetting}
          className="w-full"
        >
          {isResetting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting Queue...
            </>
          ) : (
            <>
              <Trash2 className="mr-2 h-4 w-4" />
              Reset Transcription Queue
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default QueueStatus;
