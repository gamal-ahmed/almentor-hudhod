
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { FileAudio, LogOut, User, History } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <FileAudio className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">VoiceScribe</span>
          </Link>
          
          {user && (
            <nav className="hidden md:flex items-center gap-4">
              <Link 
                to="/app" 
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary", 
                  isActive('/app') ? "text-primary" : "text-muted-foreground"
                )}
              >
                Transcribe
              </Link>
              <Link 
                to="/app/history" 
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary", 
                  isActive('/app/history') || location.pathname.includes('/app/transcription/') 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}
              >
                History
              </Link>
            </nav>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {user && (
            <>
              <div className="hidden md:flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{user.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
              <div className="md:hidden">
                <Link to="/app/history">
                  <Button variant="ghost" size="icon">
                    <History className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
