import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Header } from '@/components/Header'; // Import as named export
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSessionDetails } from '@/hooks/useSessionDetails';
import { SessionHeader } from '@/components/session/SessionHeader';
import { TranscriptionJobList } from '@/components/session/TranscriptionJobList';
import { Card, CardContent } from '@/components/ui/card';
import { ComparisonView } from '@/components/session/ComparisonView';
import { SingleJobView } from '@/components/session/SingleJobView';
import { useComparisonMode } from '@/hooks/useComparisonMode';
import { useSelectedJob } from '@/hooks/useSelectedJob';
import { SessionStatusStates } from '@/components/session/SessionStatusStates';
import { LogsPanel } from '@/components/LogsPanel';

export default function SessionDetails() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { session, jobs, fetchSessionDetails, isLoading, error } = useSessionDetails(sessionId || '');
  const { comparisonMode } = useComparisonMode();
  const { selectedJob, setSelectedJob } = useSelectedJob();

  useEffect(() => {
    if (sessionId) {
      fetchSessionDetails(sessionId);
    }
  }, [sessionId, fetchSessionDetails]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (!session) {
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
        <SessionHeader session={session} />
        <SessionStatusStates session={session} />
        <div className="md:grid md:grid-cols-4 md:gap-4">
          <div className="md:col-span-1">
            <Card className="mb-4">
              <CardContent className="p-4">
                <TranscriptionJobList
                  jobs={jobs}
                  selectedJob={selectedJob}
                  onJobSelect={(job) => setSelectedJob(job)}
                />
              </CardContent>
            </Card>
            <LogsPanel />
          </div>
          <div className="md:col-span-3">
            <Tabs defaultvalue="comparison" className="w-full space-y-4">
              <TabsList>
                <TabsTrigger value="comparison">Comparison View</TabsTrigger>
                <TabsTrigger value="single">Single Job View</TabsTrigger>
              </TabsList>
              <TabsContent value="comparison">
                <ComparisonView jobs={jobs} />
              </TabsContent>
              <TabsContent value="single">
                <SingleJobView selectedJob={selectedJob} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
