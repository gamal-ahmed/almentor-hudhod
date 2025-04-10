
import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  Loader2 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteTranscriptionSession } from '@/lib/api';

interface SessionGroupItemProps {
  session: {
    id: string;
    created_at: string;
    audio_file_name?: string;
    selected_models?: string[];
    selected_model?: string;
    accepted_model_id?: string | null;
    transcriptions?: any[];
  };
  onViewDetails: () => void;
  onDelete: (sessionId: string) => void;
}

const SessionGroupItem: React.FC<SessionGroupItemProps> = ({
  session,
  onViewDetails,
  onDelete
}) => {
  const navigate = useNavigate();
  const timestamp = new Date(session.created_at);
  const modelCount = session.transcriptions ? Object.keys(session.transcriptions).length : 0;
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Get models from transcriptions if available
  const models = session.selected_models || [];
  
  // Check if any transcription is completed
  const hasCompleted = session.transcriptions ? 
    Object.values(session.transcriptions).some((t: any) => t.status === 'completed') : 
    false;
    
  const handleViewDetails = () => {
    // Navigate to session details page
    navigate(`/session/${session.id}`);
    
    // Also call the original onViewDetails handler if needed
    onViewDetails();
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteTranscriptionSession(session.id);
      
      if (result.success) {
        toast.success("Session deleted", {
          description: "The transcription session has been removed"
        });
        // Call parent's onDelete to update the UI
        onDelete(session.id);
      } else {
        toast.error("Failed to delete session", {
          description: result.message
        });
      }
    } catch (error) {
      toast.error("Error deleting session", {
        description: error instanceof Error ? error.message : "An unknown error occurred"
      });
    } finally {
      setIsDeleting(false);
    }
  };
    
  return (
    <div className="flex items-center justify-between p-4 bg-card border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {hasCompleted ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <Clock className="h-5 w-5 text-amber-500" />
          )}
        </div>
        <div>
          <div className="text-sm font-medium">
            {session.audio_file_name || 'Transcription Session'}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(timestamp, { addSuffix: true })}
          </div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mx-2">
        {modelCount > 0 ? (
          <Badge variant="secondary" className="text-xs">
            {modelCount} {modelCount === 1 ? 'model' : 'models'}
          </Badge>
        ) : (
          models.map((model, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {model}
            </Badge>
          ))
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleViewDetails}
          className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
        >
          <span className="mr-1">Details</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Transcription Session</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this transcription session? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default SessionGroupItem;
