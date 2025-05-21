import { useLocation } from "wouter";
import { Link } from "wouter";
import { Course } from "@/lib/firebase";
import { 
  Home, 
  BookOpen, 
  FileText, 
  Folder, 
  Plus, 
  X,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  Lock,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import CourseForm from "@/components/course/course-form";
import { useAuth } from "@/hooks/use-auth";
// import ProInfoModal from "@/components/pro/pro-info-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sparkles } from "lucide-react";

interface SidebarProps {
  courses: Course[];
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export default function Sidebar({ courses, isOpen, onClose, onToggle }: SidebarProps) {
  const [location, navigate] = useLocation();
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showProInfoModal, setShowProInfoModal] = useState(false);
  const { user } = useAuth();
  
  // Debug user info
  useEffect(() => {
    if (user) {
      console.log("Sidebar user:", user);
      console.log("User isPro status:", user.isPro);
    }
  }, [user]);
  
  // Function to handle navigation without toggling sidebar
  const handleNavigation = (to: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(to);
  };
  
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
      "PSYCH": "bg-pink-500"
    };
    
    const prefix = code.split(' ')[0];
    for (const [key, color] of Object.entries(colors)) {
      if (prefix.startsWith(key)) {
        return color;
      }
    }
    
    return "bg-gray-500"; // Default color
  };
  
  // Content is shown when sidebar is open
  const showContent = isOpen;
  
  // Sidebar for larger screens (fixed)
  const sidebarContent = (
    <nav className={cn("py-6 space-y-6", showContent ? "px-4" : "px-2")}>
      <div>
        {showContent && (
          <div className="px-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Main
          </div>
        )}
        <ul className="space-y-1">
          <li>
            <div 
              onClick={handleNavigation("/")}
              className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer",
                isActive('/') 
                  ? "bg-primary text-white" 
                  : "text-slate-700 hover:bg-slate-100",
                !showContent && "justify-center"
              )}
            >
              <Home className={cn(
                "w-5 h-5",
                showContent ? "mr-3" : "",
                isActive('/') ? "text-white" : "text-slate-500"
              )} />
              {showContent && "Dashboard"}
            </div>
          </li>
          <li>
            <div 
              onClick={handleNavigation("/courses")}
              className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer",
                isActive('/courses') 
                  ? "bg-primary text-white" 
                  : "text-slate-700 hover:bg-slate-100",
                !showContent && "justify-center"
              )}
            >
              <BookOpen className={cn(
                "w-5 h-5",
                showContent ? "mr-3" : "",
                isActive('/courses') ? "text-white" : "text-slate-500"
              )} />
              {showContent && "Courses"}
            </div>
          </li>
          <li>
            <div 
              onClick={handleNavigation("/assignments")}
              className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer",
                isActive('/assignments') 
                  ? "bg-primary text-white" 
                  : "text-slate-700 hover:bg-slate-100",
                !showContent && "justify-center"
              )}
            >
              <FileText className={cn(
                "w-5 h-5",
                showContent ? "mr-3" : "",
                isActive('/assignments') ? "text-white" : "text-slate-500"
              )} />
              {showContent && "Assignments"}
            </div>
          </li>
          <li>
            <div 
              onClick={handleNavigation("/files")}
              className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer",
                isActive('/files') 
                  ? "bg-primary text-white" 
                  : "text-slate-700 hover:bg-slate-100",
                !showContent && "justify-center"
              )}
            >
              <Folder className={cn(
                "w-5 h-5",
                showContent ? "mr-3" : "",
                isActive('/files') ? "text-white" : "text-slate-500"
              )} />
              {showContent && "All Files"}
            </div>
          </li>
        </ul>
      </div>
      
      {courses.length > 0 && (
        <div>
          {showContent && (
            <div className="px-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Your Courses
            </div>
          )}
          <ScrollArea className="h-[calc(100vh-22rem)]">
            <ul className="space-y-1 pr-2">
              {courses.map((course) => (
                <li key={course.id}>
                  <div 
                    onClick={handleNavigation(`/courses/${course.id}`)}
                    className={cn(
                      "flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer",
                      isActive(`/courses/${course.id}`) 
                        ? "bg-slate-100 text-slate-900 font-medium" 
                        : "text-slate-700 hover:bg-slate-100",
                      !showContent && "justify-center"
                    )}
                  >
                    <span className={cn(
                      "rounded-full", 
                      showContent ? "w-2 h-2 mr-3" : "w-5 h-5",
                      getCourseColor(course.code)
                    )}></span>
                    {showContent && `${course.code} - ${course.name}`}
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}
      
      {/* Border separator */}
      <div className="pt-4 border-t border-slate-200"></div>
      
      {/* Pro Features Section */}
      <div className="flex justify-center pt-2">
        {!user?.isPro && (
          <Button
            onClick={() => setShowProInfoModal(true)}
            variant="ghost"
            size="sm"
            className="rounded-full h-8 w-8 p-0 flex items-center justify-center text-slate-400 hover:text-yellow-500 hover:border hover:border-yellow-400 transition-colors duration-200"
            aria-label="Unlock Pro features"
          >
            <Lock className="h-4 w-4" />
          </Button>
        )}
        
        {user?.isPro && (
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full h-8 w-8 p-0 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-slate-100"
              aria-label="AI Assistant"
            >
              <Bot className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full h-8 w-8 p-0 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-slate-100"
              aria-label="Smart Suggestions"
            >
              <Lightbulb className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
      
      {/* Toggle Button */}
      <div className="pt-3 flex justify-center">
        <Button
          onClick={onToggle}
          variant="ghost"
          size="sm"
          className="rounded-full h-8 w-8 p-0 flex items-center justify-center text-slate-500 hover:bg-slate-100"
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:block bg-white border-r border-slate-200 h-[calc(100vh-57px)] sticky top-[57px] overflow-y-auto transition-all duration-300",
          isOpen ? "w-64" : "w-16"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar (hidden by default) */}
      <div className={cn(
        "fixed inset-0 z-40 lg:hidden",
        isOpen ? "block" : "hidden"
      )}>
        <div 
          className="fixed inset-0 bg-slate-600 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>
        <div className="relative flex flex-col w-72 max-w-xs bg-white h-full">
          <div className="absolute top-0 right-0 p-2">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          {sidebarContent}
        </div>
      </div>
      
      {/* Course Form Dialog */}
      {showCourseForm && (
        <CourseForm 
          onClose={() => setShowCourseForm(false)}
          onSuccess={() => setShowCourseForm(false)}
        />
      )}
      
      {/* Pro Info Modal */}
      {user && (
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
                  navigate("/my-account");
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
