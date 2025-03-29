
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isUploading: boolean;
  acceptedFileTypes?: string;
  acceptedTypeLabel?: string;
  maxSizeMB?: number;
  uploadProgress?: number;
}

const FileUpload = ({ 
  onFileUpload, 
  isUploading, 
  acceptedFileTypes = ".mp3,audio/mpeg",
  acceptedTypeLabel = "MP3 files only",
  maxSizeMB = 100,
  uploadProgress = 0
}: FileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files[0]);
      e.dataTransfer.clearData(); // Clear the data to prevent duplicate uploads
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files[0]);
      e.target.value = ''; // Reset the input value to allow re-uploading the same file
    }
  };

  const handleFiles = (file: File) => {
    // Check file type
    const isAcceptedType = new RegExp(acceptedFileTypes.split(',').join('|')).test(file.type);
    if (!isAcceptedType) {
      toast({
        title: "Invalid file type",
        description: `Please upload a file matching: ${acceptedTypeLabel}`,
        variant: "destructive"
      });
      return;
    }
    
    // Check file size (in MB)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${maxSizeMB}MB. Your file is ${fileSizeMB.toFixed(2)}MB.`,
        variant: "destructive"
      });
      return;
    }
    
    onFileUpload(file);
  };

  return (
    <div 
      className={`w-full border-2 border-dashed rounded-lg p-6 text-center flex flex-col items-center justify-center cursor-pointer h-40 transition-colors
        ${dragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-muted/50"}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes}
        onChange={handleFileInput}
        className="hidden"
      />
      
      {isUploading ? (
        <div className="flex flex-col items-center w-full">
          <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground mb-2">Uploading file...</p>
          {uploadProgress > 0 && (
            <div className="w-full max-w-xs">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{uploadProgress}% complete</p>
            </div>
          )}
        </div>
      ) : (
        <>
          <Upload className="h-6 w-6 text-muted-foreground mb-2" />
          <p className="font-medium">Drag & drop a file here or click to browse</p>
          <p className="text-sm text-muted-foreground mt-1">{acceptedTypeLabel}</p>
        </>
      )}
    </div>
  );
};

export default FileUpload;
