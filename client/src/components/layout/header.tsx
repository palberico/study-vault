import { useState } from "react";
import { useLocation } from "wouter";
import { BookOpen, Menu, Search, Bell, LogOut, HelpCircle, User, GraduationCap } from "lucide-react";
import ProAvatar from "@/components/pro/pro-avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/assignments?search=${encodeURIComponent(searchTerm)}`);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getUserInitials = () => {
    if (user?.name) {
      return user.name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "?";
  };

  return (
    <header className="bg-white z-10">
      <div className="flex items-center justify-between px-4 py-3 lg:px-8">
        {/* Mobile Menu Button */}
        <button 
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-md text-slate-700 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div 
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              StudyVault
            </span>
          </div>
        </div>
        
        {/* Empty div to maintain spacing */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8"></div>
        
        {/* User Menu */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5 text-slate-600" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative p-0 h-10 w-10 rounded-full">
                <ProAvatar
                  initials={getUserInitials()}
                  isPro={user?.isPro || false}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name ? user.name : 'My Profile'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.school ? user.school : 'Manage your account'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/my-account")}>
                <User className="mr-2 h-4 w-4" />
                <span>My Account</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/")}>
                <BookOpen className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  // Show tutorial when Help is clicked
                  const modal = document.createElement('div');
                  modal.className = 'fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4';
                  modal.innerHTML = `
                    <div class="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
                      <h2 class="text-2xl font-bold text-center mb-4">Welcome to StudyVault!</h2>
                      <p class="text-center mb-6">Your personal academic repository that stays with you beyond graduation.</p>
                      
                      <div class="mb-6 space-y-4">
                        <div class="flex items-center gap-3">
                          <div class="bg-blue-100 p-2 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                          </div>
                          <div>
                            <h3 class="font-semibold">Organize by Courses</h3>
                            <p class="text-sm text-gray-600">Create courses to structure your academic work</p>
                          </div>
                        </div>
                        
                        <div class="flex items-center gap-3">
                          <div class="bg-green-100 p-2 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-600"><rect width="18" height="18" x="3" y="3" rx="2"></rect><path d="M3 9h18"></path><path d="M3 15h18"></path><path d="M9 3v18"></path><path d="M15 3v18"></path></svg>
                          </div>
                          <div>
                            <h3 class="font-semibold">Track Assignments</h3>
                            <p class="text-sm text-gray-600">Manage due dates and completion status</p>
                          </div>
                        </div>
                        
                        <div class="flex items-center gap-3">
                          <div class="bg-orange-100 p-2 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-orange-600"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m8 17 4 4 4-4"></path></svg>
                          </div>
                          <div>
                            <h3 class="font-semibold">Store Files</h3>
                            <p class="text-sm text-gray-600">Keep all your academic files organized</p>
                          </div>
                        </div>
                      </div>
                      
                      <div class="flex justify-center">
                        <button 
                          id="closeHelp"
                          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  `;
                  document.body.appendChild(modal);
                  
                  // Add event listener to close button
                  setTimeout(() => {
                    const closeButton = document.getElementById('closeHelp');
                    if (closeButton) {
                      closeButton.addEventListener('click', () => {
                        document.body.removeChild(modal);
                      });
                    }
                  }, 100);
                  
                  // Show success toast
                  toast({
                    title: "StudyVault Help",
                    description: "Here's a quick overview of the main features",
                  });
                }}
              >
                <HelpCircle className="mr-2 h-4 w-4 text-blue-600" />
                <span>Help</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
