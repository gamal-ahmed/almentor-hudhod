import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserTranscriptionJobs } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  History, 
  FileText, 
  ExternalLink, 
  Loader2 
} from 'lucide-react';

interface TranscriptionJob {
  id: string;
  status: string;
  model: string;
  created_at: string;
  updated_at: string;
  session_id?: string;
}

interface SessionGroup {
  timestamp: Date;
  jobCount: number;
  models: string[];
  hasCompleted: boolean;
  sessionId?: string;
}

const SessionHistory = () => {
  const [loading, setLoading] = useState(true);
  const [sessionGroups, setSessionGroups] = useState<SessionGroup[]>([]);
  const { toast } = useToast();

  const getModelDisplayName = (model: string) => {
    switch (model) {
      case "openai":
        return "OpenAI Whisper";
      case "gemini-2.0-flash":
        return "Gemini 2.0";
      case "phi4":
        return "Phi-4";
      default:
        return model;
    }
  };

  const groupJobsBySession = (jobs: TranscriptionJob[]) => {
    if (!jobs.length) return [];
    
    const sortedJobs = [...jobs].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    const groups: SessionGroup[] = [];
    let currentGroup: { 
      timestamp: Date; 
      jobs: TranscriptionJob[]; 
      models: Set<string>;
      hasCompleted: boolean;
      sessionId?: string;
    } | null = null;
    
    sortedJobs.forEach(job => {
      const jobTime = new Date(job.created_at);
      
      if (!currentGroup || 
          Math.abs(jobTime.getTime() - currentGroup.timestamp.getTime()) > 30000) {
        currentGroup = {
          timestamp: jobTime,
          jobs: [job],
          models: new Set([job.model]),
          hasCompleted: job.status === 'completed',
          sessionId: job.session_id
        };
        groups.push({
          timestamp: currentGroup.timestamp,
          jobCount: 1,
          models: Array.from(currentGroup.models).map(getModelDisplayName),
          hasCompleted: currentGroup.hasCompleted,
          sessionId: currentGroup.sessionId
        });
      } else {
        currentGroup.jobs.push(job);
        currentGroup.models.add(job.model);
        if (job.status === 'completed') {
          currentGroup.hasCompleted = true;
        }
        
        if (job.session_id && !currentGroup.sessionId) {
          currentGroup.sessionId = job.session_id;
        }
        
        const lastGroup = groups[groups.length - 1];
        lastGroup.jobCount = currentGroup.jobs.length;
        lastGroup.models = Array.from(currentGroup.models).map(getModelDisplayName);
        lastGroup.hasCompleted = currentGroup.hasCompleted;
        lastGroup.sessionId = currentGroup.sessionId;
      }
    });
    
    return groups.slice(0, 5);
  };

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        const jobs = await getUserTranscriptionJobs();
        const groups = groupJobsBySession(jobs as TranscriptionJob[]);
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
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Recent Sessions
          </CardTitle>
          <CardDescription>Your recent transcription sessions</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (sessionGroups.length === 0) {
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session Time</TableHead>
              <TableHead>Models</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessionGroups.map((session, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDistanceToNow(session.timestamp, { addSuffix: true })}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {session.jobCount} {session.jobCount === 1 ? 'model' : 'models'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {session.models.map((model, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 bg-secondary rounded-full">
                        {model}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    asChild
                    className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
                  >
                    <Link to={session.sessionId ? `/session/${session.sessionId}` : '#'}>
                      <span>Details</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SessionHistory;
