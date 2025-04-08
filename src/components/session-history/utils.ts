
import { TranscriptionJob } from '@/lib/api/types/transcription';
import { format } from 'date-fns';

export interface SessionGroup {
  timestamp: Date;
  jobCount: number;
  models: string[];
  hasCompleted: boolean;
  sessionId?: string;
}

export const getModelDisplayName = (model: string): string => {
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

export const groupJobsBySession = (jobs: TranscriptionJob[]): SessionGroup[] => {
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
      // Find a session ID in this job
      const sessionId = job.session_id;
      
      currentGroup = {
        timestamp: jobTime,
        jobs: [job],
        models: new Set([job.model]),
        hasCompleted: job.status === 'completed',
        sessionId: sessionId
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
      
      // Prioritize finding a session ID if we don't have one yet
      if (!currentGroup.sessionId && job.session_id) {
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

// Add the missing groupSessionsByDate function
export const groupSessionsByDate = (sessions: any[]) => {
  const grouped: Record<string, any[]> = {};
  
  sessions.forEach(session => {
    const date = new Date(session.created_at);
    const dateKey = format(date, 'MMMM d, yyyy');
    
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    
    grouped[dateKey].push(session);
  });
  
  return grouped;
};
