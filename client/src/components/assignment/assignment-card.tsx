import { formatDistanceToNow } from "date-fns";
import { Assignment, Course, deleteAssignment, getAssignmentFiles } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Trash2, Upload, FilePlus, FileUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AssignmentCardProps {
  assignment: Assignment;
  courses: Course[];
  onClick?: () => void;
}

export default function AssignmentCard({ assignment, courses, onClick }: AssignmentCardProps) {
  const [fileCount, setFileCount] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Find the course this assignment belongs to
  const course = courses.find(c => c.id === assignment.courseId);
  
  // Load file count
  useEffect(() => {
    async function loadFileCount() {
      if (!assignment.id) return;
      
      try {
        const files = await getAssignmentFiles(assignment.id);
        setFileCount(files.length);
      } catch (error) {
        console.error("Error loading files:", error);
      }
    }
    
    loadFileCount();
  }, [assignment.id]);
  
  // Format the due date
  const formatDueDate = () => {
    if (!assignment.dueDate) return "No due date";
    
    const dueDate = assignment.dueDate instanceof Date 
      ? assignment.dueDate 
      : new Date(assignment.dueDate);
    
    return formatDistanceToNow(dueDate, { addSuffix: true });
  };
  
  // Determine badge colors based on status
  const getStatusColor = () => {
    switch (assignment.status) {
      case "submitted":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };
  
  // Determine course badge color
  const getCourseColor = () => {
    if (!course) return "bg-blue-100 text-blue-800";
    
    const code = course.code.split(' ')[0] || "";
    if (code.startsWith("CS")) return "bg-blue-100 text-blue-800";
    if (code.startsWith("MATH")) return "bg-green-100 text-green-800";
    if (code.startsWith("ENG")) return "bg-purple-100 text-purple-800";
    if (code.startsWith("BIO")) return "bg-red-100 text-red-800";
    
    return "bg-blue-100 text-blue-800";
  };
  
  // Function to limit description text
  const truncateDescription = (text: string, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <Card 
      className="border border-slate-200 overflow-hidden hover:shadow-md transition-all relative"
      onClick={onClick}
    >
      <div className="absolute top-2 right-2 z-10 flex space-x-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-slate-400 hover:text-blue-500 hover:bg-slate-100 z-10 rounded-full h-8 w-8"
          onClick={() => {
            if (assignment.id) {
              // Navigate to the edit page directly
              navigate(`/assignments/edit/${assignment.id}`);
            }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-slate-400 hover:text-red-500 hover:bg-slate-100 z-10 rounded-full h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            setIsDeleteDialogOpen(true);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <CardContent className="p-5">
        <div className="flex items-start mb-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={getCourseColor()}>
              {course?.code || "Unknown"}
            </Badge>
            <Badge variant="outline" className={getStatusColor()}>
              {assignment.status === "pending" ? `Due ${formatDueDate()}` : 
               assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
            </Badge>
          </div>
        </div>
        
        <h3 className="font-semibold text-lg mb-2">{assignment.title}</h3>
        <p className="text-slate-600 text-sm mb-4 line-clamp-2">
          {truncateDescription(assignment.description)}
        </p>
        
        <div className="flex items-center text-xs text-slate-500">
          <span>
            <Calendar className="inline mr-1 h-3 w-3" /> Due: {
              assignment.dueDate instanceof Date 
                ? assignment.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : new Date(assignment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            }
          </span>
          <span className="ml-4">
            <FileText className="inline mr-1 h-3 w-3" /> {fileCount > 0 ? `${fileCount} file${fileCount !== 1 ? 's' : ''} attached` : "No files"}
          </span>
        </div>
      </CardContent>
      
      <div className="border-t border-slate-200 px-5 py-3 bg-slate-50 flex justify-between items-center">
        <span className="text-xs font-medium text-slate-500">
          Added: {
            assignment.createdAt instanceof Date 
              ? assignment.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : new Date(assignment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          }
        </span>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={(e) => {
              e.stopPropagation();
              if (assignment.id && course?.id) {
                navigate(`/files/upload?assignmentId=${assignment.id}&courseId=${course.id}`);
              }
            }}
          >
            <FilePlus className="h-3 w-3 mr-1" />
            Add Files
          </Button>
          <Button 
            variant="link" 
            className="text-primary hover:text-blue-700 text-sm font-medium p-0 h-auto"
          >
            View Details
          </Button>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the assignment "{assignment.title}" 
              and all its attached files. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={async (e) => {
                e.preventDefault();
                if (!assignment.id) return;
                
                try {
                  setIsDeleting(true);
                  await deleteAssignment(assignment.id);
                  toast({
                    title: "Assignment deleted",
                    description: "The assignment and all its files have been deleted",
                  });
                  // Force page refresh to update UI
                  window.location.reload();
                } catch (error) {
                  console.error("Error deleting assignment:", error);
                  toast({
                    title: "Error",
                    description: "Failed to delete the assignment. Please try again.",
                    variant: "destructive",
                  });
                } finally {
                  setIsDeleting(false);
                  setIsDeleteDialogOpen(false);
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Assignment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
