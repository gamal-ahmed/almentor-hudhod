
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  checkTranscriptionJobStatus, 
  getUserTranscriptionJobs,
  saveSelectedTranscription
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { VttParser } from '@/lib/vttParser';
import { useAuth } from '@/lib/AuthContext';
import { TranscriptionJob } from '@/lib/types';

const SessionDetails: React.FC = () => {
  const { sessionTimestamp } = useParams<{ sessionTimestamp: string }>();
  const { user } = useAuth();
  const [selectedTranscription, setSelectedTranscription] = useState<TranscriptionJob | null>(null);

  const { data: transcriptions, isLoading, error, refetch } = useQuery({
    queryKey: ['userTranscriptions', user?.id],
    queryFn: () => getUserTranscriptionJobs(),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (sessionTimestamp && transcriptions) {
      const initialTranscription = transcriptions.find(transcription => {
        const transcriptionCreatedAt = new Date(transcription.created_at).getTime();
        const sessionTimestampNumber = parseInt(sessionTimestamp, 10);
        return transcriptionCreatedAt === sessionTimestampNumber;
      });

      if (initialTranscription) {
        // Type assertion to ensure it's treated as a TranscriptionJob
        setSelectedTranscription(initialTranscription as TranscriptionJob);
      } else {
        setSelectedTranscription(null);
      }
    }
  }, [sessionTimestamp, transcriptions]);

  const handleSaveTranscription = async () => {
    if (!selectedTranscription) {
      toast({
        title: "No transcription selected",
        description: "Please select a transcription to save.",
      });
      return;
    }

    try {
      await saveSelectedTranscription(selectedTranscription.id, selectedTranscription.result?.vttContent || '');
      toast({
        title: "Transcription saved",
        description: "The transcription has been successfully saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error saving transcription",
        description: error.message || "Failed to save the transcription.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Session Details</h1>
      {isLoading && <p>Loading transcriptions...</p>}
      {error && <p className="text-red-500">Error: {(error as Error).message}</p>}
      {transcriptions && transcriptions.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold mb-2">Available Transcriptions:</h2>
          <ul>
            {transcriptions.map((transcription) => (
              <li key={transcription.id} className="mb-2">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio h-5 w-5 text-blue-600"
                    name="transcription"
                    value={transcription.id}
                    checked={selectedTranscription?.id === transcription.id}
                    onChange={() => setSelectedTranscription(transcription as TranscriptionJob)}
                  />
                  <span className="ml-2">{new Date(transcription.created_at).toLocaleString()} - {transcription.status}</span>
                </label>
              </li>
            ))}
          </ul>
          <Button onClick={handleSaveTranscription} disabled={!selectedTranscription}>
            Save Selected Transcription
          </Button>
        </div>
      ) : (
        <p>No transcriptions found for this session.</p>
      )}
    </div>
  );
};

export default SessionDetails;
