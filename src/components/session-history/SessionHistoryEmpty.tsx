
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, History } from 'lucide-react';

const SessionHistoryEmpty: React.FC = () => {
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
      </CardContent>
    </Card>
  );
};

export default SessionHistoryEmpty;
