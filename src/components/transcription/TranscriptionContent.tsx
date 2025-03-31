
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { getModelDisplayName } from '@/lib/transcription-utils';

interface TranscriptionContentProps {
  jobId: string;
  status: string;
  result: any;
  error?: string;
  selectedVtt: string | null;
}

const TranscriptionContent: React.FC<TranscriptionContentProps> = ({ 
  jobId, 
  status, 
  result, 
  error,
  selectedVtt
}) => {
  const navigate = useNavigate();
  
  return (
    <div className="md:col-span-2">
      <Card>
        <CardHeader>
          <CardTitle>
            {result?.model ? getModelDisplayName(result.model) : 'Transcription'} Result
          </CardTitle>
        </CardHeader>
        <CardContent>
          {status === 'completed' && result ? (
            <div className="whitespace-pre-wrap p-4 bg-muted rounded-md max-h-[600px] overflow-y-auto text-sm">
              {selectedVtt || (result as any).vttContent || "No transcription content available"}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              {status === 'pending' || status === 'processing' ? (
                <>
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
                  <h3 className="font-medium text-lg">Transcription in progress</h3>
                  <p className="text-muted-foreground mt-1">
                    This page will automatically update when ready.
                  </p>
                </>
              ) : (
                <>
                  <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
                  <h3 className="font-medium text-lg">Transcription failed</h3>
                  <p className="text-muted-foreground mt-1">
                    {error || "An unknown error occurred"}
                  </p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="mt-6">
        {status === 'completed' && result && (
          <Button 
            onClick={() => navigate(`/app/workspace/${jobId}`)}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Open in Workspace
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default TranscriptionContent;
