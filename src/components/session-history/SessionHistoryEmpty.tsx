
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, History, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SessionHistoryEmptyProps {
  onNewTranscription: () => void;
}

const SessionHistoryEmpty: React.FC<SessionHistoryEmptyProps> = ({ onNewTranscription }) => {
  const navigate = useNavigate();
  
  const handleNewTranscription = () => {
    // Navigate to the transcribe tab or trigger the new transcription function
    onNewTranscription();
    
    // If we're on a different page, navigate to the main app page with the transcribe tab active
    if (window.location.pathname !== '/app') {
      navigate('/app');
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Recent Sessions
        </CardTitle>
        <CardDescription>Your recent transcription sessions</CardDescription>
      </CardHeader>
      <CardContent className="text-center py-8">
        <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">No sessions yet</h3>
        <p className="text-muted-foreground mb-4">
          Start by uploading an audio file to create your first transcription session.
        </p>
        <Button onClick={handleNewTranscription} variant="outline" size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          New Transcription
        </Button>
      </CardContent>
    </Card>
  );
};

export default SessionHistoryEmpty;
