import { useState } from "react";
import { useLocation } from "wouter";
import { BookOpen, Menu, Search, Bell, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/assignments?search=${encodeURIComponent(searchTerm)}`);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getUserInitials = () => {
    if (!user?.email) return "?";
    const email = user.email;
    return email.charAt(0).toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm z-10">
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
            className="text-primary text-2xl font-bold flex items-center cursor-pointer"
            onClick={() => navigate("/")}
          >
            <BookOpen className="mr-2" />
            <span>StudyVault</span>
          </div>
        </div>
        
        {/* Search Input */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <Input
                type="text"
                className="block w-full pl-10 pr-3 py-2 rounded-md border border-slate-300"
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </form>
        </div>
        
        {/* User Menu */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5 text-slate-600" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar>
                  <AvatarFallback className="bg-primary text-white">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.email}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    My Account
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/")}>
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/courses")}>
                Courses
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/assignments")}>
                Assignments
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/files")}>
                Files
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
