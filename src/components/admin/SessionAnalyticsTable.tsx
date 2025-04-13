
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface SessionData {
  id: string;
  created_at: string;
  audio_file_name: string | null;
  selected_model: string | null;
  accepted_model_id: string | null;
  model_name?: string;
}

export default function SessionAnalyticsTable() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchSessionData() {
      setLoading(true);
      
      // Get the most recent 50 sessions
      const { data, error } = await supabase
        .from("transcription_sessions")
        .select("id, created_at, audio_file_name, selected_model, accepted_model_id")
        .order("created_at", { ascending: false })
        .limit(50);
      
      if (error) {
        console.error("Error fetching sessions:", error);
        setLoading(false);
        return;
      }
      
      // For each session with an accepted model, get the model name
      if (data) {
        const enhancedData = await Promise.all(
          data.map(async (session) => {
            if (session.accepted_model_id) {
              // Get the transcription with this ID to determine the model
              const { data: transcriptionData, error: transcriptionError } = await supabase
                .from("transcriptions")
                .select("model")
                .eq("id", session.accepted_model_id)
                .single();
              
              if (!transcriptionError && transcriptionData) {
                return {
                  ...session,
                  model_name: transcriptionData.model
                };
              }
            }
            return session;
          })
        );
        
        setSessions(enhancedData);
      }
      
      setLoading(false);
    }
    
    fetchSessionData();
  }, []);

  const viewSession = (sessionId: string) => {
    navigate(`/session/${sessionId}`);
  };

  if (loading) {
    return <div className="flex justify-center p-4">Loading sessions...</div>;
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Session Created</TableHead>
            <TableHead>File Name</TableHead>
            <TableHead>Selected Model</TableHead>
            <TableHead>Accepted Model</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}</span>
                </div>
              </TableCell>
              <TableCell>{session.audio_file_name || "Unnamed"}</TableCell>
              <TableCell>{session.selected_model || "—"}</TableCell>
              <TableCell>
                {session.accepted_model_id ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <Badge variant="secondary">{session.model_name || "Selected"}</Badge>
                  </div>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => viewSession(session.id)}
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-4 w-4" />
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
