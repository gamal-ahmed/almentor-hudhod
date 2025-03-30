
import React, { useState, useEffect } from 'react';
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
  Menu, 
  X, 
  Headphones, 
  BarChart
} from 'lucide-react';

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animation delays for hero elements
  const [animationsTriggered, setAnimationsTriggered] = useState(false);
  useEffect(() => {
    setAnimationsTriggered(true);
  }, []);

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      {/* Navigation */}
      <header 
        className={`fixed w-full z-50 transition-all duration-300 ${
          scrolled ? 'bg-white/90 dark:bg-black/90 backdrop-blur-md shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <FileAudio className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">VoiceScribe</span>
          </div>
          
          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="#features" className="text-foreground hover:text-primary transition-colors font-medium">
              Features
            </Link>
            <Link to="#models" className="text-foreground hover:text-primary transition-colors font-medium">
              Models
            </Link>
            {isAuthenticated ? (
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link to="/app" className="flex items-center">
                  Go to App
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="outline" asChild className="font-medium">
                  <Link to="/signin">Sign in</Link>
                </Button>
                <Button asChild className="bg-primary hover:bg-primary/90">
                  <Link to="/signup" className="flex items-center">
                    Sign up
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </nav>
          
          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
        
        {/* Mobile Menu */}
        <div className={`md:hidden bg-white dark:bg-gray-900 shadow-md transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-60 py-4' : 'max-h-0 overflow-hidden'}`}>
          <div className="container flex flex-col space-y-4">
            <Link to="#features" className="text-foreground hover:text-primary transition-colors py-2 font-medium" onClick={() => setMobileMenuOpen(false)}>
              Features
            </Link>
            <Link to="#models" className="text-foreground hover:text-primary transition-colors py-2 font-medium" onClick={() => setMobileMenuOpen(false)}>
              Models
            </Link>
            {isAuthenticated ? (
              <Button asChild className="bg-primary hover:bg-primary/90 w-full">
                <Link to="/app" className="flex items-center justify-center">
                  Go to App
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <div className="flex flex-col gap-3">
                <Button variant="outline" asChild className="w-full">
                  <Link to="/signin">Sign in</Link>
                </Button>
                <Button asChild className="bg-primary hover:bg-primary/90 w-full">
                  <Link to="/signup" className="flex items-center justify-center">
                    Sign up
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 md:px-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-purple-100/30 to-transparent dark:from-purple-900/10"></div>
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className={`space-y-6 ${animationsTriggered ? 'animate-slide-up' : 'opacity-0'}`}>
              <div className="px-4 py-2 rounded-full border border-purple-300 inline-flex items-center space-x-2 bg-white/80 dark:bg-black/50 shadow-sm">
                <div className="bg-primary/10 h-4 w-4 rounded-full flex items-center justify-center">
                  <div className="bg-primary h-2 w-2 rounded-full animate-pulse"></div>
                </div>
                <span className="text-sm font-medium text-foreground/80">Transcription Made Simple</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
                Convert Speech to Text with <span className="text-gradient">AI Precision</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-xl">
                Choose from multiple state-of-the-art transcription models to get the most accurate results for any audio file.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {isAuthenticated ? (
                  <Button size="lg" asChild className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all">
                    <Link to="/app" className="flex items-center">
                      Open Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button size="lg" asChild className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all h-12">
                      <Link to="/signup" className="flex items-center">
                        Get Started for Free
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild className="border-2 h-12">
                      <Link to="/signin">Sign in</Link>
                    </Button>
                  </>
                )}
              </div>
              
              <div className="flex items-center pt-6 text-sm text-muted-foreground space-x-6">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span>Fast Processing</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span>High Accuracy</span>
                </div>
                <div className="hidden md:flex items-center">
                  <svg className="w-5 h-5 mr-2 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span>Multiple Languages</span>
                </div>
              </div>
            </div>
            
            <div className={`${animationsTriggered ? 'animate-slide-in-right animate-delay-2' : 'opacity-0'} relative flex justify-center`}>
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg blur-xl animate-pulse-subtle"></div>
              <div className="relative bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden w-full h-full max-w-xl">
                <div className="p-1 bg-gray-100 dark:bg-gray-800 flex space-x-1.5 items-center">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">VoiceScribe Dashboard</div>
                </div>
                <div className="p-4 relative overflow-hidden">
                  <img 
                    src="/placeholder.svg" 
                    alt="App interface" 
                    className="rounded-lg shadow-lg w-full object-cover animate-float"
                  />
                  <div className="absolute bottom-8 left-8 right-8 p-4 bg-white/90 dark:bg-gray-900/90 rounded-lg shadow-lg backdrop-blur-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-primary/10 text-primary">
                        <Headphones className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">Audio Transcription Complete</h3>
                        <p className="text-xs text-muted-foreground mt-1">Your file has been processed with 97% accuracy.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="px-4 py-8 rounded-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
              <div className="text-4xl font-bold text-primary">100+</div>
              <div className="text-sm text-muted-foreground mt-2">Languages Supported</div>
            </div>
            <div className="px-4 py-8 rounded-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
              <div className="text-4xl font-bold text-primary">98%</div>
              <div className="text-sm text-muted-foreground mt-2">Accuracy Rate</div>
            </div>
            <div className="px-4 py-8 rounded-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
              <div className="text-4xl font-bold text-primary">3</div>
              <div className="text-sm text-muted-foreground mt-2">AI Models</div>
            </div>
            <div className="px-4 py-8 rounded-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:shadow-md">
              <div className="text-4xl font-bold text-primary">24/7</div>
              <div className="text-sm text-muted-foreground mt-2">Available Service</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 md:px-0 bg-gradient-to-b from-background to-secondary/30">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-full inline-flex items-center mb-4">
              <Zap className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Powerful Features</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Everything You Need for Perfect Transcriptions
            </h2>
            <p className="text-muted-foreground">
              Our platform combines multiple AI models and powerful features to deliver the most accurate and efficient transcription experience.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Multiple AI Models</h3>
              <p className="text-muted-foreground">
                Compare transcriptions from OpenAI Whisper, Gemini 2.0 Flash, and Microsoft Phi-4 to get the best results.
              </p>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start text-sm">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Choose from 3 leading AI models</span>
                </li>
                <li className="flex items-start text-sm">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Compare results side by side</span>
                </li>
                <li className="flex items-start text-sm">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Select the most accurate transcription</span>
                </li>
              </ul>
            </div>

            <div className="group bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                <MicVocal className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">High Accuracy</h3>
              <p className="text-muted-foreground">
                State-of-the-art speech recognition with support for multiple languages and accents.
              </p>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start text-sm">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>98% accuracy for clean audio</span>
                </li>
                <li className="flex items-start text-sm">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Background noise filtering</span>
                </li>
                <li className="flex items-start text-sm">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Custom accent recognition</span>
                </li>
              </ul>
            </div>

            <div className="group bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">SharePoint Integration</h3>
              <p className="text-muted-foreground">
                Directly access and transcribe audio files from your SharePoint library.
              </p>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start text-sm">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Connect to SharePoint seamlessly</span>
                </li>
                <li className="flex items-start text-sm">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Batch process multiple files</span>
                </li>
                <li className="flex items-start text-sm">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Automatic file organization</span>
                </li>
              </ul>
            </div>

            <div className="group bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure Processing</h3>
              <p className="text-muted-foreground">
                Your audio files are processed securely with end-to-end encryption.
              </p>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start text-sm">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>End-to-end encryption</span>
                </li>
                <li className="flex items-start text-sm">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Automatic file deletion</span>
                </li>
                <li className="flex items-start text-sm">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>GDPR compliant data handling</span>
                </li>
              </ul>
            </div>

            <div className="group bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                <FileAudio className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">VTT Format</h3>
              <p className="text-muted-foreground">
                Get your transcriptions in WebVTT format, perfect for adding subtitles to videos.
              </p>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start text-sm">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Industry standard subtitle format</span>
                </li>
                <li className="flex items-start text-sm">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Precise timestamps</span>
                </li>
                <li className="flex items-start text-sm">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Compatible with major video platforms</span>
                </li>
              </ul>
            </div>

            <div className="group bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md">
              <div className="bg-primary/10 p-3 rounded-full w-fit mb-6 group-hover:bg-primary/20 transition-colors">
                <BarChart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Batch Processing</h3>
              <p className="text-muted-foreground">
                Process multiple audio files at once with our queue system for efficient workflow.
              </p>
              <ul className="mt-6 space-y-3">
                <li className="flex items-start text-sm">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Unlimited batch size</span>
                </li>
                <li className="flex items-start text-sm">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Background processing</span>
                </li>
                <li className="flex items-start text-sm">
                  <ChevronRight className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Email notifications when complete</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Models Section */}
      <section id="models" className="py-24 px-4 md:px-0 bg-background">
        <div className="container mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-full inline-flex items-center mb-4">
              <Zap className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">AI Technology</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Powered by Advanced AI Models
            </h2>
            <p className="text-muted-foreground">
              We leverage multiple state-of-the-art AI models to ensure you get the most accurate transcriptions possible.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-all group">
              <div className="h-40 bg-gradient-to-r from-purple-400 to-blue-500 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <img 
                    src="/placeholder.svg" 
                    alt="OpenAI Whisper" 
                    className="w-24 h-24 object-contain filter group-hover:brightness-110 transition-all"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white font-bold text-xl">OpenAI Whisper</div>
              </div>
              <div className="p-6">
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
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-all group">
              <div className="h-40 bg-gradient-to-r from-blue-400 to-emerald-500 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <img 
                    src="/placeholder.svg" 
                    alt="Gemini 2.0 Flash" 
                    className="w-24 h-24 object-contain filter group-hover:brightness-110 transition-all"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white font-bold text-xl">Gemini 2.0 Flash</div>
              </div>
              <div className="p-6">
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
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition-all group">
              <div className="h-40 bg-gradient-to-r from-indigo-500 to-purple-500 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <img 
                    src="/placeholder.svg" 
                    alt="Microsoft Phi-4" 
                    className="w-24 h-24 object-contain filter group-hover:brightness-110 transition-all"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white font-bold text-xl">Microsoft Phi-4</div>
              </div>
              <div className="p-6">
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
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-purple-700 text-white">
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Start Transcribing?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Create your free account today and start converting speech to text with our powerful AI models.
            </p>
            {isAuthenticated ? (
              <Button size="lg" variant="secondary" asChild className="h-12 px-8 bg-white text-primary hover:bg-white/90">
                <Link to="/app" className="flex items-center">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <Button size="lg" variant="secondary" asChild className="h-12 px-8 bg-white text-primary hover:bg-white/90">
                <Link to="/signup" className="flex items-center">
                  Get Started for Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            )}
            
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="flex flex-col items-center bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">Step 1</div>
                <p className="text-sm opacity-90">Upload your audio file</p>
              </div>
              <div className="flex flex-col items-center bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">Step 2</div>
                <p className="text-sm opacity-90">Select AI models</p>
              </div>
              <div className="flex flex-col items-center bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">Step 3</div>
                <p className="text-sm opacity-90">Get transcriptions</p>
              </div>
              <div className="flex flex-col items-center bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">Step 4</div>
                <p className="text-sm opacity-90">Publish or download</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileAudio className="h-5 w-5 text-primary" />
                <span className="font-bold text-lg">VoiceScribe</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Advanced AI-powered transcription for speech-to-text conversion with multiple models.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z"/>
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#models" className="text-muted-foreground hover:text-foreground transition-colors">AI Models</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Testimonials</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">API Reference</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">About Us</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t pt-8 mt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>© 2023 VoiceScribe. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
