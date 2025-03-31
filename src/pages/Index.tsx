import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Info } from "lucide-react";
import { requestNotificationPermission } from "@/lib/notifications";
import Header from '@/components/Header';
import { useAuth } from "@/lib/AuthContext";
import { Progress } from "@/components/ui/progress";
import UploadConfigStep from "@/components/funnel/UploadConfigStep";
import ResultsPublishStep from "@/components/funnel/ResultsPublishStep";

const Index = () => {
  // Main state
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedModels, setSelectedModels] = useState<string[]>(["openai", "gemini-2.0-flash", "phi4"]);
  const [videoId, setVideoId] = useState<string>("");
  const [selectedTranscription, setSelectedTranscription] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [transcriptionPrompt, setTranscriptionPrompt] = useState<string>("Please preserve all English words exactly as spoken");
  const [refreshJobsTrigger, setRefreshJobsTrigger] = useState<number>(0);
  
  // SharePoint and Queue state
  const [fileQueue, setFileQueue] = useState<File[]>([]);
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(0);
  
  // Prompt options state
  const [preserveEnglish, setPreserveEnglish] = useState<boolean>(true);
  const [outputFormat, setOutputFormat] = useState<"vtt" | "plain">("vtt");
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Processing state
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [transcriptions, setTranscriptions] = useState<Record<string, { vtt: string, prompt: string, loading: boolean }>>({
    openai: { vtt: "", prompt: "", loading: false },
    "gemini-2.0-flash": { vtt: "", prompt: "", loading: false },
    phi4: { vtt: "", prompt: "", loading: false }
  });
  
  // Funnel state
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [progress, setProgress] = useState<number>(50);

  // Auth state
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Request notification permission when notifications are enabled
  useEffect(() => {
    if (notificationsEnabled) {
      requestNotificationPermission().then(granted => {
        if (!granted) {
          toast({
            title: "Notification Permission Denied",
            description: "Please enable notifications in your browser settings to receive alerts.",
            variant: "destructive",
          });
          setNotificationsEnabled(false);
        }
      });
    }
  }, [notificationsEnabled, toast]);
  
  // Update progress based on step
  useEffect(() => {
    setProgress(currentStep === 0 ? 50 : 100);
  }, [currentStep]);

  // Handle navigation between steps
  const goToNextStep = () => {
    setCurrentStep(1);
  };

  const goToPreviousStep = () => {
    setCurrentStep(0);
  };
  
  // Update prompt based on options
  const updatePromptFromOptions = () => {
    let newPrompt = "";
    
    if (preserveEnglish) {
      newPrompt += "Please preserve all English words exactly as spoken. ";
    }
    
    if (outputFormat === "vtt") {
      newPrompt += "Generate output with timestamps in VTT format. ";
    } else {
      newPrompt += "Generate plain text without timestamps. ";
    }
    
    setTranscriptionPrompt(newPrompt.trim());
  };
  
  // When transcriptions are created
  const handleTranscriptionsCreated = (jobIds: string[]) => {
    console.log("Transcription jobs created, transitioning to next step", jobIds);
    setRefreshJobsTrigger(prev => prev + 1);
    goToNextStep();
  };
  
  // When a file is selected
  const handleFileSelected = (uploadedFile: File) => {
    console.log("File selected in Index:", uploadedFile.name);
    setFile(uploadedFile);
    const newAudioUrl = URL.createObjectURL(uploadedFile);
    setAudioUrl(newAudioUrl);
  };
  
  // When a transcription is selected from jobs or cards
  const handleSelectTranscription = (vtt: string, model: string) => {
    setSelectedTranscription(vtt);
    setSelectedModel(model);
  };
  
  return (
    <>
      <Header />
      <div className="container py-6">
        <div className="max-w-[1440px] mx-auto p-4 md:p-6">
          <header className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Transcription Pipeline
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm mb-6">
              Download MP3 files from SharePoint, transcribe with multiple AI models, and publish captions to Brightcove.
            </p>
            
            {/* Progress Bar */}
            <div className="w-full max-w-lg mx-auto mb-8">
              <div className="flex justify-between text-sm mb-1">
                <div className={`font-medium ${currentStep === 0 ? 'text-primary' : 'text-muted-foreground'}`}>1. Upload & Configure</div>
                <div className={`font-medium ${currentStep === 1 ? 'text-primary' : 'text-muted-foreground'}`}>2. Results & Publish</div>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            
            {/* Step instructions */}
            <div className="bg-muted/50 p-3 rounded-lg flex items-center justify-center max-w-2xl mx-auto mb-4">
              <Info className="h-4 w-4 text-muted-foreground mr-2" />
              <p className="text-sm text-muted-foreground">
                {currentStep === 0 
                  ? "Step 1: Upload your audio file and configure transcription settings"
                  : "Step 2: View transcription results and publish captions to Brightcove"}
              </p>
            </div>
          </header>
          
          {/* Funnel Steps */}
          <div className="animate-fade-in">
            {currentStep === 0 ? (
              <UploadConfigStep 
                onTranscriptionsCreated={handleTranscriptionsCreated}
                onStepComplete={goToNextStep}
              />
            ) : (
              <ResultsPublishStep
                selectedTranscription={selectedTranscription}
                selectedModel={selectedModel}
                videoId={videoId}
                setVideoId={setVideoId}
                handleSelectTranscription={handleSelectTranscription}
                isPublishing={isPublishing}
                setIsPublishing={setIsPublishing}
                refreshJobsTrigger={refreshJobsTrigger}
                file={file}
                audioUrl={audioUrl}
                goToPreviousStep={goToPreviousStep}
                selectedModels={selectedModels}
                transcriptions={transcriptions}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;
