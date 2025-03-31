
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileAudio, 
  Twitter, 
  Github, 
  Linkedin, 
  Heart 
} from 'lucide-react';

const Footer = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="border-t bg-gradient-to-r from-background to-secondary/30 backdrop-blur-sm mt-auto py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="p-1 rounded-md bg-primary/10">
                <FileAudio className="h-5 w-5 text-primary" />
              </div>
              <span className="text-lg font-bold text-gradient">VoiceScribe</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Advanced AI-powered audio transcription for professionals and content creators.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Product</h3>
            <ul className="space-y-2">
              <li><Link to="/features" className="text-sm text-muted-foreground hover:text-primary transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link to="/examples" className="text-sm text-muted-foreground hover:text-primary transition-colors">Examples</Link></li>
              <li><Link to="/changelog" className="text-sm text-muted-foreground hover:text-primary transition-colors">Changelog</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><Link to="/help" className="text-sm text-muted-foreground hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link to="/docs" className="text-sm text-muted-foreground hover:text-primary transition-colors">Documentation</Link></li>
              <li><Link to="/api" className="text-sm text-muted-foreground hover:text-primary transition-colors">API</Link></li>
              <li><Link to="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
              <li><Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {year} VoiceScribe. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground flex items-center mt-4 md:mt-0">
            Made with <Heart className="h-3 w-3 mx-1 text-red-500" /> by the VoiceScribe Team
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
