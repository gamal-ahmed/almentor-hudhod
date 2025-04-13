
import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import FeatureCard from '@/components/FeatureCard';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';

const Landing = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <HeroSection />

        <section className="py-12 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-semibold text-gray-800 dark:text-white mb-8">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                title="AI-Powered Transcription"
                description="Leverage advanced AI to convert audio to text with high accuracy."
                icon="ai"
              />
              <FeatureCard
                title="Multi-Format Support"
                description="Supports a wide range of audio and video formats for flexible transcription."
                icon="format"
              />
              <FeatureCard
                title="Real-time Editing"
                description="Edit and refine transcriptions in real-time for perfect results."
                icon="edit"
              />
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-semibold text-gray-800 dark:text-white mb-8">
              Get Started Today
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Start transcribing your audio files with ease. Sign up now and get a free trial!
            </p>
            <div className="flex justify-center">
              <Button asChild size="lg">
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Landing;
