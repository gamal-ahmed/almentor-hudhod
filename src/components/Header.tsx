import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/AuthContext";
import { Menu, X, Home, FileText, Film } from "lucide-react";
import { cn } from "@/lib/utils";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navigation = [
    { name: 'Home', href: '/app', icon: Home, current: isActive('/app') },
    { name: 'Sessions', href: '/app', icon: FileText, current: isActive('/app') },
    { name: 'Brightcove Captions', href: '/brightcove-captions-manager', icon: Film, current: isActive('/brightcove-captions-manager') },
  ];

  return (
    <header className="bg-background border-b">
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-2">
            <img className="h-8 w-auto" src="/placeholder.svg" alt="Logo" />
            <span className="font-semibold tracking-tight">Transcription Service</span>
          </Link>
        </div>
        
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Open main menu</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        
        <div className="hidden lg:flex lg:gap-x-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "text-sm font-semibold flex items-center gap-1 px-3 py-2 rounded-md",
                item.current 
                  ? "bg-primary text-primary-foreground" 
                  : "hover:bg-muted"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          ))}
        </div>
        
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {user.email}
              </div>
              <Avatar>
                <AvatarFallback>
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" onClick={signOut}>
                Sign out
              </Button>
            </div>
          ) : (
            <Link to="/signin">
              <Button variant="outline">Sign in</Button>
            </Link>
          )}
        </div>
      </nav>
      
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
          <div className="fixed inset-0 flex">
            <div className="w-full">
              <div className="flex h-16 items-center justify-between px-6">
                <Link to="/" className="-m-1.5 p-1.5 flex items-center gap-2">
                  <img className="h-8 w-auto" src="/placeholder.svg" alt="Logo" />
                  <span className="font-semibold tracking-tight">Transcription Service</span>
                </Link>
                <button
                  type="button"
                  className="-m-2.5 p-2.5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close menu</span>
                  <X className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <div className="py-6 px-6 space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "block text-sm font-semibold flex items-center gap-2 px-3 py-2 rounded-md",
                      item.current 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                ))}
                {user && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-4" 
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Sign out
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
