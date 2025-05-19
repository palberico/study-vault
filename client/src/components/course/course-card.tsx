import { useLocation } from "wouter";
import { Course, deleteCourse } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, BookOpen, Trash2, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import CourseFormEdit from "@/components/course/course-form-edit";
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

interface CourseCardProps {
  course: Course;
  assignmentCount: number;
  onClick?: () => void;
  onDelete?: (courseId: string) => void;
}

export default function CourseCard({ course, assignmentCount, onClick, onDelete }: CourseCardProps) {
  const [, navigate] = useLocation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const { toast } = useToast();

  // Generate background image and color based on course code
  const getBackgroundColor = () => {
    const colors = {
      "CS": "from-blue-800/40 to-blue-900/70",
      "MATH": "from-green-800/40 to-green-900/70",
      "ENG": "from-purple-800/40 to-purple-900/70",
      "BIO": "from-red-800/40 to-red-900/70",
      "PHYS": "from-yellow-800/40 to-yellow-900/70",
      "HIST": "from-indigo-800/40 to-indigo-900/70",
      "PSYCH": "from-pink-800/40 to-pink-900/70"
    };
    
    const code = course.code.split(' ')[0] || "";
    for (const [prefix, color] of Object.entries(colors)) {
      if (code.startsWith(prefix)) {
        return color;
      }
    }
    
    return "from-blue-800/40 to-blue-900/70"; // Default
  };

  const getCourseStatusColor = () => {
    const code = course.code.split(' ')[0] || "";
    if (code.startsWith("CS")) return "bg-blue-500";
    if (code.startsWith("MATH")) return "bg-green-500";
    if (code.startsWith("ENG")) return "bg-purple-500";
    if (code.startsWith("BIO")) return "bg-red-500";
    return "bg-blue-500"; // Default
  };

  const getCourseBackgroundImage = () => {
    const code = course.code.split(' ')[0] || "";
    
    if (code.startsWith("UNSY")) {
      return "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=250&q=80";
    } 
    if (code.startsWith("HUMN")) {
      return "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=250&q=80";
    }
    if (code.startsWith("ENG")) {
      return "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=250&q=80";
    }

    
    // Default image - digital organization
    return "https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=250&q=80";
  };

  // Removed card click functionality as requested

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all border border-slate-200 relative">
      <div className="absolute top-2 right-2 z-10 flex space-x-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:text-blue-400 hover:bg-white/30 z-10 rounded-full h-8 w-8"
          onClick={() => {
            setShowEditForm(true);
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-white hover:text-red-500 hover:bg-white/30 z-10 rounded-full h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            setIsDeleteDialogOpen(true);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="h-36 bg-cover bg-center" style={{ backgroundImage: `url('${getCourseBackgroundImage()}')` }}>
        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-b ${getBackgroundColor()}`}>
          <span className="text-white font-bold text-xl">{course.code}</span>
        </div>
      </div>
      <CardContent className="p-5">
        <h3 className="font-semibold text-lg mb-1">{course.name}</h3>
        <p className="text-slate-600 text-sm mb-3 line-clamp-1">{course.description || "No description"}</p>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600">
            <BookOpen className="inline-block h-4 w-4 mr-1" /> {assignmentCount} {assignmentCount === 1 ? 'assignment' : 'assignments'}
          </span>
          <span className="text-slate-600">
            <Calendar className="inline-block h-4 w-4 mr-1" /> {course.term}
          </span>
        </div>
      </CardContent>
      <div className="border-t border-slate-200 px-5 py-3 bg-slate-50 flex justify-between items-center">
        <span className="text-xs font-medium">
          <span className={`inline-block w-2 h-2 rounded-full ${getCourseStatusColor()} mr-2`}></span>
          Active
        </span>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={(e) => {
              e.stopPropagation();
              // Store course ID in localStorage for assignment form
              localStorage.setItem('selectedCourseId', course.id || '');
              navigate(`/assignments/new?courseId=${course.id}`);
            }}
          >
            Add Assignment
          </Button>
          <Button 
            variant="link" 
            className="text-primary hover:text-blue-700 text-sm font-medium p-0 h-auto"
            onClick={(e) => {
              e.stopPropagation();
              if (course.id) {
                console.log("Navigating to course with ID:", course.id);
                navigate(`/courses/${course.id}`);
              }
            }}
          >
            View Course
          </Button>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this course?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete the course "{course.name}" ({course.code}), 
              all its assignments, and any files attached to those assignments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={async (e) => {
                e.preventDefault();
                if (!course.id) return;
                
                try {
                  setIsDeleting(true);
                  await deleteCourse(course.id);
                  toast({
                    title: "Course deleted",
                    description: "The course and all its content has been deleted",
                  });
                  
                  // Call onDelete callback if provided
                  if (onDelete) {
                    onDelete(course.id);
                    
                    // Also remove from localStorage to prevent caching issues
                    try {
                      const storedCourses = localStorage.getItem('userCourses');
                      if (storedCourses) {
                        const parsedCourses = JSON.parse(storedCourses);
                        if (Array.isArray(parsedCourses)) {
                          const updatedCourses = parsedCourses.filter(c => c.id !== course.id);
                          localStorage.setItem('userCourses', JSON.stringify(updatedCourses));
                          console.log("Updated localStorage after course deletion");
                        }
                      }
                    } catch (error) {
                      console.error("Error updating localStorage after deletion:", error);
                    }
                  }
                } catch (error) {
                  console.error("Error deleting course:", error);
                  toast({
                    title: "Error",
                    description: "Failed to delete the course. Please try again.",
                    variant: "destructive",
                  });
                } finally {
                  setIsDeleting(false);
                  setIsDeleteDialogOpen(false);
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Course"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Edit Course Form */}
      {showEditForm && course && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full mx-auto" onClick={(e) => e.stopPropagation()}>
            <CourseFormEdit 
              course={course}
              onCancel={() => setShowEditForm(false)}
              onSuccess={(updatedCourse: Course) => {
                // Handle the updated course - we might need to refresh the page or update the local state
                toast({
                  title: "Success",
                  description: "Course updated successfully",
                });
                setShowEditForm(false);
                // Refresh the page to show updated data
                window.location.reload();
              }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
