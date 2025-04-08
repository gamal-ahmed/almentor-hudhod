
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Clock, CheckCircle, AlertCircle, PlusCircle, ArrowRight } from "lucide-react";
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import SessionHistoryLoading from './SessionHistoryLoading';
import SessionHistoryEmpty from './SessionHistoryEmpty';
import SessionGroupItem from './SessionGroupItem';
import { groupSessionsByDate } from './utils';

const SessionHistory: React.FC = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current authenticated user
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setSessions([]);
          setLoading(false);
          return;
        }
        
        // Fetch sessions for current user
        const { data, error } = await supabase
          .from('transcription_sessions')
          .select(`
            id,
            created_at,
            audio_file_name,
            selected_models,
            selected_model,
            accepted_model_id,
            transcriptions (
              id,
              model,
              status,
              created_at,
              updated_at
            )
          `)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        
        // Transform data for display
        setSessions(data || []);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError(err instanceof Error ? err.message : String(err));
        toast.error('Failed to load session history');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSessions();
  }, []);
  
  const handleNewTranscription = () => {
    navigate('/app');
  };
  
  const handleViewSessionDetails = (sessionId: string) => {
    navigate(`/session/${sessionId}`);
  };
  
  if (loading) {
    return <SessionHistoryLoading />;
  }
  
  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>
            Your previous transcription sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Sessions</h3>
            <p className="text-muted-foreground text-center max-w-md mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!sessions || sessions.length === 0) {
    return <SessionHistoryEmpty onNewTranscription={handleNewTranscription} />;
  }
  
  const groupedSessions = groupSessionsByDate(sessions);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Session History</CardTitle>
        <CardDescription>
          Your previous transcription sessions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[450px] pr-4 -mr-4">
          <div className="space-y-6">
            {Object.entries(groupedSessions).map(([dateGroup, dateSessions]) => (
              <div key={dateGroup} className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background/95 backdrop-blur-sm py-1 z-10">
                  {dateGroup}
                </h3>
                <div className="space-y-3">
                  {dateSessions.map(session => (
                    <SessionGroupItem
                      key={session.id}
                      session={session}
                      onViewDetails={() => handleViewSessionDetails(session.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <Button onClick={handleNewTranscription} variant="outline" size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          New Transcription
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SessionHistory;
