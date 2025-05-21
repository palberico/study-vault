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
  Sparkles,
  X
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

export default function Sidebar({ courses, isExpanded, toggleSidebar }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const [showProInfoModal, setShowProInfoModal] = useState(false);
  const { user } = useAuth();
  
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
          "hidden lg:flex lg:flex-col bg-white h-[calc(100vh-57px)] sticky top-[57px] transition-all duration-300",
          isExpanded ? "w-64" : "w-16"
        )}
      >
        {/* Top section with navigation */}
        <div className="relative flex flex-col h-full px-3 py-4">
          {/* Toggle Button - Always at the top above dashboard */}
          <div className="mb-4 flex justify-center">
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
          
          <ScrollArea className="flex-grow">
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
              
              {/* Pro Features Icons */}
              <li className="mt-2">
                {!user?.isPro ? (
                  <Button
                    onClick={() => setShowProInfoModal(true)}
                    variant="ghost"
                    className={cn(
                      "w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md",
                      !isExpanded && "justify-center"
                    )}
                    aria-label="Unlock Pro features"
                  >
                    <Lock className={cn(
                      "w-5 h-5",
                      isExpanded ? "mr-3" : "",
                      "text-slate-400 hover:text-yellow-500"
                    )} />
                    {isExpanded && "Upgrade to Pro"}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md",
                        !isExpanded && "justify-center"
                      )}
                      aria-label="AI Assistant"
                    >
                      <Bot className={cn(
                        "w-5 h-5",
                        isExpanded ? "mr-3" : "",
                        "text-slate-500"
                      )} />
                      {isExpanded && "AI Assistant"}
                    </Button>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md",
                        !isExpanded && "justify-center"
                      )}
                      aria-label="Smart Suggestions"
                    >
                      <Lightbulb className={cn(
                        "w-5 h-5",
                        isExpanded ? "mr-3" : "",
                        "text-slate-500"
                      )} />
                      {isExpanded && "Suggestions"}
                    </Button>
                  </>
                )}
              </li>
            </ul>
          </ScrollArea>
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
        
        {/* Sidebar Content */}
        <div className="relative flex flex-col max-w-xs w-full h-full bg-white transition transform">
          {/* Close button */}
          <div className="absolute top-0 right-0 pt-2 px-2">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full h-8 w-8 p-0 flex items-center justify-center text-slate-500 hover:bg-slate-100"
              onClick={toggleSidebar}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Content - similar structure to desktop */}
          <ScrollArea className="flex-grow">
            <div className="px-3 py-4 mt-8">
              <ul className="space-y-1">
                <li>
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md"
                    onClick={() => { navigateTo("/"); toggleSidebar(); }}
                  >
                    <Home className="w-5 h-5 mr-3 text-slate-500" />
                    Dashboard
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md"
                    onClick={() => { navigateTo("/courses"); toggleSidebar(); }}
                  >
                    <BookOpen className="w-5 h-5 mr-3 text-slate-500" />
                    Courses
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md"
                    onClick={() => { navigateTo("/assignments"); toggleSidebar(); }}
                  >
                    <FileText className="w-5 h-5 mr-3 text-slate-500" />
                    Assignments
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md"
                    onClick={() => { navigateTo("/files"); toggleSidebar(); }}
                  >
                    <Folder className="w-5 h-5 mr-3 text-slate-500" />
                    All Files
                  </Button>
                </li>
                <li className="mt-2">
                  {!user?.isPro ? (
                    <Button
                      onClick={() => setShowProInfoModal(true)}
                      variant="ghost"
                      className="w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md"
                      aria-label="Unlock Pro features"
                    >
                      <Lock className="w-5 h-5 mr-3 text-slate-400 hover:text-yellow-500" />
                      Upgrade to Pro
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        className="w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md"
                        aria-label="AI Assistant"
                      >
                        <Bot className="w-5 h-5 mr-3 text-slate-500" />
                        AI Assistant
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md"
                        aria-label="Smart Suggestions"
                      >
                        <Lightbulb className="w-5 h-5 mr-3 text-slate-500" />
                        Suggestions
                      </Button>
                    </>
                  )}
                </li>
              </ul>
            </div>
          </ScrollArea>
        </div>
      </div>
      
      {/* Pro Info Modal */}
      {showProInfoModal && (
        <Dialog open={showProInfoModal} onOpenChange={setShowProInfoModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center text-xl font-bold">
                <Sparkles className="h-5 w-5 mr-2 text-yellow-400" />
                Unlock Pro Features
              </DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <p className="text-slate-600 mb-4">
                Upgrade to StudyVault Pro and unlock powerful features to enhance your academic experience:
              </p>
              
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="h-5 w-5 text-yellow-500 mr-2">•</div>
                  <span className="text-slate-700">Auto-generate assignments from your syllabus</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 text-yellow-500 mr-2">•</div>
                  <span className="text-slate-700">Advanced analytics powered by AI</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 text-yellow-500 mr-2">•</div>
                  <span className="text-slate-700">Unlimited file storage for all your courses</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 text-yellow-500 mr-2">•</div>
                  <span className="text-slate-700">AI-powered study recommendations</span>
                </li>
                <li className="flex items-start">
                  <div className="h-5 w-5 text-yellow-500 mr-2">•</div>
                  <span className="text-slate-700">Priority customer support</span>
                </li>
              </ul>
            </div>
            
            <DialogFooter>
              <Button
                onClick={() => {
                  setShowProInfoModal(false);
                  navigateTo("/my-account");
                }}
                className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white"
              >
                <Sparkles className="h-4 w-4 mr-2" /> Try Pro Now
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}