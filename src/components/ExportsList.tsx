
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Download, RefreshCw, FileText, FileJson, File } from "lucide-react";
import { getUserExportedFiles, ExportFile } from "@/lib/api/exportService";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getFormatIcon = (format: string) => {
  switch (format) {
    case 'json':
      return <FileJson className="h-4 w-4" />;
    case 'txt':
      return <FileText className="h-4 w-4" />;
    default:
      return <File className="h-4 w-4" />;
  }
};

const ExportsList = () => {
  const [exports, setExports] = useState<ExportFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  
  const fetchExports = async () => {
    try {
      setIsLoading(true);
      const data = await getUserExportedFiles();
      setExports(data);
    } catch (error) {
      console.error("Failed to fetch exports:", error);
      toast({
        title: "Failed to Load Exports",
        description: error instanceof Error ? error.message : "Failed to load your exported files",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchExports();
    setIsRefreshing(false);
  };
  
  const handleDownload = (file: ExportFile) => {
    const downloadLink = document.createElement('a');
    downloadLink.href = file.file_url;
    downloadLink.download = `${file.file_name}.${file.format}`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    toast({
      title: "Download Started",
      description: `Downloading ${file.file_name}.${file.format}`,
    });
  };
  
  useEffect(() => {
    fetchExports();
  }, []);
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Your Exported Files</CardTitle>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-md">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            ))}
          </div>
        ) : exports.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No exported files yet</p>
            <p className="text-sm mt-1">Your exported transcriptions will appear here</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
            {exports.map((file) => (
              <div 
                key={file.id} 
                className="flex items-center justify-between p-3 border rounded-md hover:bg-secondary/30 transition-colors"
              >
                <div>
                  <div className="flex items-center">
                    {getFormatIcon(file.format)}
                    <span className="ml-2 font-medium">{file.file_name}.{file.format}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <span>
                      {format(new Date(file.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                    {file.size_bytes && (
                      <>
                        <span>•</span>
                        <span>{formatBytes(file.size_bytes)}</span>
                      </>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleDownload(file)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExportsList;
