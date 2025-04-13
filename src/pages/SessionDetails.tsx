
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSessionDetails } from '@/hooks/useSessionDetails';
import SessionHeader from '@/components/session/SessionHeader';
import TranscriptionJobList from '@/components/session/TranscriptionJobList';
import { Card, CardContent } from '@/components/ui/card';
import ComparisonView from '@/components/session/ComparisonView';
import SingleJobView from '@/components/session/SingleJobView';
import { useComparisonMode } from '@/hooks/useComparisonMode';
import { useSelectedJob } from '@/hooks/useSelectedJob';
import SessionStatusStates from '@/components/session/SessionStatusStates';
import LogsPanel from '@/components/LogsPanel';

export default function SessionDetails() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { 
    loading, 
    sessionJobs, 
    selectedJob, 
    setSelectedJob, 
    refreshJobs,
    audioUrl,
    fetchError,
    loadedSessionId
  } = useSessionDetails(sessionId || '');
  
  const { comparisonMode } = useComparisonMode();

  useEffect(() => {
    if (sessionId) {
      refreshJobs();
    }
  }, [sessionId, refreshJobs]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Error: {fetchError}</p>
      </div>
    );
  }

  if (!loadedSessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Session not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-8 px-4 md:px-8">
        <SessionHeader sessionId={loadedSessionId} />
        <SessionStatusStates session={loadedSessionId} />
        <div className="md:grid md:grid-cols-4 md:gap-4">
          <div className="md:col-span-1">
            <Card className="mb-4">
              <CardContent className="p-4">
                <TranscriptionJobList
                  jobList={sessionJobs}
                  selectedJobId={selectedJob?.id}
                  onSelectJob={(job) => setSelectedJob(job)}
                />
              </CardContent>
            </Card>
            <LogsPanel logs={[]} />
          </div>
          <div className="md:col-span-3">
            <Tabs defaultValue="comparison" className="w-full space-y-4">
              <TabsList>
                <TabsTrigger value="comparison">Comparison View</TabsTrigger>
                <TabsTrigger value="single">Single Job View</TabsTrigger>
              </TabsList>
              <TabsContent value="comparison">
                <ComparisonView sessionJobs={sessionJobs} />
              </TabsContent>
              <TabsContent value="single">
                <SingleJobView 
                  selectedJob={selectedJob} 
                  audioUrl={audioUrl} 
                  extractVttContent={() => ''} 
                  getModelDisplayName={(model) => model}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
