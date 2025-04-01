
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import TranscriptionCard from "@/components/TranscriptionCard";

interface SingleJobViewProps {
  selectedJob: any;
  audioUrl: string | null;
  extractVttContent: (job: any) => string;
  getModelDisplayName: (model: string) => string;
}

const SingleJobView: React.FC<SingleJobViewProps> = ({
  selectedJob,
  audioUrl,
  extractVttContent,
  getModelDisplayName
}) => {
  return (
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
  );
};

export default SingleJobView;
