
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History } from 'lucide-react';
import { getUserTranscriptionJobs } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { TranscriptionJob } from '@/lib/api/types/transcription';
import { SessionGroup, groupJobsBySession } from './utils';
import SessionHistoryLoading from './SessionHistoryLoading';
import SessionHistoryEmpty from './SessionHistoryEmpty';
import SessionGroupItem from './SessionGroupItem';

const SessionHistory: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [sessionGroups, setSessionGroups] = useState<SessionGroup[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const jobs = await getUserTranscriptionJobs();
        console.log("Fetched jobs:", jobs);
        const groups = groupJobsBySession(jobs as TranscriptionJob[]);
        console.log("Grouped sessions:", groups);
        setSessionGroups(groups);
      } catch (error) {
        console.error('Error fetching session history:', error);
        toast({
          title: "Failed to load session history",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [toast]);

  if (loading) {
    return <SessionHistoryLoading />;
  }

  if (sessionGroups.length === 0) {
    return <SessionHistoryEmpty />;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Recent Sessions
        </CardTitle>
        <CardDescription>Your recent transcription sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {sessionGroups.map((session, index) => (
            <SessionGroupItem
              key={index}
              timestamp={session.timestamp}
              jobCount={session.jobCount}
              models={session.models}
              hasCompleted={session.hasCompleted}
              sessionId={session.sessionId}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionHistory;
