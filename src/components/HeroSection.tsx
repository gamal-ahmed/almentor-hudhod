
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Sparkles, FileAudio, ArrowRight, Check } from 'lucide-react';

const HeroSection = () => {
  return (
    <div className="relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 pattern-bg opacity-50 -z-10"></div>
      
      {/* Gradient Orbs */}
      <div className="absolute top-20 -left-20 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl opacity-30 animate-pulse-subtle"></div>
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-accent/20 rounded-full filter blur-3xl opacity-30 animate-pulse-subtle"></div>
      
      <div className="container max-w-7xl mx-auto px-4 py-12 md:py-20">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 animate-fade-in">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Powered Audio Transcription</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-gradient animate-fade-in">
            Transform Speech to Text with Precision
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 animate-fade-in">
            Convert any audio to accurate, formatted text using our state-of-the-art AI transcription technology. 
            Compare multiple models to get the perfect results.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-12 animate-fade-in">
            <Button asChild size="lg" className="btn-glow bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all duration-300 group">
              <Link to="/app">
                Start Transcribing
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-primary/30 hover:bg-primary/10 hover:text-primary transition-all duration-300">
              <Link to="/examples">
                <FileAudio className="mr-2 h-4 w-4" />
                View Examples
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 w-full max-w-3xl mx-auto">
            {[
              { title: "Multiple AI Models", description: "Compare results from different transcription engines" },
              { title: "99% Accuracy", description: "Industry-leading precision for your transcriptions" },
              { title: "Format Ready", description: "Get VTT, SRT or plain text with automatic formatting" }
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-2 text-left animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="mt-1 bg-primary/10 rounded-full p-1">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
