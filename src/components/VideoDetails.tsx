
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Video } from "lucide-react";

interface VideoDetailsProps {
  details: {
    id?: string;
    name?: string;
    duration?: number;
    master_url?: string | null;
    complete?: boolean;
  };
}

const VideoDetails = ({ details }: VideoDetailsProps) => {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Video Details
        </CardTitle>
        <CardDescription>Information about the selected video</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground">Video ID</Label>
            <p className="font-medium">{details.id}</p>
          </div>
          
          <div>
            <Label className="text-sm text-muted-foreground">Name</Label>
            <p className="font-medium">{details.name}</p>
          </div>
          
          {details.duration && (
            <div>
              <Label className="text-sm text-muted-foreground">Duration</Label>
              <p className="font-medium">{Math.round(details.duration / 1000)} seconds</p>
            </div>
          )}
          
          <div>
            <Label className="text-sm text-muted-foreground">Master URL Available</Label>
            <p className="font-medium">{details.master_url ? "Yes" : "No"}</p>
          </div>
          
          {details.complete !== undefined && (
            <div>
              <Label className="text-sm text-muted-foreground">Processing Status</Label>
              <p className="font-medium">{details.complete ? "Complete" : "Processing"}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoDetails;
