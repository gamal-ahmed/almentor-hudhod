
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useLogsStore } from "@/lib/useLogsStore";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { FileText, Info } from "lucide-react";
import { 
  getBrightcoveAuthToken, 
  addCaptionToBrightcove, 
  fetchBrightcoveKeys 
} from "@/lib/api";

// Import our new components
import SessionHeader from "@/components/session/SessionHeader";
import TranscriptionJobList from "@/components/session/TranscriptionJobList";
import ComparisonModeHeader from "@/components/session/ComparisonModeHeader";
import ExportControls, { ExportFormat } from "@/components/session/ExportControls";
import ComparisonView from "@/components/session/ComparisonView";
import SingleJobView from "@/components/session/SingleJobView";
import PublishDialog from "@/components/session/PublishDialog";
import { LoadingState, ErrorState, EmptyState, NoJobSelectedState } from "@/components/session/SessionStatusStates";

interface TranscriptionJobFromAPI {
  id: string;
  status: string;
  model: string;
  created_at: string;
  updated_at: string;
  status_message: string;
  error?: string;
  session_id?: string;
  result?: { 
    vttContent: string; 
    text: string; 
    prompt: string;
  } | any;
}

interface TranscriptionJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  model: string;
  created_at: string;
  updated_at: string;
  status_message: string;
  error?: string;
  session_id?: string;
  result?: { 
    vttContent: string; 
    text: string; 
    prompt: string;
  } | any;
}

const convertToTranscriptionJob = (job: TranscriptionJobFromAPI): TranscriptionJob => {
  return {
    ...job,
    status: (job.status === 'pending' || job.status === 'processing' || 
             job.status === 'completed' || job.status === 'failed') 
             ? job.status as 'pending' | 'processing' | 'completed' | 'failed'
             : 'pending'
  };
};

const SessionDetails = () => {
  const { sessionId } = useParams<{ sessionId?: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessionJobs, setSessionJobs] = useState<TranscriptionJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<TranscriptionJob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { addLog } = useLogsStore();
  
  const [comparisonMode, setComparisonMode] = useState(false);
  const [jobsToCompare, setJobsToCompare] = useState<TranscriptionJob[]>([]);
  const [viewMode, setViewMode] = useState<'single' | 'compare'>('single');
  
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [videoId, setVideoId] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('vtt');
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchSessionJobs = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        
        const identifier = sessionId;
        
        if (!identifier || identifier === 'null' || identifier === 'undefined') {
          toast({
            title: "Missing session identifier",
            description: "Could not load session details: No valid session ID provided",
            variant: "destructive",
          });
          setFetchError("No valid session identifier provided");
          setLoading(false);
          
          setTimeout(() => {
            navigate('/app');
          }, 3000);
          
          return;
        }
        
        console.log(`Using session identifier: ${identifier}`);
        
        let matchingJobs: TranscriptionJob[] = [];
        
        try {
          const { data: directJobs, error: directError } = await supabase
            .from('transcriptions')
            .select('*')
            .eq('session_id', identifier)
            .order('created_at', { ascending: false });
            
          if (!directError && directJobs && directJobs.length > 0) {
            matchingJobs = directJobs.map(convertToTranscriptionJob);
            console.log(`Found ${matchingJobs.length} jobs with direct query`);
          }
        } catch (error) {
          console.error(`Error fetching jobs for session ${identifier}:`, error);
          setFetchError(`Error fetching session jobs: ${error instanceof Error ? error.message : String(error)}`);
        }
        
        console.log("Final jobs to display:", matchingJobs.length);
        
        setSessionJobs(matchingJobs);
        
        const completedJobs = matchingJobs.filter(job => job.status === 'completed');
        if (completedJobs.length > 0) {
          setSelectedJob(completedJobs[0]);
        } else if (matchingJobs.length > 0) {
          setSelectedJob(matchingJobs[0]);
        }
        
        if (identifier) {
          try {
            const { data: sessionData, error: sessionError } = await supabase
              .from('transcription_sessions')
              .select('audio_file_name')
              .eq('id', identifier)
              .single();
              
            if (!sessionError && sessionData?.audio_file_name) {
              const { data, error } = await supabase.storage
                .from('transcriptions')
                .createSignedUrl(`sessions/${identifier}/${sessionData.audio_file_name}`, 3600);
                
              if (!error && data) {
                setAudioUrl(data.signedUrl);
              }
            }
          } catch (error) {
            console.error("Error fetching audio URL:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching session jobs:", error);
        setFetchError(`Failed to load session data: ${error instanceof Error ? error.message : String(error)}`);
        toast({
          title: "Error loading session",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSessionJobs();
  }, [sessionId, toast, navigate]);
  
  const getModelDisplayName = (model: string) => {
    switch (model) {
      case "openai":
        return "OpenAI Whisper";
      case "gemini-2.0-flash":
        return "Gemini 2.0 Flash";
      case "phi4":
        return "Microsoft Phi-4";
      default:
        return model;
    }
  };
  
  const extractVttContent = (job: TranscriptionJob) => {
    if (!job.result) return "";
    
    try {
      if (typeof job.result === 'string') {
        try {
          const parsedResult = JSON.parse(job.result);
          return parsedResult.vttContent || "";
        } catch {
          return "";
        }
      } else if (typeof job.result === 'object') {
        return job.result.vttContent || "";
      }
    } catch (error) {
      console.error("Error extracting VTT content:", error);
      return "";
    }
    
    return "";
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

  const convertVttToSrt = (vtt: string): string => {
    if (!vtt) return "";
    
    let content = vtt.replace(/^WEBVTT\s*/, '');
    
    const cues = content.trim().split(/\n\s*\n/);
    
    return cues.map((cue, index) => {
      const lines = cue.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) return '';
      
      const timestampLine = lines.find(line => line.includes('-->'));
      if (!timestampLine) return '';
      
      const timestamps = timestampLine.split('-->').map(ts => ts.trim().replace('.', ','));
      
      const textIndex = lines.indexOf(timestampLine) + 1;
      const text = lines.slice(textIndex).join('\n');
      
      return `${index + 1}\n${timestamps[0]} --> ${timestamps[1]}\n${text}`;
    }).filter(cue => cue).join('\n\n');
  };

  const convertVttToText = (vtt: string): string => {
    if (!vtt) return "";
    
    let content = vtt.replace(/^WEBVTT\s*/, '');
    
    const cues = content.trim().split(/\n\s*\n/);
    const textLines: string[] = [];
    
    cues.forEach(cue => {
      const lines = cue.split('\n').filter(line => line.trim());
      
      const textLines = lines.filter(line => !line.includes('-->') && !/^\d+$/.test(line));
      
      if (textLines.length) {
        textLines.push(...textLines);
      }
    });
    
    return textLines.join('\n');
  };

  const exportTranscription = (job: TranscriptionJob) => {
    if (!job) return;
    
    const vttContent = extractVttContent(job);
    if (!vttContent) {
      toast({
        title: "Export Failed",
        description: "No transcription content to export",
        variant: "destructive",
      });
      return;
    }
    
    let fileName = `transcription_${getModelDisplayName(job.model).replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().slice(0, 10)}`;
    let content = '';
    let mimeType = '';
    
    switch (exportFormat) {
      case 'vtt':
        content = vttContent;
        fileName += '.vtt';
        mimeType = 'text/vtt';
        break;
      case 'srt':
        content = convertVttToSrt(vttContent);
        fileName += '.srt';
        mimeType = 'text/plain';
        break;
      case 'text':
        content = convertVttToText(vttContent);
        fileName += '.txt';
        mimeType = 'text/plain';
        break;
      case 'json':
        content = JSON.stringify({
          model: job.model,
          modelName: getModelDisplayName(job.model),
          created: job.created_at,
          transcription: convertVttToText(vttContent),
          vtt: vttContent
        }, null, 2);
        fileName += '.json';
        mimeType = 'application/json';
        break;
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    addLog(`Exported transcription as ${exportFormat.toUpperCase()}`, "info", {
      source: "SessionDetails",
      details: `Model: ${getModelDisplayName(job.model)}, File: ${fileName}`
    });
    
    toast({
      title: "Export Successful",
      description: `Transcription exported as ${fileName}`,
    });
  };

  const publishToBrightcove = async () => {
    if (!selectedJob || !videoId) {
      toast({
        title: "Missing Information",
        description: "Please select a transcription and enter a video ID.",
        variant: "destructive",
      });
      return;
    }
    
    const vttContent = extractVttContent(selectedJob);
    if (!vttContent) {
      toast({
        title: "Publishing Failed",
        description: "No transcription content to publish",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsPublishing(true);
      
      const brightcoveKeys = await fetchBrightcoveKeys();
      
      const authToken = await getBrightcoveAuthToken(
        brightcoveKeys.brightcove_client_id,
        brightcoveKeys.brightcove_client_secret
      );
      
      await addCaptionToBrightcove(
        videoId,
        vttContent,
        'ar',
        'Arabic',
        brightcoveKeys.brightcove_account_id,
        authToken
      );
      
      addLog(`Published caption to Brightcove video ID: ${videoId}`, "info", {
        source: "SessionDetails",
        details: `Model: ${getModelDisplayName(selectedJob.model)}`
      });
      
      toast({
        title: "Publishing Successful",
        description: "Caption has been published to Brightcove",
      });
      
      setPublishDialogOpen(false);
    } catch (error) {
      console.error("Error publishing to Brightcove:", error);
      
      toast({
        title: "Publishing Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const saveSelectedTranscriptionToStorage = async (vttContent: string) => {
    try {
      if (!selectedJob) {
        toast({
          title: "No transcription selected",
          description: "Please select a transcription to save",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Saving transcription",
        description: "Please wait while we save your transcription...",
      });
      
      const fileName = `transcription_${selectedJob.model}_${new Date().toISOString().slice(0, 10)}_${uuidv4()}.vtt`;
      
      const blob = new Blob([vttContent], { type: 'text/vtt' });
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('transcription_files')
        .upload(fileName, blob, {
          contentType: 'text/vtt',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('transcription_files')
        .getPublicUrl(fileName);

      if (!publicUrlData) throw new Error("Failed to get public URL");

      const sessionIdentifier = sessionId;
      
      if (!sessionIdentifier) {
        throw new Error("No session identifier available");
      }

      const { error: sessionUpdateError } = await supabase
        .from('transcription_sessions')
        .update({ 
          selected_transcription_url: publicUrlData.publicUrl,
          selected_transcription: vttContent,
          selected_model: selectedJob.model
        } as any)
        .eq('id', sessionIdentifier);

      if (sessionUpdateError) throw sessionUpdateError;

      addLog(`Saved transcription to storage: ${fileName}`, "success", {
        source: "SessionDetails",
        details: `Model: ${getModelDisplayName(selectedJob.model)}, URL: ${publicUrlData.publicUrl}`
      });

      toast({
        title: "Transcription Saved",
        description: "The selected transcription has been saved to storage.",
        variant: "default"
      });

    } catch (error) {
      console.error("Error saving transcription:", error);
      
      addLog(`Error saving transcription: ${error.message}`, "error", {
        source: "SessionDetails",
        details: error.stack
      });
      
      toast({
        title: "Save Failed",
        description: "Could not save the transcription: " + (error instanceof Error ? error.message : "Unknown error"),
        variant: "destructive"
      });
    }
  };

  const handleSaveSelectedTranscription = () => {
    if (selectedJob) {
      const vttContent = extractVttContent(selectedJob);
      saveSelectedTranscriptionToStorage(vttContent);
    } else {
      toast({
        title: "No transcription selected",
        description: "Please select a transcription to save",
        variant: "destructive"
      });
    }
  };
  
  const handleRefreshJobs = async () => {
    setLoading(true);
    try {
      const identifier = sessionId;
      if (!identifier) return;
      
      const { data: refreshedJobs, error } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('session_id', identifier)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (refreshedJobs.length > 0) {
        setSessionJobs(refreshedJobs.map(convertToTranscriptionJob));
        toast({
          title: "Jobs Refreshed",
          description: `Found ${refreshedJobs.length} jobs for this session`,
        });
      } else {
        toast({
          title: "No New Jobs Found",
          description: "Couldn't find any additional jobs for this session",
        });
      }
    } catch (error) {
      console.error("Error refreshing jobs:", error);
      toast({
        title: "Refresh Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="container py-6">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <div className="flex flex-col gap-4 mb-6">
            <SessionHeader 
              sessionId={sessionId}
              loading={loading}
              comparisonMode={comparisonMode}
              publishDialogOpen={publishDialogOpen}
              setPublishDialogOpen={setPublishDialogOpen}
              selectedJob={selectedJob}
              handleRefreshJobs={handleRefreshJobs}
              toggleComparisonMode={toggleComparisonMode}
            />
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Transcription Session Details</h1>
              {sessionId && sessionId !== 'null' && sessionId !== 'undefined' && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Info className="h-4 w-4" />
                  <p className="font-mono text-sm">Session ID: {sessionId}</p>
                </div>
              )}
            </div>
            
            {loading ? (
              <LoadingState />
            ) : fetchError ? (
              <ErrorState error={fetchError} onRetry={handleRefreshJobs} />
            ) : sessionJobs.length === 0 ? (
              <EmptyState onRefresh={handleRefreshJobs} />
            ) : (
              <div className="grid md:grid-cols-3 gap-6 mt-4">
                <div className="md:col-span-1">
                  <Card className="shadow-soft border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <FileText className="h-5 w-5 text-primary" />
                        Transcription Jobs
                      </CardTitle>
                      <CardDescription>
                        {sessionJobs.length} job{sessionJobs.length !== 1 ? 's' : ''} found
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      {comparisonMode && (
                        <ComparisonModeHeader 
                          jobsToCompare={jobsToCompare}
                          toggleComparisonMode={toggleComparisonMode}
                          startComparison={startComparison}
                        />
                      )}
                      
                      <TranscriptionJobList 
                        jobs={sessionJobs}
                        selectedJob={selectedJob}
                        comparisonMode={comparisonMode}
                        jobsToCompare={jobsToCompare}
                        onSelectJob={handleSelectJob}
                        isJobSelectedForComparison={isJobSelectedForComparison}
                      />
                    </CardContent>
                    <CardFooter className="pt-0">
                      <ExportControls 
                        selectedJob={selectedJob}
                        exportFormat={exportFormat}
                        onExportFormatChange={setExportFormat}
                        onExport={() => selectedJob && exportTranscription(selectedJob)}
                        onSave={handleSaveSelectedTranscription}
                      />
                    </CardFooter>
                  </Card>
                </div>
                
                <div className="md:col-span-2">
                  {viewMode === 'single' ? (
                    selectedJob ? (
                      <SingleJobView 
                        selectedJob={selectedJob}
                        audioUrl={audioUrl}
                        extractVttContent={extractVttContent}
                        getModelDisplayName={getModelDisplayName}
                      />
                    ) : (
                      <Card className="shadow-soft border-2 h-full flex items-center justify-center">
                        <CardContent className="text-center py-10">
                          <NoJobSelectedState />
                        </CardContent>
                      </Card>
                    )
                  ) : (
                    <ComparisonView 
                      jobsToCompare={jobsToCompare}
                      extractVttContent={extractVttContent}
                      getModelDisplayName={getModelDisplayName}
                      setViewMode={setViewMode}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publish Dialog */}
      {selectedJob && (
        <PublishDialog 
          videoId={videoId}
          setVideoId={setVideoId}
          isPublishing={isPublishing}
          publishToBrightcove={publishToBrightcove}
          selectedJob={selectedJob}
          getModelDisplayName={getModelDisplayName}
        />
      )}
    </>
  );
};

export default SessionDetails;
