
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getSessionTranscriptionJobs } from "@/lib/api";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  ArrowLeft, 
  Clock, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Split, 
  Columns, 
  XCircle, 
  Send, 
  Download,
  Video,
  FileSymlink,
  RefreshCw,
  RotateCcw,
  Calendar,
  Info
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import TranscriptionCard from "@/components/TranscriptionCard";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLogsStore } from "@/lib/useLogsStore";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

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

type ExportFormat = 'vtt' | 'srt' | 'text' | 'json';

const SessionDetails = () => {
  const { sessionId } = useParams<{ sessionId?: string }>();
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
        
        if (!identifier) {
          toast({
            title: "Missing session identifier",
            description: "Could not load session details: No session ID provided",
            variant: "destructive",
          });
          setFetchError("No session identifier provided");
          setLoading(false);
          return;
        }
        
        console.log(`Using session identifier: ${identifier}`);
        
        let matchingJobs: TranscriptionJob[] = [];
        
        try {
          const sessionJobs = await getSessionTranscriptionJobs(identifier);
          matchingJobs = sessionJobs.map(convertToTranscriptionJob);
          console.log(`Found ${matchingJobs.length} jobs with session ID: ${identifier}`);
        } catch (error) {
          console.error(`Error fetching jobs for session ${identifier}:`, error);
          setFetchError(`Error fetching session jobs: ${error.message}`);
          
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
          } catch (fallbackErr) {
            console.error("Fallback fetch also failed:", fallbackErr);
          }
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
        setFetchError(`Failed to load session data: ${error.message}`);
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
  }, [sessionId, toast]);
  
  
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
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 dark:text-blue-400 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-amber-500 dark:text-amber-400" />;
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500 dark:text-green-400';
      case 'failed':
        return 'text-red-500 dark:text-red-400';
      case 'processing':
        return 'text-blue-500 dark:text-blue-400';
      default:
        return 'text-amber-500 dark:text-amber-400';
    }
  };
  
  const getProgressValue = (status: string) => {
    switch (status) {
      case 'completed':
        return 100;
      case 'failed':
        return 100;
      case 'processing':
        return 65;
      default:
        return 25;
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
      
      const refreshedJobs = await getSessionTranscriptionJobs(identifier);
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
            <div className="flex items-center justify-between">
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-1.5 shadow-soft hover-lift"
                asChild
              >
                <Link to="/app">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Link>
              </Button>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={handleRefreshJobs}
                  className="flex items-center gap-1.5 shadow-soft hover-lift"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Refresh Jobs
                </Button>
                
                <Button
                  variant={comparisonMode ? "default" : "outline"}
                  size="sm"
                  onClick={toggleComparisonMode}
                  className="flex items-center gap-1.5 shadow-soft hover-lift"
                >
                  {comparisonMode ? (
                    <>
                      <XCircle className="h-4 w-4" />
                      Exit Comparison
                    </>
                  ) : (
                    <>
                      <Split className="h-4 w-4" />
                      Compare Results
                    </>
                  )}
                </Button>
                
                {selectedJob && (
                  <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        className="flex items-center gap-1.5 shadow-soft hover-lift"
                      >
                        <Send className="h-4 w-4" />
                        Publish to Brightcove
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="shadow-soft border-2">
                      <DialogHeader>
                        <DialogTitle className="text-xl flex items-center gap-2">
                          <Video className="h-5 w-5 text-primary" />
                          Publish to Brightcove
                        </DialogTitle>
                        <DialogDescription>
                          Enter the Brightcove video ID to publish the selected transcription as a caption.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="videoId" className="font-medium">Brightcove Video ID</Label>
                          <Input 
                            id="videoId"
                            value={videoId}
                            onChange={(e) => setVideoId(e.target.value)}
                            placeholder="e.g. 1234567890"
                            className="shadow-inner-soft focus:ring-2 focus:ring-primary/30"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-medium">Selected Transcription</Label>
                          <div className="p-3 bg-muted rounded-md text-sm border">
                            <span className="font-medium">{selectedJob && getModelDisplayName(selectedJob.model)}</span>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setPublishDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          onClick={publishToBrightcove} 
                          disabled={isPublishing || !videoId}
                          className="gap-1.5"
                        >
                          {isPublishing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Publishing...
                            </>
                          ) : (
                            <>
                              <FileSymlink className="h-4 w-4" />
                              Publish Caption
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Transcription Session Details</h1>
              {sessionId && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Info className="h-4 w-4" />
                  <p>Session ID: {sessionId}</p>
                </div>
              )}
            </div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground text-center">Loading session details...</p>
              </div>
            ) : fetchError ? (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 my-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-medium text-destructive mb-2">Error Loading Session</h3>
                    <p className="text-muted-foreground mb-4">{fetchError}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRefreshJobs}
                      className="flex items-center gap-1.5"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            ) : sessionJobs.length === 0 ? (
              <div className="bg-muted rounded-lg p-6 my-4 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/70 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Transcription Jobs Found</h3>
                <p className="text-muted-foreground mb-4">
                  We couldn't find any transcription jobs for this session.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefreshJobs}
                  className="flex items-center gap-1.5 mx-auto"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
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
                        <div className="bg-accent/20 rounded-md p-3 mb-4 flex flex-col space-y-2 border border-accent">
                          <p className="text-sm font-medium">Comparison Mode</p>
                          <p className="text-xs text-muted-foreground">
                            Selected: {jobsToCompare.length} transcription{jobsToCompare.length !== 1 ? 's' : ''}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Button 
                              size="sm" 
                              variant="default"
                              className="text-xs h-8 flex items-center gap-1.5 w-full"
                              onClick={startComparison}
                              disabled={jobsToCompare.length < 2}
                            >
                              <Columns className="h-3.5 w-3.5" />
                              Compare Selected
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="text-xs h-8 flex items-center gap-1.5"
                              onClick={toggleComparisonMode}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <ScrollArea className="h-[340px] pr-4 -mr-4">
                        <div className="space-y-3">
                          {sessionJobs.map((job) => (
                            <div
                              key={job.id}
                              className={`
                                border rounded-md p-3 cursor-pointer transition-all
                                ${job.status === 'completed' ? 'hover:border-primary/50 hover:bg-muted/50' : ''}
                                ${selectedJob?.id === job.id && !comparisonMode ? 'border-primary bg-primary/5' : ''}
                                ${isJobSelectedForComparison(job.id) ? 'border-primary bg-primary/5' : ''}
                              `}
                              onClick={() => handleSelectJob(job)}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-1.5">
                                  <Badge variant={job.status === 'completed' ? 'default' : job.status === 'failed' ? 'destructive' : 'outline'}>
                                    {getStatusIcon(job.status)}
                                    <span className="ml-1 capitalize">{job.status}</span>
                                  </Badge>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <div className="mb-2">
                                <h4 className="font-medium">{getModelDisplayName(job.model)}</h4>
                              </div>
                              <div className="mt-2">
                                <Progress value={getProgressValue(job.status)} className="h-1 mb-1" />
                                <div className="flex justify-between text-xs">
                                  <span className={getStatusColor(job.status)}>
                                    {job.status === 'failed' ? 'Failed' : job.status === 'completed' ? 'Complete' : 'Processing...'}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {format(new Date(job.created_at), 'MMM d, h:mm a')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <div className="w-full flex justify-end gap-2 mt-3">
                        <Select
                          value={exportFormat}
                          onValueChange={(value) => setExportFormat(value as ExportFormat)}
                        >
                          <SelectTrigger className="w-[110px] text-xs h-9">
                            <SelectValue placeholder="Format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="vtt">VTT</SelectItem>
                            <SelectItem value="srt">SRT</SelectItem>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="json">JSON</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-1.5"
                          disabled={!selectedJob || selectedJob.status !== 'completed'}
                          onClick={() => selectedJob && exportTranscription(selectedJob)}
                        >
                          <Download className="h-4 w-4" />
                          Export
                        </Button>
                        
                        <Button 
                          size="sm" 
                          className="flex items-center gap-1.5"
                          disabled={!selectedJob || selectedJob.status !== 'completed'}
                          onClick={handleSaveSelectedTranscription}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Save
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
                
                <div className="md:col-span-2">
                  {viewMode === 'single' ? (
                    selectedJob ? (
                      <Card className="shadow-soft border-2 h-full">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex justify-between items-center">
                            <span className="text-xl flex items-center gap-2">
                              <FileText className="h-5 w-5 text-primary" />
                              {getModelDisplayName(selectedJob.model)}
                            </span>
                            <Badge variant={selectedJob.status === 'completed' ? 'default' : 'outline'}>
                              {selectedJob.status}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            Created {format(new Date(selectedJob.created_at), 'PPp')}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {audioUrl && (
                            <div className="mb-4 p-3 rounded-md bg-muted border">
                              <p className="text-sm font-medium mb-2">Original Audio</p>
                              <audio controls className="w-full">
                                <source src={audioUrl} type="audio/mpeg" />
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                          )}
                          
                          <Tabs defaultValue="preview">
                            <TabsList className="mb-3">
                              <TabsTrigger value="preview">Preview</TabsTrigger>
                              <TabsTrigger value="raw" disabled={selectedJob.status !== 'completed'}>Raw VTT</TabsTrigger>
                            </TabsList>
                            <TabsContent value="preview" className="m-0">
                              {selectedJob.status === 'completed' ? (
                                <TranscriptionCard 
                                  modelName={getModelDisplayName(selectedJob.model)}
                                  vttContent={extractVttContent(selectedJob)}
                                  isSelected={true}
                                  onSelect={() => {}}
                                />
                              ) : selectedJob.status === 'failed' ? (
                                <div className="p-4 border rounded-md bg-destructive/10 text-destructive">
                                  <h3 className="font-medium mb-1">Transcription Failed</h3>
                                  <p className="text-sm">{selectedJob.error || "Unknown error occurred"}</p>
                                </div>
                              ) : (
                                <div className="p-4 border rounded-md bg-muted flex items-center justify-center h-[300px]">
                                  <div className="text-center">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
                                    <p className="text-muted-foreground">Processing transcription...</p>
                                  </div>
                                </div>
                              )}
                            </TabsContent>
                            <TabsContent value="raw" className="m-0">
                              <div className="border rounded-md p-4 bg-muted/50">
                                <pre className="text-xs overflow-x-auto h-[300px]">
                                  {extractVttContent(selectedJob)}
                                </pre>
                              </div>
                            </TabsContent>
                          </Tabs>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="shadow-soft border-2 h-full flex items-center justify-center">
                        <CardContent className="text-center py-10">
                          <FileText className="h-10 w-10 mx-auto mb-4 text-muted-foreground/70" />
                          <h3 className="text-lg font-medium mb-2">No Transcription Selected</h3>
                          <p className="text-muted-foreground">
                            Select a transcription job from the list to view details.
                          </p>
                        </CardContent>
                      </Card>
                    )
                  ) : (
                    <Card className="shadow-soft border-2 h-full">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-xl flex items-center gap-2">
                          <Columns className="h-5 w-5 text-primary" />
                          Comparison View
                        </CardTitle>
                        <CardDescription>
                          Comparing {jobsToCompare.length} transcriptions
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 divide-y md:grid-cols-2 md:divide-y-0 md:divide-x gap-4">
                          {jobsToCompare.map((job) => (
                            <div key={job.id} className="p-2">
                              <div className="mb-2">
                                <h3 className="font-medium">{getModelDisplayName(job.model)}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(job.created_at), 'MMM d, h:mm a')}
                                </p>
                              </div>
                              <Separator className="my-2" />
                              <TranscriptionCard 
                                modelName={getModelDisplayName(job.model)}
                                vttContent={extractVttContent(job)}
                                isSelected={true}
                                onSelect={() => {}}
                                showPagination={false}
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="ml-auto flex items-center gap-1.5"
                          onClick={() => setViewMode('single')}
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Back to Single View
                        </Button>
                      </CardFooter>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default SessionDetails;
