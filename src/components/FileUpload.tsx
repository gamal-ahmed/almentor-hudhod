
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isUploading: boolean;
}

const FileUpload = ({ onFileUpload, isUploading }: FileUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [invalidFile, setInvalidFile] = useState(false);
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
    
    try {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFiles(e.dataTransfer.files[0]);
      }
    } catch (error) {
      console.error("Error handling dropped file:", error);
      setInvalidFile(true);
      toast({
        title: "Error processing file",
        description: "There was a problem with the dropped file. Please try another one.",
        variant: "destructive"
      });
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInvalidFile(false);
    try {
      if (e.target.files && e.target.files[0]) {
        handleFiles(e.target.files[0]);
      }
    } catch (error) {
      console.error("Error handling selected file:", error);
      setInvalidFile(true);
      toast({
        title: "Error processing file",
        description: "There was a problem with the selected file. Please try another one.",
        variant: "destructive"
      });
    }
  };

  const handleFiles = (file: File) => {
    try {
      // Verify file exists and has properties
      if (!file || !file.type) {
        throw new Error("Invalid file object");
      }
      
      // Check file type
      const isMP3 = file.type === "audio/mpeg" || file.name.toLowerCase().endsWith('.mp3');
      
      if (!isMP3) {
        setInvalidFile(true);
        toast({
          title: "Invalid file type",
          description: "Please upload an MP3 file",
          variant: "destructive"
        });
        return;
      }
      
      // Check file size (limit to 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        setInvalidFile(true);
        toast({
          title: "File too large",
          description: "Please upload an MP3 file smaller than 100MB",
          variant: "destructive"
        });
        return;
      }
      
      setInvalidFile(false);
      onFileUpload(file);
    } catch (error) {
      console.error("Error handling file:", error);
      setInvalidFile(true);
      toast({
        title: "Error processing file",
        description: "There was a problem with your file. Please try another one.",
        variant: "destructive"
      });
    }
  };

  return (
    <div 
      className={`w-full border-2 border-dashed rounded-lg p-6 text-center flex flex-col items-center justify-center cursor-pointer h-40 transition-colors
        ${invalidFile ? "border-red-500 bg-red-50 dark:bg-red-900/10" : 
          dragActive ? "border-primary bg-primary/10" : 
          "border-border hover:border-primary/50 hover:bg-muted/50"}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,audio/mpeg"
        onChange={handleFileInput}
        className="hidden"
      />
      
      {isUploading ? (
        <div className="flex flex-col items-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
          <p className="text-sm text-muted-foreground">Processing file...</p>
        </div>
      ) : (
        <>
          <Upload className={`h-6 w-6 ${invalidFile ? "text-red-500" : "text-muted-foreground"} mb-2`} />
          <p className="font-medium">Drag & drop an MP3 file here or click to browse</p>
          <p className="text-sm text-muted-foreground mt-1">MP3 files only (max 100MB)</p>
        </>
      )}
    </div>
  );
};

export default FileUpload;
