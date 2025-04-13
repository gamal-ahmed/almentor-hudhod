import React from 'react';
import { Link } from 'react-router-dom'; 
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header'; // Import as named export
import { FileQueue } from '@/components/FileQueue';
import { SessionHistory } from '@/components/session-history/SessionHistory';

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <section className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to your transcription dashboard. Here you can manage your files and view session history.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Transcription Queue</h2>
          <FileQueue />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Session History</h2>
          <SessionHistory />
        </section>
      </main>

      <footer className="container mx-auto px-4 py-4 text-center text-muted-foreground border-t">
        <p>
          <Link to="/" className="hover:underline">
            Hudhod
          </Link>{" "}
          - AI Transcription Tool
        </p>
      </footer>
    </div>
  );
};

export default Index;
