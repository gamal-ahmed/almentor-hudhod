import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import { 
  Button,
  Card,
  CardContent,
} from "@/components/ui";
import { 
  Zap, 
  FileAudio, 
  MessageSquare, 
  Clock, 
  FileText, 
  Globe, 
  Settings, 
  Languages, 
  Download, 
  Check
} from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <HeroSection />
        
        {/* Feature Section */}
        <section className="py-16 px-4 bg-gradient-to-b from-background to-secondary/20">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">
                Hudhod: Transcription Reimagined
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Transform your audio with cutting-edge AI transcription technology
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: FileAudio,
                  title: "Multiple Formats Support",
                  description: "Process MP3, WAV, M4A, MP4, and other audio formats with ease"
                },
                {
                  icon: MessageSquare,
                  title: "AI-Powered Accuracy",
                  description: "Get industry-leading accuracy with our advanced AI models"
                },
                {
                  icon: Clock,
                  title: "Fast Processing",
                  description: "Get results in minutes, not hours, even for long recordings"
                },
                {
                  icon: FileText,
                  title: "Flexible Output",
                  description: "Export as VTT, SRT, plain text, or Word documents"
                },
                {
                  icon: Globe,
                  title: "Multi-Language Support",
                  description: "Transcribe content in over 40 languages with high accuracy"
                },
                {
                  icon: Settings,
                  title: "Custom Configurations",
                  description: "Fine-tune transcription settings for your specific needs"
                }
              ].map((feature, i) => (
                <Card key={i} className="elegant-card hover-lift overflow-hidden">
                  <CardContent className="p-6">
                    <div className="mb-4 p-2.5 rounded-lg bg-primary/10 text-primary inline-block">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-16 px-4 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full filter blur-3xl opacity-50"></div>
          </div>
          
          <div className="container mx-auto max-w-7xl relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">
                How It Works
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Three simple steps to perfect transcriptions
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Upload Audio",
                  description: "Upload your audio or video file in any common format"
                },
                {
                  step: "02",
                  title: "AI Processing",
                  description: "Our advanced AI models transcribe your content accurately"
                },
                {
                  step: "03",
                  title: "Download Results",
                  description: "Get your transcription in your preferred format"
                }
              ].map((step, i) => (
                <div key={i} className="relative flex flex-col items-center text-center">
                  {/* Number Background */}
                  <div className="absolute top-0 opacity-10 text-8xl font-bold text-primary -z-10">
                    {step.step}
                  </div>
                  
                  {/* Step Content */}
                  <div className="pt-8">
                    <h3 className="text-2xl font-medium mb-3">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                  
                  {/* Connector Line (except last one) */}
                  {i < 2 && (
                    <div className="hidden md:block absolute top-1/3 right-0 translate-x-1/2 w-16 border-t-2 border-dashed border-primary/30"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Pricing Banner */}
        <section className="py-16 px-4 bg-primary/5 border-y border-primary/10">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 p-8 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 backdrop-blur-sm border border-primary/10">
              <div className="text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Ready to get started?</h2>
                <p className="text-muted-foreground">Try Hudhod free for 14 days, no credit card required.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" variant="gradient" className="btn-glow">
                  <Link to="/signup">Start Free Trial</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-primary/30 hover:bg-primary/10 hover:text-primary">
                  <Link to="/pricing">View Pricing</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient">
                Trusted by Professionals
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See what our users have to say about Hudhod
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  quote: "Hudhod has become an essential tool for my podcasting workflow. The transcription quality is outstanding.",
                  author: "Sarah Johnson",
                  role: "Podcast Host"
                },
                {
                  quote: "As a journalist, accurate transcriptions are critical to my work. Hudhod delivers consistently excellent results.",
                  author: "Michael Chen",
                  role: "Investigative Reporter"
                },
                {
                  quote: "The multi-language support has been a game-changer for our international research team.",
                  author: "Dr. Elena Rodriguez",
                  role: "Research Director"
                }
              ].map((testimonial, i) => (
                <Card key={i} className="elegant-card hover-lift">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <svg width="45" height="36" className="text-primary/30" viewBox="0 0 45 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.5 18H9C9 12 14.4 6.6 20.4 4.8L22.2 7.8C17.4 9 13.8 13.2 13.8 18.6V19.8H18C19.2 19.8 20.4 21 20.4 22.2V31.8C20.4 33 19.2 34.2 18 34.2H9C7.8 34.2 6.6 33 6.6 31.8V22.2C6.6 21 7.8 19.8 9 19.8H13.5V18ZM37.5 18H33C33 12 38.4 6.6 44.4 4.8L46.2 7.8C41.4 9 37.8 13.2 37.8 18.6V19.8H42C43.2 19.8 44.4 21 44.4 22.2V31.8C44.4 33 43.2 34.2 42 34.2H33C31.8 34.2 30.6 33 30.6 31.8V22.2C30.6 21 31.8 19.8 33 19.8H37.5V18Z" fill="currentColor"/>
                      </svg>
                      <p className="text-foreground text-lg italic">"{testimonial.quote}"</p>
                      <div className="pt-4 border-t border-border/40">
                        <p className="font-medium">{testimonial.author}</p>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 px-4 bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gradient">
              Elevate Your Audio with Hudhod
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Experience precision transcription powered by advanced AI technology
            </p>
            <Button asChild size="lg" variant="gradient" className="rounded-full px-8 py-6 h-auto text-base btn-glow">
              <Link to="/signup">Start Your Hudhod Journey</Link>
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Landing;
