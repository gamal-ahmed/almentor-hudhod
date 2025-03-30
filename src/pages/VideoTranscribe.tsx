
import { useState, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Video, FileText, Download, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

// Add type definitions for the missing method
declare global {
  interface HTMLVideoElement {
    captureStream?: () => MediaStream;
    mozCaptureStream?: () => MediaStream;
  }
}

const VideoTranscribePage = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [transcriptionResult, setTranscriptionResult] = useState<{
    vttContent: string;
    plainText: string;
    rawResponse: any;
  } | null>(null);
  const [languageCode, setLanguageCode] = useState("en-US");
  const [enableWordTimeOffsets, setEnableWordTimeOffsets] = useState(true);
  const [enableAutomaticPunctuation, setEnableAutomaticPunctuation] = useState(true);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check if file is a video file
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a video file.",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Create object URL for video preview
      if (videoRef.current) {
        videoRef.current.src = URL.createObjectURL(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      // Check if file is a video file
      if (!file.type.startsWith('video/')) {
        toast({
          title: "Invalid file type",
          description: "Please select a video file.",
          variant: "destructive"
        });
        return;
      }
      
      setSelectedFile(file);
      
      // Create object URL for video preview
      if (videoRef.current) {
        videoRef.current.src = URL.createObjectURL(file);
      }
    }
  };

  const extractAudioFromVideo = async (videoFile: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const audioContext = new AudioContext();
      let audioDestination: MediaStreamAudioDestinationNode;
      let mediaRecorder: MediaRecorder;
      let chunks: Blob[] = [];
      
      video.src = URL.createObjectURL(videoFile);
      
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        video.muted = true;
        
        // Create an audio stream from the video
        const stream = canvas.captureStream();
        audioDestination = audioContext.createMediaStreamDestination();
        
        // Check if captureStream is supported
        if (video.captureStream || video.mozCaptureStream) {
          // Extract audio from video's media stream if supported
          const videoStream = video.captureStream 
            ? video.captureStream() 
            : (video.mozCaptureStream ? video.mozCaptureStream() : null);
          
          if (videoStream && videoStream.getAudioTracks().length > 0) {
            stream.addTrack(videoStream.getAudioTracks()[0]);
          } else {
            // Fall back to just sending the video file directly
            toast({
              title: "Audio extraction limited",
              description: "Could not extract audio track, using video directly.",
              variant: "default"
            });
            URL.revokeObjectURL(video.src);
            resolve(videoFile);
            return;
          }
        } else {
          // Browser doesn't support captureStream
          toast({
            title: "Audio extraction not supported",
            description: "Your browser doesn't support audio extraction. Using video file directly.",
            variant: "default"
          });
          URL.revokeObjectURL(video.src);
          resolve(videoFile);
          return;
        }
        
        // Record the audio stream
        mediaRecorder = new MediaRecorder(stream);
        
        mediaRecorder.ondataavailable = (e) => {
          chunks.push(e.data);
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          resolve(audioBlob);
        };
        
        // Start recording and playing the video
        mediaRecorder.start();
        video.play();
        
        // Stop recording when video ends
        video.onended = () => {
          mediaRecorder.stop();
          video.pause();
          URL.revokeObjectURL(video.src);
        };
        
        // For debugging: manually stop if video is too long
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            video.pause();
            URL.revokeObjectURL(video.src);
          }
        }, 60000); // 1 minute safety timeout
      };
      
      video.onerror = () => {
        reject(new Error("Error loading video"));
      };
    });
  };

  const transcribeVideo = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a video file to transcribe.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsTranscribing(true);
      setProgress(10);
      
      // Extract audio from video
      toast({
        title: "Processing video",
        description: "Extracting audio from video file...",
      });
      
      setProgress(20);
      
      let audioBlob: Blob;
      try {
        audioBlob = await extractAudioFromVideo(selectedFile);
      } catch (error) {
        console.error("Error extracting audio:", error);
        toast({
          title: "Error extracting audio",
          description: "Using video file directly for transcription.",
          variant: "destructive"
        });
        audioBlob = selectedFile;
      }
      
      setProgress(50);
      
      // Create form data with audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');
      formData.append('languageCode', languageCode);
      formData.append('enableWordTimeOffsets', String(enableWordTimeOffsets));
      formData.append('enableAutomaticPunctuation', String(enableAutomaticPunctuation));
      
      toast({
        title: "Transcribing",
        description: "Sending to Google Speech-to-Text API...",
      });
      
      setProgress(60);
      
      // Call our edge function
      const { data, error } = await supabase.functions.invoke('google-transcribe', {
        body: formData,
      });
      
      if (error) {
        throw new Error(`Edge function error: ${error.message}`);
      }
      
      setProgress(100);
      setTranscriptionResult(data);
      
      toast({
        title: "Transcription complete",
        description: "Your video has been successfully transcribed.",
      });
    } catch (error) {
      console.error("Transcription error:", error);
      toast({
        title: "Transcription failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTranscription = (format: 'vtt' | 'txt') => {
    if (!transcriptionResult) return;
    
    const content = format === 'vtt' ? transcriptionResult.vttContent : transcriptionResult.plainText;
    const fileExtension = format === 'vtt' ? 'vtt' : 'txt';
    const fileName = `transcription.${fileExtension}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Video Transcription</h1>
      <p className="text-muted-foreground mb-8">
        Upload a video file to transcribe its audio content using Google Speech-to-Text.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Upload Video</CardTitle>
            <CardDescription>
              Upload a video file to extract and transcribe its audio content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center flex flex-col items-center justify-center cursor-pointer h-40 transition-colors ${
                selectedFile ? "border-primary bg-primary/10" : "border-border hover:border-primary/50 hover:bg-muted/50"
              }`}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {selectedFile ? (
                <div className="flex flex-col items-center">
                  <Video className="h-6 w-6 text-primary mb-2" />
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                  <p className="font-medium">Drag & drop a video file here or click to browse</p>
                  <p className="text-sm text-muted-foreground mt-1">MP4, WebM, MOV and other video formats</p>
                </>
              )}
            </div>
            
            {selectedFile && (
              <div className="mt-4">
                <video 
                  ref={videoRef} 
                  controls 
                  className="w-full h-auto rounded-lg"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
            
            {isTranscribing && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Transcription progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <div className="space-y-2 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="languageCode">Language</Label>
                  <select
                    id="languageCode"
                    value={languageCode}
                    onChange={(e) => setLanguageCode(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="en-GB">English (UK)</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                    <option value="de-DE">German</option>
                    <option value="it-IT">Italian</option>
                    <option value="ja-JP">Japanese</option>
                    <option value="ko-KR">Korean</option>
                    <option value="pt-BR">Portuguese (Brazil)</option>
                    <option value="ru-RU">Russian</option>
                    <option value="zh-CN">Chinese (Simplified)</option>
                    <option value="ar-SA">Arabic</option>
                  </select>
                </div>
                
                <div className="space-y-4 flex flex-col justify-end">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="word-timings" 
                      checked={enableWordTimeOffsets} 
                      onCheckedChange={(checked) => setEnableWordTimeOffsets(checked as boolean)}
                    />
                    <Label htmlFor="word-timings">Enable word timings</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="punctuation" 
                      checked={enableAutomaticPunctuation} 
                      onCheckedChange={(checked) => setEnableAutomaticPunctuation(checked as boolean)}
                    />
                    <Label htmlFor="punctuation">Enable automatic punctuation</Label>
                  </div>
                </div>
              </div>
              
              <Button 
                className="w-full" 
                onClick={transcribeVideo} 
                disabled={isTranscribing || !selectedFile}
              >
                {isTranscribing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Transcribing...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Transcribe Video
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Transcription Result</CardTitle>
            <CardDescription>
              View and download your transcription in different formats.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transcriptionResult ? (
              <Tabs defaultValue="plain">
                <TabsList className="w-full">
                  <TabsTrigger value="plain" className="flex-1">Plain Text</TabsTrigger>
                  <TabsTrigger value="vtt" className="flex-1">VTT Format</TabsTrigger>
                </TabsList>
                <TabsContent value="plain" className="mt-4 space-y-4">
                  <Textarea 
                    value={transcriptionResult.plainText} 
                    readOnly 
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(transcriptionResult.plainText)}>
                      {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      {copied ? "Copied" : "Copy Text"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => downloadTranscription('txt')}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Text
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="vtt" className="mt-4 space-y-4">
                  <Textarea 
                    value={transcriptionResult.vttContent} 
                    readOnly 
                    className="min-h-[300px] font-mono text-sm"
                  />
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(transcriptionResult.vttContent)}>
                      {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      {copied ? "Copied" : "Copy VTT"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => downloadTranscription('vtt')}>
                      <Download className="h-4 w-4 mr-2" />
                      Download VTT
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-[300px] text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-20" />
                <p>No transcription yet.</p>
                <p className="text-sm mt-2">Upload a video and click "Transcribe Video" to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VideoTranscribePage;
