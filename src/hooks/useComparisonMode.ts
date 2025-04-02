
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { TranscriptionJob } from "@/lib/api/types/transcription";

export function useComparisonMode(setSelectedJob: (job: TranscriptionJob) => void) {
  const [comparisonMode, setComparisonMode] = useState(false);
  const [jobsToCompare, setJobsToCompare] = useState<TranscriptionJob[]>([]);
  const [viewMode, setViewMode] = useState<'single' | 'compare'>('single');
  
  const { toast } = useToast();
  
  const toggleComparisonMode = () => {
    if (comparisonMode) {
      setComparisonMode(false);
      setJobsToCompare([]);
      setViewMode('single');
    } else {
      setComparisonMode(true);
      setJobsToCompare([]);
      toast({
        title: "Comparison Mode Activated",
        description: "Select multiple transcriptions to compare side by side.",
      });
    }
  };
  
  const toggleJobForComparison = (job: TranscriptionJob) => {
    setJobsToCompare(prev => {
      const isAlreadySelected = prev.some(j => j.id === job.id);
      
      if (isAlreadySelected) {
        return prev.filter(j => j.id !== job.id);
      } else {
        return [...prev, job];
      }
    });
  };
  
  const startComparison = () => {
    if (jobsToCompare.length < 2) {
      toast({
        title: "Select More Transcriptions",
        description: "Please select at least 2 transcriptions to compare.",
        variant: "destructive",
      });
      return;
    }
    
    setViewMode('compare');
  };
  
  const isJobSelectedForComparison = (jobId: string) => {
    return jobsToCompare.some(job => job.id === jobId);
  };
  
  const handleSelectJob = (job: TranscriptionJob) => {
    if (job.status === 'completed') {
      if (comparisonMode) {
        toggleJobForComparison(job);
      } else {
        setSelectedJob(job);
        setViewMode('single');
      }
    }
  };
  
  return {
    comparisonMode,
    jobsToCompare,
    viewMode,
    setViewMode,
    toggleComparisonMode,
    toggleJobForComparison,
    startComparison,
    isJobSelectedForComparison,
    handleSelectJob
  };
}
