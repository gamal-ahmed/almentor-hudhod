
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { 
  FileAudio, 
  LogOut, 
  User, 
  Sun, 
  Moon, 
  Home, 
  History, 
  HelpCircle 
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Badge } from '@/components/ui/badge';

export default function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-1.5 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <FileAudio className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              VoiceScribe
            </span>
          </Link>
          
          {user && (
            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link to="/app">
                    <NavigationMenuLink
                      className={cn(
                        "px-3 py-2 text-sm rounded-md inline-flex items-center gap-1.5 transition-colors",
                        isActive("/app") 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      <Home className="h-4 w-4" />
                      Dashboard
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger
                    className={cn(
                      "px-3 py-2 text-sm rounded-md",
                      isActive("/history") && "bg-primary/10 text-primary font-medium"
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <History className="h-4 w-4" />
                      History
                    </span>
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="bg-popover/95 backdrop-blur-sm">
                    <ul className="grid w-[220px] p-2 gap-1">
                      <li>
                        <Link to="/history/recent" className="block">
                          <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                            <div className="text-sm font-medium">Recent Sessions</div>
                            <div className="line-clamp-2 text-xs text-muted-foreground">View your recent transcription sessions</div>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                      <li>
                        <Link to="/history/favorites" className="block">
                          <NavigationMenuLink className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground">
                            <div className="text-sm font-medium">Favorites</div>
                            <div className="line-clamp-2 text-xs text-muted-foreground">Access your saved transcriptions</div>
                          </NavigationMenuLink>
                        </Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link to="/help">
                    <NavigationMenuLink
                      className={cn(
                        "px-3 py-2 text-sm rounded-md inline-flex items-center gap-1.5 transition-colors",
                        isActive("/help") 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      <HelpCircle className="h-4 w-4" />
                      Help
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          )}
        </div>
        
        <div className="flex items-center gap-3">
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
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="gap-2">
                  <User className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline line-clamp-1 max-w-28">
                    {user.email?.split('@')[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="flex justify-between">
                  <span>Plan</span>
                  <Badge variant="outline" className="bg-primary/10 text-primary text-xs">Free</Badge>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account/settings">Profile Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account/billing">Billing</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/signin">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
