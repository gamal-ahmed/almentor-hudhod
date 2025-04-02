
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CaptionsOff, Trash2, RefreshCw } from "lucide-react";
import { useState } from "react";

interface Caption {
  id: string;
  src: string;
  srclang: string;
  label: string;
  kind: string;
  default: boolean;
  mime_type: string;
}

interface CaptionsListProps {
  captions: Caption[];
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

const CaptionsList = ({ captions, onDelete, onRefresh }: CaptionsListProps) => {
  const [deletingCaptionId, setDeletingCaptionId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleDelete = async (captionId: string) => {
    setDeletingCaptionId(captionId);
    try {
      await onDelete(captionId);
    } finally {
      setDeletingCaptionId(null);
    }
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              Existing Captions
            </CardTitle>
            <CardDescription>
              {captions.length === 1 
                ? "1 caption found" 
                : `${captions.length} captions found`}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {captions.length === 0 ? (
          <div className="text-center py-8 flex flex-col items-center">
            <CaptionsOff className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No captions found for this video</p>
          </div>
        ) : (
          <div className="space-y-4">
            {captions.map((caption) => (
              <div key={caption.id} className="border rounded-md p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{caption.label || caption.srclang}</h3>
                    <p className="text-sm text-muted-foreground">Language: {caption.srclang}</p>
                    <p className="text-sm text-muted-foreground">Type: {caption.kind}</p>
                    {caption.default && (
                      <span className="inline-flex items-center px-2 py-1 mt-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        Default
                      </span>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(caption.id)}
                    disabled={deletingCaptionId === caption.id}
                  >
                    {deletingCaptionId === caption.id ? (
                      "Deleting..."
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </>
                    )}
                  </Button>
                </div>
                
                {caption.src && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Source URL:</p>
                    <div className="p-2 bg-secondary/20 rounded text-xs break-all">
                      {caption.src}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CaptionsList;
