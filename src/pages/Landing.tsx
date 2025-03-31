
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { 
  ArrowRight, 
  FileAudio, 
  ChevronRight, 
  Zap, 
  MicVocal, 
  Globe, 
  Lock, 
  Stars,
  Check,
  Play,
  GraduationCap,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { Badge } from '@/components/ui/badge';

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <FileAudio className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              VoiceScribe
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#models" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              AI Models
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleTheme} 
              className="rounded-full"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-[1.2rem] w-[1.2rem]" />
              ) : (
                <Moon className="h-[1.2rem] w-[1.2rem]" />
              )}
            </Button>
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
                    Sign up free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-primary/5"></div>
        <div className="absolute inset-0 -z-10 opacity-30 bg-[radial-gradient(circle_at_center,rgba(0,213,255,0.15),transparent_65%)]"></div>
        
        <div className="container mx-auto px-4 text-center relative">
          <Badge variant="outline" className="mb-4 px-3 py-1 bg-primary/5 border-primary/20 text-primary">
            Powered by Advanced AI
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 max-w-4xl mx-auto leading-tight">
            Transform Speech to Text with <span className="text-primary">Unmatched Accuracy</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Compare results from multiple state-of-the-art AI models including OpenAI, Gemini, and Phi-4 to get the perfect transcript every time.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {isAuthenticated ? (
              <Button size="lg" asChild className="rounded-full px-8">
                <Link to="/app">
                  Open Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild className="rounded-full px-8">
                  <Link to="/signup">
                    Start Transcribing for Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="rounded-full">
                  <Link to="/demo">
                    <Play className="mr-2 h-4 w-4" />
                    Watch Demo
                  </Link>
                </Button>
              </>
            )}
          </div>
          
          <div className="relative">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary/30 to-primary/10 blur-sm"></div>
            <div className="w-full max-w-5xl mx-auto rounded-xl overflow-hidden shadow-2xl border relative z-10 bg-card">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src="/placeholder.svg" 
                  alt="VoiceScribe Dashboard" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Button size="lg" variant="outline" className="gap-2 border-white/20 bg-black/30 text-white hover:bg-black/50">
                    <Play className="h-5 w-5" />
                    See it in action
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              Free plan available
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              Secure processing
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              100+ languages supported
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4 px-3 py-1 bg-primary/5 border-primary/20 text-primary">
              Features
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for Perfect Transcriptions
            </h2>
            <p className="text-muted-foreground">
              Our platform combines the best AI technologies to deliver outstanding results for all your audio transcription needs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                <Stars className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Multiple AI Models</h3>
              <p className="text-muted-foreground">
                Compare transcriptions from OpenAI Whisper, Gemini 2.0 Flash, and Microsoft Phi-4 to get the best results.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                <MicVocal className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">High Accuracy</h3>
              <p className="text-muted-foreground">
                State-of-the-art speech recognition with support for multiple languages and accents.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">SharePoint Integration</h3>
              <p className="text-muted-foreground">
                Directly access and transcribe audio files from your SharePoint library.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Secure Processing</h3>
              <p className="text-muted-foreground">
                Your audio files are processed securely with end-to-end encryption.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                <FileAudio className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">VTT Format</h3>
              <p className="text-muted-foreground">
                Get your transcriptions in WebVTT format, perfect for adding subtitles to videos.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow">
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
      <section id="models" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4 px-3 py-1 bg-primary/5 border-primary/20 text-primary">
              AI Models
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              State-of-the-Art Speech Recognition
            </h2>
            <p className="text-muted-foreground">
              Compare results from multiple leading AI models to get the most accurate transcription.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-xl shadow-sm border relative overflow-hidden group hover:-translate-y-1 transition-transform">
              <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-6 -mt-6"></div>
              <h3 className="text-xl font-bold mb-3 flex items-center">
                <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" alt="OpenAI" className="h-6 w-6 mr-2" />
                OpenAI Whisper
              </h3>
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

            <div className="bg-card p-6 rounded-xl shadow-sm border relative overflow-hidden group hover:-translate-y-1 transition-transform">
              <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-6 -mt-6"></div>
              <h3 className="text-xl font-bold mb-3 flex items-center">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Google_Chrome_icon_%28February_2022%29.svg/800px-Google_Chrome_icon_%28February_2022%29.svg.png" alt="Google" className="h-6 w-6 mr-2" />
                Gemini 2.0 Flash
              </h3>
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

            <div className="bg-card p-6 rounded-xl shadow-sm border relative overflow-hidden group hover:-translate-y-1 transition-transform">
              <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-6 -mt-6"></div>
              <h3 className="text-xl font-bold mb-3 flex items-center">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Microsoft_logo.svg/800px-Microsoft_logo.svg.png" alt="Microsoft" className="h-6 w-6 mr-2" />
                Microsoft Phi-4
              </h3>
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

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4 px-3 py-1 bg-primary/5 border-primary/20 text-primary">
              Pricing
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground">
              Choose the plan that works best for your transcription needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-card p-6 rounded-xl shadow-sm border hover:shadow-md transition-all">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold mb-1">Free</h3>
                <div className="text-3xl font-bold">$0</div>
                <p className="text-sm text-muted-foreground">Forever free</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="ml-2">10 minutes of audio per month</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="ml-2">Access to OpenAI Whisper</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="ml-2">Basic export options</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="ml-2">Community support</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
            
            <div className="bg-card p-6 rounded-xl shadow-md border-2 border-primary relative hover:shadow-lg transition-all">
              <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">POPULAR</div>
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold mb-1">Pro</h3>
                <div className="text-3xl font-bold">$19<span className="text-base font-normal text-muted-foreground">/month</span></div>
                <p className="text-sm text-muted-foreground">Billed monthly or annually</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="ml-2">5 hours of audio per month</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="ml-2">All AI models included</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="ml-2">Advanced export options</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="ml-2">Priority support</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="ml-2">SharePoint integration</span>
                </li>
              </ul>
              <Button className="w-full" asChild>
                <Link to="/signup?plan=pro">Try Free for 14 Days</Link>
              </Button>
            </div>
            
            <div className="bg-card p-6 rounded-xl shadow-sm border hover:shadow-md transition-all">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold mb-1">Enterprise</h3>
                <div className="text-3xl font-bold">Custom</div>
                <p className="text-sm text-muted-foreground">For larger teams & organizations</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="ml-2">Unlimited audio processing</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="ml-2">Custom AI model training</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="ml-2">Advanced integrations</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="ml-2">Dedicated account manager</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="ml-2">SLA & compliance features</span>
                </li>
              </ul>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/contact-sales">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4 px-3 py-1 bg-primary/5 border-primary/20 text-primary">
              Testimonials
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by Industry Professionals
            </h2>
            <p className="text-muted-foreground">
              See what our customers have to say about VoiceScribe
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-xl shadow-sm border hover:-translate-y-1 transition-transform">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Stars key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-muted-foreground italic mb-4">
                "VoiceScribe has completely transformed our podcast production workflow. The multi-model comparison feature ensures we get the most accurate transcripts every time."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  JD
                </div>
                <div>
                  <p className="font-medium">James Davis</p>
                  <p className="text-sm text-muted-foreground">Podcast Producer</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card p-6 rounded-xl shadow-sm border hover:-translate-y-1 transition-transform">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Stars key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-muted-foreground italic mb-4">
                "The SharePoint integration saves us hours each week. We can now transcribe all our meeting recordings without leaving our enterprise environment."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  SJ
                </div>
                <div>
                  <p className="font-medium">Sarah Johnson</p>
                  <p className="text-sm text-muted-foreground">IT Director</p>
                </div>
              </div>
            </div>
            
            <div className="bg-card p-6 rounded-xl shadow-sm border hover:-translate-y-1 transition-transform">
              <div className="flex items-center gap-2 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Stars key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-muted-foreground italic mb-4">
                "As a teacher, I need accurate transcripts of lecture recordings. VoiceScribe's multi-language support and high accuracy has been a game-changer for my international students."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  ML
                </div>
                <div>
                  <p className="font-medium">Michael Lee</p>
                  <p className="text-sm text-muted-foreground">Professor</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="outline" className="mb-4 px-3 py-1 bg-primary/5 border-primary/20 text-primary">
              FAQ
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground">
              Find answers to common questions about VoiceScribe
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <div className="border rounded-lg bg-card overflow-hidden">
              <div className="p-4 font-medium">
                How accurate are the transcriptions?
              </div>
              <div className="px-4 pb-4 text-muted-foreground">
                Our AI models typically achieve 95%+ accuracy for clear audio. By comparing results from multiple models, you can achieve even higher accuracy for critical content.
              </div>
            </div>
            
            <div className="border rounded-lg bg-card overflow-hidden">
              <div className="p-4 font-medium">
                What file formats are supported?
              </div>
              <div className="px-4 pb-4 text-muted-foreground">
                VoiceScribe supports all common audio formats including MP3, WAV, M4A, FLAC, and more. You can also extract audio from video files like MP4 and MOV.
              </div>
            </div>
            
            <div className="border rounded-lg bg-card overflow-hidden">
              <div className="p-4 font-medium">
                Is my data secure?
              </div>
              <div className="px-4 pb-4 text-muted-foreground">
                Yes, all uploads are processed with end-to-end encryption. We do not store your audio files beyond the processing period, and you can opt to use the local Phi-4 model for complete privacy.
              </div>
            </div>
            
            <div className="border rounded-lg bg-card overflow-hidden">
              <div className="p-4 font-medium">
                Can I cancel my subscription anytime?
              </div>
              <div className="px-4 pb-4 text-muted-foreground">
                Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.
              </div>
            </div>
            
            <div className="border rounded-lg bg-card overflow-hidden">
              <div className="p-4 font-medium">
                How does the free trial work?
              </div>
              <div className="px-4 pb-4 text-muted-foreground">
                Our 14-day free trial gives you full access to all Pro features. No credit card is required to start, and you can downgrade to the Free plan if you choose not to continue.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_50%,rgba(0,0,0,0.2),transparent_70%)]"></div>
        
        <div className="container mx-auto px-4 text-center relative">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Audio into Text?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Join thousands of professionals who trust VoiceScribe for accurate, efficient transcriptions.
            </p>
            {isAuthenticated ? (
              <Button size="lg" variant="secondary" asChild className="rounded-full px-8">
                <Link to="/app">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <Button size="lg" variant="secondary" asChild className="rounded-full px-8">
                <Link to="/signup">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            )}
            <p className="mt-4 text-sm opacity-80">No credit card required</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <FileAudio className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xl font-bold">VoiceScribe</span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Advanced AI-powered audio transcription platform for professionals.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd"></path>
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"></path>
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="md:col-span-1">
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#models" className="text-muted-foreground hover:text-foreground transition-colors">AI Models</a></li>
                <li><a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">API</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div className="md:col-span-1">
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Guides</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Support</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Status</a></li>
              </ul>
            </div>
            
            <div className="md:col-span-1">
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">About</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} VoiceScribe. All rights reserved.
            </p>
            <div className="flex gap-8 text-sm">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Cookies Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
