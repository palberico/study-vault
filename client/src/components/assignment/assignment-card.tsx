import { formatDistanceToNow } from "date-fns";
import { Assignment, Course, deleteAssignment, getAssignmentFiles, updateAssignment } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Trash2, Upload, FilePlus, FileUp, Tag, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import AssignmentFormEdit from "@/components/assignment/assignment-form-edit";
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
  // Note: onClick is now unused as we only want the View Details button to navigate
  const [fileCount, setFileCount] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
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
    
    try {
      const dueDate = assignment.dueDate instanceof Date 
        ? assignment.dueDate 
        : new Date(assignment.dueDate);
      
      // Check if date is valid
      if (isNaN(dueDate.getTime())) {
        return "Invalid date";
      }
      
      return formatDistanceToNow(dueDate, { addSuffix: true });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };
  
  // Helper function to check if an assignment is due soon (within 3 days)
  const isAssignmentDueSoon = () => {
    if (!assignment.dueDate) return false;
    
    const today = new Date();
    const due = new Date(assignment.dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 3;
  };
  
  // Determine badge colors based on status
  const getStatusColor = () => {
    switch (assignment.status) {
      case "submitted":
        return "bg-green-100 text-green-800";
      case "pending":
        return isAssignmentDueSoon() 
          ? "bg-orange-100 text-orange-800 border-orange-200" 
          : "bg-amber-100 text-amber-800";
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
      className="border border-slate-200 overflow-hidden hover:shadow-md hover:border-primary/30 transition-all duration-300 transform hover:-translate-y-1 relative group"
      // Removed onClick to make card non-clickable, only "View Details" button will navigate
    >
      <div className="absolute top-2 right-2 z-10 flex space-x-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-slate-400 hover:text-blue-500 hover:bg-slate-100 z-10 rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
          onClick={() => {
            setShowEditForm(true);
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-slate-400 hover:text-red-500 hover:bg-slate-100 z-10 rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
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
            <Badge variant="outline" className={`${getStatusColor()} ${isAssignmentDueSoon() && assignment.status === "pending" ? "animate-pulse" : ""}`}>
              {assignment.status === "pending" ? (
                <div className="flex items-center gap-1">
                  {isAssignmentDueSoon() && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                  )}
                  <span>Due {formatDueDate()}</span>
                  {isAssignmentDueSoon() && " (Soon)"}
                </div>
              ) : (
                assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)
              )}
            </Badge>
            
            {/* Display tags if available */}
            {assignment.tags && assignment.tags.length > 0 && (
              assignment.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="bg-slate-100 hover:bg-slate-200 text-slate-700">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))
            )}
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
      
      <div className="border-t border-slate-200 px-5 py-3 bg-slate-50 flex justify-end items-center">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs transform transition-all duration-200 hover:scale-105 hover:shadow-sm"
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
            className="text-primary hover:text-blue-700 text-sm font-medium p-0 h-auto transform transition-all duration-200 hover:translate-x-1 flex items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              if (assignment.id) {
                navigate(`/assignments/${assignment.id}`);
              }
            }}
          >
            View Details
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:translate-x-1">
              <path d="m9 18 6-6-6-6"></path>
            </svg>
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
      
      {/* Edit Assignment Form Modal */}
      {showEditForm && assignment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEditForm(false)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Edit Assignment</h2>
              <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setShowEditForm(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </Button>
            </div>
            <div className="p-4 max-h-[80vh] overflow-y-auto">
              <AssignmentFormEdit 
                assignment={assignment}
                courses={courses}
                onCancel={() => setShowEditForm(false)}
                onSuccess={(updatedAssignment: Assignment) => {
                  toast({
                    title: "Success",
                    description: "Assignment updated successfully",
                  });
                  setShowEditForm(false);
                  // Refresh the page to show updated data
                  window.location.reload();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
