import { useLocation } from "wouter";
import { Link } from "wouter";
import { Course } from "@/lib/firebase";
import { 
  Home, 
  BookOpen, 
  FileText, 
  Folder, 
  Plus, 
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import CourseForm from "@/components/course/course-form";

interface SidebarProps {
  courses: Course[];
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export default function Sidebar({ courses, isOpen, onClose, onToggle }: SidebarProps) {
  const [location] = useLocation();
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
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
  
  // Sidebar for larger screens (fixed)
  const sidebarContent = (
    <nav className={cn("py-6 space-y-6", isOpen ? "px-4" : "px-2")}>
      <div>
        {isOpen && (
          <div className="px-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Main
          </div>
        )}
        <ul className="space-y-1">
          <li>
            <Link href="/">
              <a className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                isActive('/') 
                  ? "bg-primary text-white" 
                  : "text-slate-700 hover:bg-slate-100",
                !isOpen && "justify-center"
              )}>
                <Home className={cn(
                  "w-5 h-5",
                  isOpen ? "mr-3" : "",
                  isActive('/') ? "text-white" : "text-slate-500"
                )} />
                {isOpen && "Dashboard"}
              </a>
            </Link>
          </li>
          <li>
            <Link href="/courses">
              <a className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                isActive('/courses') 
                  ? "bg-primary text-white" 
                  : "text-slate-700 hover:bg-slate-100",
                !isOpen && "justify-center"
              )}>
                <BookOpen className={cn(
                  "w-5 h-5",
                  isOpen ? "mr-3" : "",
                  isActive('/courses') ? "text-white" : "text-slate-500"
                )} />
                {isOpen && "Courses"}
              </a>
            </Link>
          </li>
          <li>
            <Link href="/assignments">
              <a className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                isActive('/assignments') 
                  ? "bg-primary text-white" 
                  : "text-slate-700 hover:bg-slate-100",
                !isOpen && "justify-center"
              )}>
                <FileText className={cn(
                  "w-5 h-5",
                  isOpen ? "mr-3" : "",
                  isActive('/assignments') ? "text-white" : "text-slate-500"
                )} />
                {isOpen && "Assignments"}
              </a>
            </Link>
          </li>
          <li>
            <Link href="/files">
              <a className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                isActive('/files') 
                  ? "bg-primary text-white" 
                  : "text-slate-700 hover:bg-slate-100",
                !isOpen && "justify-center"
              )}>
                <Folder className={cn(
                  "w-5 h-5",
                  isOpen ? "mr-3" : "",
                  isActive('/files') ? "text-white" : "text-slate-500"
                )} />
                {isOpen && "All Files"}
              </a>
            </Link>
          </li>
        </ul>
      </div>
      
      {courses.length > 0 && (
        <div>
          {isOpen && (
            <div className="px-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Your Courses
            </div>
          )}
          <ScrollArea className="h-[calc(100vh-22rem)]">
            <ul className="space-y-1 pr-2">
              {courses.map((course) => (
                <li key={course.id}>
                  <Link href={`/courses/${course.id}`}>
                    <a className={cn(
                      "flex items-center px-2 py-2 text-sm font-medium rounded-md",
                      isActive(`/courses/${course.id}`) 
                        ? "bg-slate-100 text-slate-900 font-medium" 
                        : "text-slate-700 hover:bg-slate-100",
                      !isOpen && "justify-center"
                    )}>
                      <span className={cn(
                        "rounded-full", 
                        isOpen ? "w-2 h-2 mr-3" : "w-5 h-5",
                        getCourseColor(course.code)
                      )}></span>
                      {isOpen && `${course.code} - ${course.name}`}
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}
      
      <div className={cn("pt-4 border-t border-slate-200", !isOpen && "flex justify-center")}>
        <Button
          onClick={() => setShowCourseForm(true)}
          variant="ghost"
          className={cn(
            "flex items-center px-2 py-2 text-sm font-medium rounded-md text-primary hover:bg-blue-50",
            isOpen ? "w-full" : "w-10 h-10 p-0"
          )}
        >
          <Plus className={cn("w-5 h-5", isOpen && "mr-3")} />
          {isOpen && "Add New Course"}
        </Button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-white border-r border-slate-200 h-[calc(100vh-57px)] sticky top-[57px] overflow-y-auto">
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
    </>
  );
}
