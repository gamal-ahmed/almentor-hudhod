
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button"; 
import HeroSection from '@/components/HeroSection';
import FeatureCard from '@/components/FeatureCard';
import { Header } from '@/components/Header';
import Footer from '@/components/Footer';
import { FileAudio, BarChart, Globe } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <HeroSection />
        
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard 
                title="Multiple AI Models" 
                description="Compare transcriptions from different AI models to get the best results."
                icon={FileAudio} 
              />
              
              <FeatureCard 
                title="Analytics Dashboard" 
                description="Track usage, accuracy, and performance metrics across all transcriptions."
                icon={BarChart} 
              />
              
              <FeatureCard 
                title="Global Publishing" 
                description="Seamlessly publish captions to Brightcove and other video platforms."
                icon={Globe} 
              />
            </div>
            
            <div className="mt-12 text-center">
              <Link to="/signin">
                <Button size="lg" className="mr-4">
                  Get Started
                </Button>
              </Link>
              <Link to="/app">
                <Button variant="outline" size="lg">
                  Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Landing;
