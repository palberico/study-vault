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
                    "w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100",
                    !isExpanded && "justify-center"
                  )}
                  onClick={() => navigateTo("/")}
                >
                  <div className={cn(
                    "relative flex items-center",
                    (isActive('/') || isActive('/dashboard')) && "border-b-2 border-purple-500 pb-1"
                  )}>
                    <Home className={cn(
                      "w-5 h-5 text-slate-500",
                      isExpanded ? "mr-3" : ""
                    )} />
                  </div>
                  {isExpanded && "Dashboard"}
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100",
                    !isExpanded && "justify-center"
                  )}
                  onClick={() => navigateTo("/courses")}
                >
                  <div className={cn(
                    "relative",
                    isActive('/courses') && "border-b-2 border-purple-500 pb-1"
                  )}>
                    <BookOpen className={cn(
                      "w-5 h-5 text-slate-500",
                      isExpanded ? "mr-3" : ""
                    )} />
                  </div>
                  {isExpanded && "Courses"}
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100",
                    !isExpanded && "justify-center"
                  )}
                  onClick={() => navigateTo("/assignments")}
                >
                  <div className={cn(
                    "relative",
                    isActive('/assignments') && "border-b-2 border-purple-500 pb-1"
                  )}>
                    <FileText className={cn(
                      "w-5 h-5 text-slate-500",
                      isExpanded ? "mr-3" : ""
                    )} />
                  </div>
                  {isExpanded && "Assignments"}
                </Button>
              </li>
              <li>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100",
                    !isExpanded && "justify-center"
                  )}
                  onClick={() => navigateTo("/files")}
                >
                  <div className={cn(
                    "relative",
                    isActive('/files') && "border-b-2 border-purple-500 pb-1"
                  )}>
                    <Folder className={cn(
                      "w-5 h-5 text-slate-500",
                      isExpanded ? "mr-3" : ""
                    )} />
                  </div>
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
                    {isExpanded && "Unlock Pro"}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100",
                      !isExpanded && "justify-center"
                    )}
                    onClick={() => navigateTo("/pro-dashboard")}
                    aria-label="AI Assistant"
                  >
                    <div className={cn(
                      "relative",
                      isActive('/pro-dashboard') && "border-b-2 border-purple-500 pb-1"
                    )}>
                      <Bot className={cn(
                        "w-5 h-5 text-slate-500",
                        isExpanded ? "mr-3" : ""
                      )} />
                    </div>
                    {isExpanded && "AI Assistant"}
                  </Button>
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
                    className="w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100"
                    onClick={() => { navigateTo("/"); toggleSidebar(); }}
                  >
                    <div className={cn(
                      "relative flex items-center",
                      (isActive('/') || isActive('/dashboard')) && "border-b-2 border-purple-500 pb-1"
                    )}>
                      <Home className="w-5 h-5 mr-3 text-slate-500" />
                    </div>
                    Dashboard
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100"
                    onClick={() => { navigateTo("/courses"); toggleSidebar(); }}
                  >
                    <div className={cn(
                      "relative",
                      isActive('/courses') && "border-b-2 border-purple-500 pb-1"
                    )}>
                      <BookOpen className="w-5 h-5 mr-3 text-slate-500" />
                    </div>
                    Courses
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100"
                    onClick={() => { navigateTo("/assignments"); toggleSidebar(); }}
                  >
                    <div className={cn(
                      "relative",
                      isActive('/assignments') && "border-b-2 border-purple-500 pb-1"
                    )}>
                      <FileText className="w-5 h-5 mr-3 text-slate-500" />
                    </div>
                    Assignments
                  </Button>
                </li>
                <li>
                  <Button
                    variant="ghost"
                    className="w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100"
                    onClick={() => { navigateTo("/files"); toggleSidebar(); }}
                  >
                    <div className={cn(
                      "relative",
                      isActive('/files') && "border-b-2 border-purple-500 pb-1"
                    )}>
                      <Folder className="w-5 h-5 mr-3 text-slate-500" />
                    </div>
                    All Files
                  </Button>
                </li>
                <li className="mt-2">
                  {!user?.isPro ? (
                    <Button
                      onClick={() => { setShowProInfoModal(true); toggleSidebar(); }}
                      variant="ghost"
                      className="w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md"
                      aria-label="Unlock Pro features"
                    >
                      <Lock className="w-5 h-5 mr-3 text-slate-400 hover:text-yellow-500" />
                      Unlock Pro
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className="w-full flex items-center justify-start px-2 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100"
                      onClick={() => { navigateTo("/pro-dashboard"); toggleSidebar(); }}
                      aria-label="AI Assistant"
                    >
                      <div className={cn(
                        "relative",
                        isActive('/pro-dashboard') && "border-b-2 border-purple-500 pb-1"
                      )}>
                        <Bot className="w-5 h-5 mr-3 text-slate-500" />
                      </div>
                      AI Assistant
                    </Button>
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