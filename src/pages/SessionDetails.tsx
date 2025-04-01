import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getUserTranscriptionJobs, addCaptionToBrightcove, fetchBrightcoveKeys, getBrightcoveAuthToken, getSessionTranscriptionJobs } from "@/lib/api";
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
import { formatDistanceToNow, format, parseISO } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const { sessionId, sessionTimestamp } = useParams<{ sessionId?: string; sessionTimestamp?: string }>();
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
  
  useEffect(() => {
    const fetchSessionJobs = async () => {
      try {
        setLoading(true);
        
        const identifier = sessionId || sessionTimestamp;
        
        if (!identifier) {
          toast({
            title: "Missing session identifier",
            description: "Could not load session details: No session ID or timestamp provided",
            variant: "destructive",
          });
          return;
        }
        
        console.log(`Using session identifier: ${identifier}`);
        
        let matchingJobs: TranscriptionJob[] = [];
        
        if (identifier.includes('T') && identifier.includes('Z')) {
          console.log("Identifier appears to be a timestamp");
          
          const decodedTimestamp = decodeURIComponent(identifier);
          console.log(`Decoded timestamp: ${decodedTimestamp}`);
          
          try {
            const timestampDate = new Date(decodedTimestamp);
            
            const allJobs = await getUserTranscriptionJobs();
            console.log(`Retrieved ${allJobs.length} total jobs`);
            
            const TIME_WINDOW = 5 * 60 * 1000;
            matchingJobs = allJobs
              .filter((apiJob: TranscriptionJobFromAPI) => {
                try {
                  const jobCreatedAt = new Date(apiJob.created_at);
                  const diffMs = Math.abs(jobCreatedAt.getTime() - timestampDate.getTime());
                  return diffMs <= TIME_WINDOW;
                } catch (err) {
                  console.error("Error comparing dates:", err);
                  return false;
                }
              })
              .map(convertToTranscriptionJob);
              
            console.log(`Found ${matchingJobs.length} jobs within the time window`);
          } catch (err) {
            console.error(`Error parsing timestamp ${decodedTimestamp}:`, err);
            
            const allJobs = await getUserTranscriptionJobs();
            matchingJobs = allJobs.slice(0, 10).map(convertToTranscriptionJob);
          }
        } else {
          console.log("Identifier appears to be a UUID");
          
          try {
            const sessionJobs = await getSessionTranscriptionJobs(identifier);
            matchingJobs = sessionJobs.map(convertToTranscriptionJob);
            console.log(`Found ${matchingJobs.length} jobs with session ID: ${identifier}`);
          } catch (error) {
            console.error(`Error fetching jobs for session ${identifier}:`, error);
            
            const allJobs = await getUserTranscriptionJobs();
            matchingJobs = allJobs
              .filter((apiJob: TranscriptionJobFromAPI) => apiJob.session_id === identifier)
              .map(convertToTranscriptionJob);
            console.log(`Found ${matchingJobs.length} jobs using fallback method`);
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
        
        if (sessionId && !sessionId.includes('T')) {
          try {
            const { data: sessionData } = await supabase
              .from('transcription_sessions')
              .select('audio_file_name')
              .eq('id', sessionId)
              .single();
              
            if (sessionData?.audio_file_name) {
              const { data } = await supabase.storage
                .from('transcriptions')
                .createSignedUrl(`sessions/${sessionId}/${sessionData.audio_file_name}`, 3600);
                
              if (data) {
                setAudioUrl(data.signedUrl);
              }
            }
          } catch (error) {
            console.error("Error fetching audio URL:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching session jobs:", error);
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
  }, [sessionId, sessionTimestamp, toast]);
  
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

      const sessionIdentifier = sessionId || sessionTimestamp;
      
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
                            <span className="font-medium">{getModelDisplayName(selectedJob.model)}</span>
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
              {sessionTimestamp && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <p>
                    Session from {format(new Date(decodeURIComponent(sessionTimestamp)), 'MMM d, yyyy - h:mm a')} 
                    <span className="text-muted-foreground/70 text-sm ml-2">
                      ({formatDistanceToNow(new Date(decodeURIComponent(sessionTimestamp)), { addSuffix: true })})
                    </span>
                  </p>
                </div>
              )}
              {sessionId && !sessionTimestamp && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <p>
                    Session ID: {sessionId}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 mt-8 border rounded-lg shadow-soft bg-card">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading session details...</p>
            </div>
          ) : sessionJobs.length === 0 ? (
            <Card className="p-8 text-center shadow-soft border-2 animate-fade-in mt-8">
              <CardContent className="flex flex-col items-center justify-center pt-6">
                <div className="w-16 h-16 rounded-full bg-muted/80 flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No Jobs Found</h2>
                <p className="text-muted-foreground mb-4">
                  We couldn't find any transcription jobs for this session.
                </p>
                <Button asChild className="shadow-soft hover-lift">
                  <Link to="/app">Return to Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {comparisonMode && jobsToCompare.length > 0 && (
                <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium flex items-center">
                        <Info className="mr-2 h-4 w-4 text-primary" />
                        Selected for comparison: {jobsToCompare.length}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {jobsToCompare.map(job => (
                          <Badge key={job.id} variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            {getModelDisplayName(job.model)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <Button 
                      variant="default" 
                      onClick={startComparison}
                      disabled={jobsToCompare.length < 2}
                      className="flex items-center gap-1.5 shadow-soft hover-lift"
                    >
                      <Columns className="h-4 w-4" />
                      Compare Side by Side
                    </Button>
                  </div>
                </div>
              )}
              
              {viewMode === 'compare' ? (
                <div className="grid gap-6 auto-cols-fr animate-scale-in">
                  <div className={`grid grid-cols-1 ${
                    jobsToCompare.length === 2 ? 'md:grid-cols-2' : 
                    jobsToCompare.length === 3 ? 'md:grid-cols-3' : 
                    jobsToCompare.length >= 4 ? 'md:grid-cols-2 lg:grid-cols-3' : ''
                  } gap-6`}>
                    {jobsToCompare.map((job) => (
                      <Card key={job.id} className="h-full shadow-soft border-2 hover:shadow-md transition-shadow duration-300">
                        <CardHeader className="bg-gradient-to-r from-accent/5 to-primary/5 border-b">
                          <CardTitle className="text-xl flex items-center gap-2">
                            <Badge className="bg-accent text-accent-foreground">
                              {getModelDisplayName(job.model)}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            Created {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                          <ScrollArea className="h-[500px] p-4">
                            <TranscriptionCard
                              modelName={getModelDisplayName(job.model)}
                              vttContent={extractVttContent(job)}
                              prompt={job.result?.prompt || ""}
                              onSelect={() => {}}
                              isSelected={true}
                              audioSrc={audioUrl || undefined}
                              isLoading={false}
                            />
                          </ScrollArea>
                        </CardContent>
                        <CardFooter className="border-t p-3 flex justify-end gap-2 bg-muted/30">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-1.5"
                            onClick={() => exportTranscription(job)}
                          >
                            <Download className="h-3.5 w-3.5" />
                            Export
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                  <div className="flex justify-center mt-2">
                    <Button 
                      variant="outline" 
                      className="gap-1.5 shadow-soft hover-lift"
                      onClick={() => setViewMode('single')}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Return to Single View
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in">
                  <Card className="md:col-span-5 shadow-soft">
                    <CardHeader className="bg-gradient-to-r from-background to-secondary/30">
                      <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 text-primary" />
                        Transcription Jobs
                      </CardTitle>
                      <CardDescription>
                        {sessionJobs.length} jobs in this session
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Model</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sessionJobs.map((job) => (
                            <TableRow 
                              key={job.id}
                              className={`
                                ${job.id === selectedJob?.id ? "bg-primary/5" : ""}
                                ${isJobSelectedForComparison(job.id) ? "bg-accent/10" : ""}
                                highlight-on-hover
                              `}
                              onClick={() => handleSelectJob(job)}
                              style={{ cursor: job.status === 'completed' ? 'pointer' : 'default' }}
                            >
                              <TableCell className="font-medium">{getModelDisplayName(job.model)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  {getStatusIcon(job.status)}
                                  <span className={getStatusColor(job.status)}>
                                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                              </TableCell>
                              <TableCell className="text-right">
                                {job.status === 'completed' ? (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSelectJob(job);
                                    }}
                                    className="hover:bg-primary/10"
                                  >
                                    {comparisonMode ? (
                                      isJobSelectedForComparison(job.id) ? "Deselect" : "Select"
                                    ) : (
                                      "View"
                                    )}
                                  </Button>
                                ) : (
                                  <div className="w-16">
                                    <Progress value={getProgressValue(job.status)} className="h-1.5" />
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                  
                  <Card className="md:col-span-7 shadow-soft border-2">
                    <CardHeader className="bg-gradient-to-r from-background to-muted/50 border-b">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Transcription Result
                      </CardTitle>
                      <CardDescription>
                        {selectedJob 
                          ? `${getModelDisplayName(selectedJob.model)} transcription` 
                          : "Select a completed job to view details"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4">
                      {selectedJob ? (
                        <div className="animate-fade-in">
                          <TranscriptionCard
                            modelName={getModelDisplayName(selectedJob.model)}
                            vttContent={extractVttContent(selectedJob)}
                            prompt={selectedJob.result?.prompt || ""}
                            onSelect={() => {}}
                            isSelected={true}
                            audioSrc={audioUrl || undefined}
                            isLoading={false}
                          />
                        </div>
                      ) : (
                        <div className="p-12 text-center border rounded-md border-dashed animate-pulse-opacity">
                          <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">No transcription selected</h3>
                          <p className="text-muted-foreground">
                            Select a completed transcription job from the list to view its details.
                          </p>
                        </div>
                      )}
                    </CardContent>
                    {selectedJob && (
                      <CardFooter className="border-t p-4 flex justify-between gap-4 bg-muted/20">
                        <div className="flex gap-2">
                          <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
                            <SelectTrigger className="w-[120px]">
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
                            className="gap-1.5"
                            onClick={() => exportTranscription(selectedJob)}
                          >
                            <Download className="h-4 w-4" />
                            Export
                          </Button>
                        </div>
                        <Button 
                          variant="default" 
                          className="gap-1.5 bg-primary"
                          onClick={handleSaveSelectedTranscription}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Save as Selected Transcription
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default SessionDetails;
