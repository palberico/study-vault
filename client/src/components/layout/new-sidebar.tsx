import React, { useState } from "react";
import { useLocation } from "wouter";
import { 
  Home, 
  BookOpen, 
  FileText, 
  Folder, 
  ChevronRight, 
  ChevronLeft,
  Lock,
  Lightbulb,
  Bot,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Course } from "@/lib/firebase";
import { cn } from "@/lib/utils";

interface SidebarProps {
  courses: Course[];
  isExpanded: boolean;
  toggleSidebar: () => void;
}

export default function NewSidebar({ courses, isExpanded, toggleSidebar }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const [showCourseForm, setShowCourseForm] = useState(false);
  
  // Check if a path is active
  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };
  
  // Generate course color based on course code
  const getCourseColor = (code: string) => {
    const colors = {
      "CS": "bg-blue-500",
      "MATH": "bg-green-500",
      "ENG": "bg-purple-500",
      "BIO": "bg-red-500",
      "PHYS": "bg-yellow-500",
      "HIST": "bg-indigo-500",
      "PSYCH": "bg-pink-500",
      "UNSY": "bg-cyan-500"
    };
    
    const prefix = code.split(' ')[0];
    for (const [key, color] of Object.entries(colors)) {
      if (prefix.startsWith(key)) {
        return color;
      }
    }
    
    return "bg-gray-500"; // Default color
  };
  
  // Navigation handler - just changes location without toggling sidebar
  const navigateTo = (path: string) => {
    setLocation(path);
  };
  
  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:block bg-white border-r border-slate-200 h-[calc(100vh-57px)] sticky top-[57px] overflow-y-auto transition-all duration-300",
          isExpanded ? "w-64" : "w-16"
        )}
      >
        <div className="h-full flex flex-col py-4">
          <div className="px-3 pb-2">
            {isExpanded && (
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 px-2">
                Main
              </div>
            )}
            <ul className="space-y-1">
              <li>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md",
                    isActive('/') 
                      ? "bg-primary text-white" 
                      : "text-slate-700 hover:bg-slate-100",
                    !isExpanded && "justify-center"
                  )}
                  onClick={() => navigateTo("/")}
                >
                  <Home className={cn(
                    "w-5 h-5",
                    isExpanded ? "mr-3" : "",
                    isActive('/') ? "text-white" : "text-slate-500"
                  )} />
                  {isExpanded && "Dashboard"}
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md",
                    isActive('/courses') 
                      ? "bg-primary text-white" 
                      : "text-slate-700 hover:bg-slate-100",
                    !isExpanded && "justify-center"
                  )}
                  onClick={() => navigateTo("/courses")}
                >
                  <BookOpen className={cn(
                    "w-5 h-5",
                    isExpanded ? "mr-3" : "",
                    isActive('/courses') ? "text-white" : "text-slate-500"
                  )} />
                  {isExpanded && "Courses"}
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md",
                    isActive('/assignments') 
                      ? "bg-primary text-white" 
                      : "text-slate-700 hover:bg-slate-100",
                    !isExpanded && "justify-center"
                  )}
                  onClick={() => navigateTo("/assignments")}
                >
                  <FileText className={cn(
                    "w-5 h-5",
                    isExpanded ? "mr-3" : "",
                    isActive('/assignments') ? "text-white" : "text-slate-500"
                  )} />
                  {isExpanded && "Assignments"}
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md",
                    isActive('/files') 
                      ? "bg-primary text-white" 
                      : "text-slate-700 hover:bg-slate-100",
                    !isExpanded && "justify-center"
                  )}
                  onClick={() => navigateTo("/files")}
                >
                  <Folder className={cn(
                    "w-5 h-5",
                    isExpanded ? "mr-3" : "",
                    isActive('/files') ? "text-white" : "text-slate-500"
                  )} />
                  {isExpanded && "All Files"}
                </Button>
              </li>
            </ul>
          </div>
          
          {/* Removed courses section as requested */}
          
          {/* Simple divider - no Add Course button */}
          <div className="pt-4 border-t border-slate-200 px-3"></div>
          
          {/* Toggle Button */}
          <div className="pt-4 flex justify-center">
            <Button
              onClick={toggleSidebar}
              variant="ghost"
              size="sm"
              className="rounded-full h-8 w-8 p-0 flex items-center justify-center text-slate-500 hover:bg-slate-100"
              aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isExpanded ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar (slide-in) */}
      <div className={cn(
        "fixed inset-0 z-40 lg:hidden",
        isExpanded ? "block" : "hidden"
      )}>
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-slate-600 bg-opacity-75 transition-opacity"
          onClick={toggleSidebar}
        ></div>
        
        {/* Sidebar */}
        <div className="relative flex flex-col max-w-xs w-full h-full bg-white pt-5 pb-4 transition transform">
          <div className="absolute top-0 right-0 pt-2 px-2">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full h-8 w-8 p-0 flex items-center justify-center text-slate-500 hover:bg-slate-100"
              onClick={toggleSidebar}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="px-3 pb-2 mt-5">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 px-2">
              Main
            </div>
            <ul className="space-y-1">
              <li>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md",
                    isActive('/') 
                      ? "bg-primary text-white" 
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                  onClick={() => {
                    navigateTo("/");
                    toggleSidebar();
                  }}
                >
                  <Home className={cn(
                    "w-5 h-5 mr-3",
                    isActive('/') ? "text-white" : "text-slate-500"
                  )} />
                  Dashboard
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md",
                    isActive('/courses') 
                      ? "bg-primary text-white" 
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                  onClick={() => {
                    navigateTo("/courses");
                    toggleSidebar();
                  }}
                >
                  <BookOpen className={cn(
                    "w-5 h-5 mr-3",
                    isActive('/courses') ? "text-white" : "text-slate-500"
                  )} />
                  Courses
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md",
                    isActive('/assignments') 
                      ? "bg-primary text-white" 
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                  onClick={() => {
                    navigateTo("/assignments");
                    toggleSidebar();
                  }}
                >
                  <FileText className={cn(
                    "w-5 h-5 mr-3",
                    isActive('/assignments') ? "text-white" : "text-slate-500"
                  )} />
                  Assignments
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md",
                    isActive('/files') 
                      ? "bg-primary text-white" 
                      : "text-slate-700 hover:bg-slate-100"
                  )}
                  onClick={() => {
                    navigateTo("/files");
                    toggleSidebar();
                  }}
                >
                  <Folder className={cn(
                    "w-5 h-5 mr-3",
                    isActive('/files') ? "text-white" : "text-slate-500"
                  )} />
                  All Files
                </Button>
              </li>
            </ul>
          </div>
          
          {/* Removed courses section as requested */}
          
          {/* Simple divider - no Add Course button */}
          <div className="pt-4 border-t border-slate-200 px-3"></div>
        </div>
      </div>
    </>
  );
}