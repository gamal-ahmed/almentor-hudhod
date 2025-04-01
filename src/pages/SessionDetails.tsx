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
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchSessionJobs = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        
        const identifier = sessionId || sessionTimestamp;
        
        if (!identifier) {
          toast({
            title: "Missing session identifier",
            description: "Could not load session details: No session ID or timestamp provided",
            variant: "destructive",
          });
          setFetchError("No session identifier provided");
          setLoading(false);
          return;
        }
        
        console.log(`Using session identifier: ${identifier}`);
        
        let matchingJobs: TranscriptionJob[] = [];
        let isTimestamp = false;
        
        // Check if the identifier looks like a timestamp
        if (identifier.includes('T') && identifier.includes('Z')) {
          isTimestamp = true;
          console.log("Identifier appears to be a timestamp");
          
          // Make sure to decode URL-encoded timestamp
          const decodedTimestamp = decodeURIComponent(identifier);
          console.log(`Decoded timestamp: ${decodedTimestamp}`);
          
          try {
            // We'll use a wider time window (10 minutes) to find jobs
            const TIME_WINDOW = 10 * 60 * 1000; // 10 minutes in milliseconds
            const timestampDate = new Date(decodedTimestamp);
            
            // Fetch jobs via API with throttling protection
            const fetchJobsWithRetry = async (retries = 3) => {
              try {
                // Try direct database query first if possible
                const { data: directJobs, error: directError } = await supabase
                  .from('transcriptions')
                  .select('*')
                  .gte('created_at', new Date(timestampDate.getTime() - TIME_WINDOW).toISOString())
                  .lte('created_at', new Date(timestampDate.getTime() + TIME_WINDOW).toISOString())
                  .order('created_at', { ascending: false });
                
                if (!directError && directJobs && directJobs.length > 0) {
                  console.log(`Found ${directJobs.length} jobs directly from database`);
                  return directJobs.map(convertToTranscriptionJob);
                }
                
                // Fallback to API
                const allJobs = await getUserTranscriptionJobs();
                console.log(`Retrieved ${allJobs.length} total jobs`);
                
                // Filter jobs by created_at timestamp within the window
                const timeFilteredJobs = allJobs
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
                  
                console.log(`Found ${timeFilteredJobs.length} jobs within the time window`);
                return timeFilteredJobs;
              } catch (err) {
                if (retries > 0) {
                  console.log(`Retrying job fetch, ${retries} attempts left`);
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  return fetchJobsWithRetry(retries - 1);
                }
                throw err;
              }
            };
            
            matchingJobs = await fetchJobsWithRetry();
            
            if (matchingJobs.length === 0) {
              // Last resort: get most recent jobs
              const { data: recentJobs } = await supabase
                .from('transcriptions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);
                
              if (recentJobs && recentJobs.length > 0) {
                console.log(`Found ${recentJobs.length} recent jobs as fallback`);
                matchingJobs = recentJobs.map(convertToTranscriptionJob);
              }
            }
            
          } catch (err) {
            console.error(`Error parsing timestamp ${decodedTimestamp}:`, err);
            setFetchError(`Error processing timestamp: ${err.message}`);
            
            // Fallback: get some recent jobs as a last resort
            try {
              const allJobs = await getUserTranscriptionJobs();
              matchingJobs = allJobs.slice(0, 10).map(convertToTranscriptionJob);
              console.log(`Using ${matchingJobs.length} recent jobs as fallback`);
            } catch (fallbackErr) {
              console.error("Fallback fetch also failed:", fallbackErr);
              setFetchError(`Failed to fetch jobs: ${fallbackErr.message}`);
            }
          }
        } else {
          console.log("Identifier appears to be a UUID");
          
          try {
            const sessionJobs = await getSessionTranscriptionJobs(identifier);
            matchingJobs = sessionJobs.map(convertToTranscriptionJob);
            console.log(`Found ${matchingJobs.length} jobs with session ID: ${identifier}`);
          } catch (error) {
            console.error(`Error fetching jobs for session ${identifier}:`, error);
            setFetchError(`Error fetching session jobs: ${error.message}`);
            
            // Fallback: try direct query
            try {
              const { data: directJobs, error: directError } = await supabase
                .from('transcriptions')
                .select('*')
                .eq('session_id', identifier)
                .order('created_at', { ascending: false });
                
              if (!directError && directJobs && directJobs.length > 0) {
                matchingJobs = directJobs.map(convertToTranscriptionJob);
                console.log(`Found ${matchingJobs.length} jobs with direct query`);
              } else {
                // Second fallback: try regular API
                const allJobs = await getUserTranscriptionJobs();
                matchingJobs = allJobs
                  .filter((apiJob: TranscriptionJobFromAPI) => apiJob.session_id === identifier)
                  .map(convertToTranscriptionJob);
                console.log(`Found ${matchingJobs.length} jobs using fallback method`);
              }
            } catch (fallbackErr) {
              console.error("Fallback fetch also failed:", fallbackErr);
              // Keep the original error message
            }
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
        
        // Load audio URL if it's a UUID session
        if (identifier && !isTimestamp) {
          try {
            const { data: sessionData } = await supabase
              .from('transcription_sessions')
              .select('audio_file_name')
              .eq('id', identifier)
              .single();
              
            if (sessionData?.audio_file_name) {
              const { data } = await supabase.storage
                .from('transcriptions')
                .createSignedUrl(`sessions/${identifier}/${sessionData.audio_file_name}`, 3600);
                
              if (data) {
                setAudioUrl(data.signedUrl);
              }
            }
          } catch (error) {
            console.error("Error fetching audio URL:", error);
            // Don't set fetch error - audio is optional
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

      // For timestamp sessions, we'll just store in storage without DB update
      if (sessionIdentifier.includes('T') && sessionIdentifier.includes('Z')) {
        addLog(`Saved transcription to storage (without session update): ${fileName}`, "success", {
          source: "SessionDetails",
          details: `Model: ${getModelDisplayName(selectedJob.model)}, URL: ${publicUrlData.publicUrl}`
        });
        
        toast({
          title: "Transcription Saved",
          description: "The selected transcription has been saved to storage (without session update).",
          variant: "default"
        });
        return;
      }

      // For UUID sessions, update the session record
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
  
  // Refresh jobs manually
  const handleRefreshJobs = async () => {
    setLoading(true);
    try {
      const identifier = sessionId || sessionTimestamp;
      if (!identifier) return;
      
      if (identifier.includes('T') && identifier.includes('Z')) {
        const decodedTimestamp = decodeURIComponent(identifier);
        const timestampDate = new Date(decodedTimestamp);
        
        // Use a wider time window (15 minutes)
        const TIME_WINDOW = 15 * 60 * 1000; 
        
        const { data: directJobs, error: directError } = await supabase
          .from('transcriptions')
          .select('*')
          .gte('created_at', new Date(timestampDate.getTime() - TIME_WINDOW).toISOString())
          .lte('created_at', new Date(timestampDate.getTime() + TIME_WINDOW).toISOString())
          .order('created_at', { ascending: false });
          
        if (!directError && directJobs && directJobs.length > 0) {
          setSessionJobs(directJobs.map(convertToTranscriptionJob));
          console.log(`Refreshed and found ${directJobs.length} jobs`);
          
          const completedJobs = directJobs
            .filter(job => job.status === 'completed')
            .map(convertToTranscriptionJob);
            
          if (completedJobs.length > 0 && !selectedJob) {
            setSelectedJob(completedJobs[0]);
          }
          
          toast({
            title: "Jobs Refreshed",
            description: `Found ${directJobs.length} jobs for this session`,
          });
        } else {
          toast({
            title: "No New Jobs Found",
            description: "Couldn't find any additional jobs for this session",
          });
        }
      } else {
        // UUID-based session
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
                  <Calendar className="
