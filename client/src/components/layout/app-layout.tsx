import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "./header";
import Sidebar from "./sidebar";
import { useAuth } from "@/hooks/use-auth";
import { getUserCourses, type Course } from "@/lib/firebase";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [sidebarExpanded, setSidebarExpanded] = useState(false); // Default to collapsed
  const [courses, setCourses] = useState<Course[]>([]);
  
  // Load saved sidebar state from localStorage on initial load
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarExpanded');
    if (savedState !== null) {
      setSidebarExpanded(savedState === 'true');
    }
  }, []);
  
  // Save sidebar state when it changes
  useEffect(() => {
    localStorage.setItem('sidebarExpanded', sidebarExpanded.toString());
  }, [sidebarExpanded]);
  
  useEffect(() => {
    async function fetchCourses() {
      if (user) {
        try {
          const coursesData = await getUserCourses(user.uid);
          setCourses(coursesData);
        } catch (error) {
          console.error("Error fetching courses for sidebar:", error);
        }
      }
    }
    
    fetchCourses();
  }, [user]);
  
  const toggleSidebar = () => {
    setSidebarExpanded(prev => !prev);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header 
        onMenuToggle={toggleSidebar} 
      />
      
      <div className="flex flex-1">
        {/* Sidebar - both desktop and mobile */}
        <Sidebar 
          courses={courses} 
          isExpanded={sidebarExpanded}
          toggleSidebar={toggleSidebar}
        />
        
        {/* Main Content */}
        <main className={`flex-1 p-4 lg:p-8 transition-all duration-300 ${!sidebarExpanded ? "lg:ml-0" : ""}`}>
          {children}
        </main>
      </div>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 lg:px-8">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="text-slate-500 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} StudyVault. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <a href="#" className="text-slate-500 hover:text-primary">
              Help Center
            </a>
            <a href="#" className="text-slate-500 hover:text-primary">
              Privacy Policy
            </a>
            <a href="#" className="text-slate-500 hover:text-primary">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
