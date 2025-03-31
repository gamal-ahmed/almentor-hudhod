
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getUserTranscriptionJobs } from "@/lib/api";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Clock, FileText, CheckCircle, AlertCircle, Split, Columns, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import TranscriptionCard from "@/components/TranscriptionCard";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// Update the interface to match the actual data structure
interface TranscriptionJobFromAPI {
  id: string;
  status: string; // Changed from union type to string to match API response
  model: string;
  created_at: string;
  updated_at: string;
  status_message: string;
  error?: string;
  result?: { 
    vttContent: string; 
    text: string; 
    prompt: string;
  } | any;
}

// Define the type we'll use internally
interface TranscriptionJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  model: string;
  created_at: string;
  updated_at: string;
  status_message: string;
  error?: string;
  result?: { 
    vttContent: string; 
    text: string; 
    prompt: string;
  } | any;
}

// Helper function to convert API response to our internal type
const convertToTranscriptionJob = (job: TranscriptionJobFromAPI): TranscriptionJob => {
  return {
    ...job,
    // Ensure status is one of our union types
    status: (job.status === 'pending' || job.status === 'processing' || 
             job.status === 'completed' || job.status === 'failed') 
             ? job.status as 'pending' | 'processing' | 'completed' | 'failed'
             : 'pending' // Default to pending if unknown status
  };
};

const SessionDetails = () => {
  const { sessionTimestamp } = useParams<{ sessionTimestamp: string }>();
  const [loading, setLoading] = useState(true);
  const [sessionJobs, setSessionJobs] = useState<TranscriptionJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<TranscriptionJob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const { toast } = useToast();
  
  // New state for comparison view
  const [comparisonMode, setComparisonMode] = useState(false);
  const [jobsToCompare, setJobsToCompare] = useState<TranscriptionJob[]>([]);
  const [viewMode, setViewMode] = useState<'single' | 'compare'>('single');
  
  useEffect(() => {
    const fetchSessionJobs = async () => {
      try {
        setLoading(true);
        const allJobs = await getUserTranscriptionJobs();
        
        if (!sessionTimestamp) {
          toast({
            title: "Missing session timestamp",
            description: "Could not load session details",
            variant: "destructive",
          });
          return;
        }
        
        // Convert the URL parameter back to a timestamp
        const targetTimestamp = new Date(decodeURIComponent(sessionTimestamp));
        
        // Find jobs that belong to this session (within 30 seconds of each other)
        const matchingJobs = allJobs.filter((apiJob: TranscriptionJobFromAPI) => {
          const jobTime = new Date(apiJob.created_at);
          return Math.abs(jobTime.getTime() - targetTimestamp.getTime()) <= 30000;
        }).map(convertToTranscriptionJob); // Convert API jobs to our internal type
        
        // Filter for completed jobs
        const completedJobs = matchingJobs.filter(job => job.status === 'completed');
        setSessionJobs(completedJobs);
        
        // If we have a completed job, select it by default
        if (completedJobs.length > 0) {
          setSelectedJob(completedJobs[0]);
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
  }, [sessionTimestamp, toast]);
  
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
  
  // Add/remove job from comparison list
  const toggleJobForComparison = (job: TranscriptionJob) => {
    setJobsToCompare(prev => {
      const isAlreadySelected = prev.some(j => j.id === job.id);
      
      if (isAlreadySelected) {
        return prev.filter(j => j.id !== job.id);
      } else {
        // Limit to maximum of 2 jobs for comparison
        const newJobs = [...prev, job];
        if (newJobs.length > 2) {
          toast({
            title: "Comparison Limit",
            description: "You can only compare up to 2 transcriptions at once",
          });
          return prev;
        }
        return newJobs;
      }
    });
  };
  
  // Toggle comparison mode
  const toggleComparisonMode = () => {
    if (comparisonMode) {
      // Exiting comparison mode
      setComparisonMode(false);
      setJobsToCompare([]);
      setViewMode('single');
    } else {
      // Entering comparison mode
      setComparisonMode(true);
      setJobsToCompare([]);
      toast({
        title: "Comparison Mode Activated",
        description: "Select up to 2 transcriptions to compare side by side.",
      });
    }
  };
  
  // Start the comparison once jobs are selected
  const startComparison = () => {
    if (jobsToCompare.length < 2) {
      toast({
        title: "Select More Transcriptions",
        description: "Please select 2 transcriptions to compare.",
        variant: "destructive",
      });
      return;
    }
    
    setViewMode('compare');
  };
  
  // Check if a job is selected for comparison
  const isJobSelectedForComparison = (jobId: string) => {
    return jobsToCompare.some(job => job.id === jobId);
  };
  
  return (
    <>
      <Header />
      <div className="container py-6">
        <div className="max-w-[1440px] mx-auto p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1.5"
              asChild
            >
              <Link to="/app">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            
            <Button
              variant={comparisonMode ? "default" : "outline"}
              size="sm"
              onClick={toggleComparisonMode}
              className="flex items-center gap-1.5"
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
          </div>
          
          <h1 className="text-2xl font-bold mb-4">Transcription Session Details</h1>
          <p className="text-muted-foreground mb-6">
            {sessionTimestamp && (
              <>
                Session from {new Date(decodeURIComponent(sessionTimestamp)).toLocaleString()} 
                ({formatDistanceToNow(new Date(decodeURIComponent(sessionTimestamp)), { addSuffix: true })})
              </>
            )}
          </p>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading session details...</p>
            </div>
          ) : sessionJobs.length === 0 ? (
            <Card className="p-8 text-center">
              <CardContent className="flex flex-col items-center justify-center pt-6">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h2 className="text-xl font-semibold mb-2">No Jobs Found</h2>
                <p className="text-muted-foreground mb-4">
                  We couldn't find any transcription jobs for this session.
                </p>
                <Button asChild>
                  <Link to="/app">Return to Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {comparisonMode && jobsToCompare.length > 0 && (
                <div className="mb-6 p-4 bg-muted rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Selected for comparison: {jobsToCompare.length}/2</h3>
                      <p className="text-sm text-muted-foreground">
                        {jobsToCompare.map(job => getModelDisplayName(job.model)).join(' vs ')}
                      </p>
                    </div>
                    
                    <Button 
                      variant="default" 
                      onClick={startComparison}
                      disabled={jobsToCompare.length < 2}
                      className="flex items-center gap-1.5"
                    >
                      <Columns className="h-4 w-4" />
                      Compare Side by Side
                    </Button>
                  </div>
                </div>
              )}
              
              {viewMode === 'compare' ? (
                /* Comparison View */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {jobsToCompare.map((job) => (
                    <Card key={job.id} className="h-full">
                      <CardHeader>
                        <CardTitle className="text-xl">{getModelDisplayName(job.model)}</CardTitle>
                        <CardDescription>
                          Created {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <TranscriptionCard
                          modelName={getModelDisplayName(job.model)}
                          vttContent={extractVttContent(job)}
                          prompt={job.result?.prompt || ""}
                          onSelect={() => {}}
                          isSelected={true}
                          audioSrc={audioUrl || undefined}
                          isLoading={false}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                /* Standard View */
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Left column - Jobs list */}
                  <Card className="md:col-span-5">
                    <CardHeader>
                      <CardTitle>Transcription Jobs</CardTitle>
                      <CardDescription>
                        {sessionJobs.length} jobs in this session
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
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
                                ${job.id === selectedJob?.id ? "bg-muted/50" : ""}
                                ${isJobSelectedForComparison(job.id) ? "bg-primary/10" : ""}
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
                  
                  {/* Right column - Selected job details */}
                  <Card className="md:col-span-7">
                    <CardHeader>
                      <CardTitle>Transcription Result</CardTitle>
                      <CardDescription>
                        {selectedJob 
                          ? `${getModelDisplayName(selectedJob.model)} transcription` 
                          : "Select a completed job to view details"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedJob ? (
                        <TranscriptionCard
                          modelName={getModelDisplayName(selectedJob.model)}
                          vttContent={extractVttContent(selectedJob)}
                          prompt={selectedJob.result?.prompt || ""}
                          onSelect={() => {}}
                          isSelected={true}
                          audioSrc={audioUrl || undefined}
                          isLoading={false}
                        />
                      ) : (
                        <div className="p-12 text-center border rounded-md border-dashed">
                          <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                          <h3 className="text-lg font-medium mb-2">No transcription selected</h3>
                          <p className="text-muted-foreground text-sm">
                            Select a completed job from the list to view its transcription result
                          </p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline"
                        asChild
                      >
                        <Link to="/app">
                          Back to Dashboard
                        </Link>
                      </Button>
                      {selectedJob && (
                        <Button 
                          variant="default"
                          onClick={() => {
                            toast({
                              title: "Feature coming soon",
                              description: "The export functionality will be available in a future update."
                            });
                          }}
                        >
                          Export Transcription
                        </Button>
                      )}
                    </CardFooter>
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
