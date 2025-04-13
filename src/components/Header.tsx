import {
  Home,
  Film,
  BarChart3,
  AudioLines,
  ChevronDown,
  User,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMobile } from "@/hooks/useMobile";

export function Header() {
  const { isAuthenticated, user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const path = useLocation().pathname;
  
  const handleSignOut = async () => {
    await signOut();
    navigate("/signin");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Link to="/" className="flex items-center gap-2 font-bold mr-6">
          <AudioLines className="h-6 w-6" />
          <span className="hidden md:inline-block">Transcription Tool</span>
        </Link>
        
        {isAuthenticated && (
          <nav className="flex-1 flex items-center justify-between">
            <div className="flex gap-2">
              <Button 
                asChild 
                variant={path === "/app" ? "default" : "ghost"}
                size={isMobile ? "icon" : "default"}
              >
                <Link to="/app">
                  {isMobile ? <Home className="h-5 w-5" /> : "Dashboard"}
                </Link>
              </Button>
              <Button 
                asChild 
                variant={path.includes("/brightcove-captions-manager") ? "default" : "ghost"}
                size={isMobile ? "icon" : "default"}
              >
                <Link to="/brightcove-captions-manager">
                  {isMobile ? <Film className="h-5 w-5" /> : "Video Captions"}
                </Link>
              </Button>
              
              {/* Add Admin Analytics Link - Only visible to admins */}
              {isAdmin && (
                <Button 
                  asChild 
                  variant={path.includes("/admin/analytics") ? "default" : "ghost"}
                  size={isMobile ? "icon" : "default"}
                >
                  <Link to="/admin/analytics">
                    {isMobile ? <BarChart3 className="h-5 w-5" /> : "Analytics"}
                  </Link>
                </Button>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email || "Avatar"} />
                    <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="absolute bottom-1.5 right-1 h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel>
                  {user?.user_metadata?.full_name || user?.email || "User"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Support</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        )}
      </div>
    </header>
  );
}
