
import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Columns, ArrowLeft } from "lucide-react";
import TranscriptionCard from "@/components/TranscriptionCard";

interface TranscriptionJob {
  id: string;
  status: string;
  model: string;
  created_at: string;
  updated_at: string;
  result?: any;
}

interface ComparisonViewProps {
  jobsToCompare: TranscriptionJob[];
  extractVttContent: (job: TranscriptionJob) => string;
  getModelDisplayName: (model: string) => string;
  setViewMode: (mode: 'single' | 'compare') => void;
  onExport: (job: TranscriptionJob) => void;
  onAccept: (job: TranscriptionJob) => void;
  audioUrl: string | null;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({
  jobsToCompare,
  extractVttContent,
  getModelDisplayName,
  setViewMode,
  onExport,
  onAccept,
  audioUrl
}) => {
  return (
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobsToCompare.map((job) => (
            <div key={job.id} className="flex flex-col h-full">
              <TranscriptionCard 
                modelName={getModelDisplayName(job.model)}
                vttContent={extractVttContent(job)}
                isSelected={true}
                onSelect={() => {}}
                showPagination={false}
                audioSrc={audioUrl}
                onExport={() => onExport(job)}
                onAccept={() => onAccept(job)}
                showExportOptions={true}
                className="h-full"
                showAudioControls={true}
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
  );
};

export default ComparisonView;
