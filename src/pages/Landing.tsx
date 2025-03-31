
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { ArrowRight, FileAudio, ChevronRight, Zap, MicVocal, Globe, Lock } from 'lucide-react';

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <FileAudio className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">VoiceScribe</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link to="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link to="#models" className="text-muted-foreground hover:text-foreground transition-colors">
              Models
            </Link>
            {isAuthenticated ? (
              <Button asChild>
                <Link to="/app">
                  Go to App
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="outline" asChild>
                  <Link to="/signin">Sign in</Link>
                </Button>
                <Button asChild>
                  <Link to="/signup">
                    Sign up
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-muted py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Transcribe Audio with Advanced AI
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Convert speech to text with incredible accuracy using multiple state-of-the-art AI models including OpenAI, Gemini, and Phi-4.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {isAuthenticated ? (
              <Button size="lg" asChild>
                <Link to="/app">
                  Open App Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link to="/signup">
                    Get Started for Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/signin">Sign in</Link>
                </Button>
              </>
            )}
          </div>
          <div className="relative">
            <div className="w-full max-w-4xl mx-auto rounded-xl overflow-hidden shadow-2xl">
              <img 
                src="/placeholder.svg" 
                alt="App Screenshot" 
                className="w-full h-auto"
                style={{ aspectRatio: "16/9" }}
              />
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <p className="text-white text-xl">Powerful transcription interface</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Powerful Transcription Features
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Multiple AI Models</h3>
              <p className="text-muted-foreground">
                Compare transcriptions from OpenAI Whisper, Gemini 2.0 Flash, and Microsoft Phi-4 to get the best results.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                <MicVocal className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">High Accuracy</h3>
              <p className="text-muted-foreground">
                State-of-the-art speech recognition with support for multiple languages and accents.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">SharePoint Integration</h3>
              <p className="text-muted-foreground">
                Directly access and transcribe audio files from your SharePoint library.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Secure Processing</h3>
              <p className="text-muted-foreground">
                Your audio files are processed securely with end-to-end encryption.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                <FileAudio className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">VTT Format</h3>
              <p className="text-muted-foreground">
                Get your transcriptions in WebVTT format, perfect for adding subtitles to videos.
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Batch Processing</h3>
              <p className="text-muted-foreground">
                Process multiple audio files at once with our queue system for efficient workflow.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Models Section */}
      <section id="models" className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Advanced AI Models
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <h3 className="text-xl font-bold mb-2">OpenAI Whisper</h3>
              <p className="text-muted-foreground mb-4">
                Industry-leading speech recognition system with excellent accuracy across multiple languages.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Supports 100+ languages</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Robust to background noise</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Excellent for complex audio</span>
                </li>
              </ul>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <h3 className="text-xl font-bold mb-2">Gemini 2.0 Flash</h3>
              <p className="text-muted-foreground mb-4">
                Google's latest multimodal AI with advanced speech recognition capabilities.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Ultra-fast processing</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Multi-speaker detection</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Context-aware transcription</span>
                </li>
              </ul>
            </div>

            <div className="bg-card p-6 rounded-lg shadow-sm border">
              <h3 className="text-xl font-bold mb-2">Microsoft Phi-4</h3>
              <p className="text-muted-foreground mb-4">
                Cutting-edge model that runs directly in your browser for privacy and speed.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>No server processing required</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Complete data privacy</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Works offline</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Transcribing?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Create your free account today and start converting speech to text with our powerful AI models.
          </p>
          {isAuthenticated ? (
            <Button size="lg" variant="secondary" asChild>
              <Link to="/app">
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <Button size="lg" variant="secondary" asChild>
              <Link to="/signup">
                Get Started for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <FileAudio className="h-5 w-5 text-primary" />
              <span className="font-bold">VoiceScribe</span>
            </div>
            <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center text-sm text-muted-foreground">
              <Link to="#" className="hover:text-foreground">Terms of Service</Link>
              <Link to="#" className="hover:text-foreground">Privacy Policy</Link>
              <p>© 2023 VoiceScribe. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
