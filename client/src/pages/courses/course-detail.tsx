import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  getCourse,
  getCourseAssignments,
  deleteCourse,
  type Course,
  type Assignment
} from "@/lib/firebase";
import AssignmentCard from "@/components/assignment/assignment-card";
import AssignmentForm from "@/components/assignment/assignment-form";
import { Button } from "@/components/ui/button";
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ArrowLeftIcon,
  BookOpen,
  AlertTriangle,
  Calendar
} from "lucide-react";
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
import CourseForm from "@/components/course/course-form";

interface CourseDetailPageProps {
  id: string;
}

export default function CourseDetailPage({ id }: CourseDetailPageProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchCourseData() {
      if (!user) return;

      try {
        setIsLoading(true);
        const courseData = await getCourse(id);
        
        // Verify the course belongs to the user
        if (courseData.userId !== user.uid) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view this course",
            variant: "destructive",
          });
          navigate("/courses");
          return;
        }
        
        setCourse(courseData);
        
        const assignmentsData = await getCourseAssignments(id);
        setAssignments(assignmentsData);
      } catch (error) {
        console.error("Error fetching course data:", error);
        toast({
          title: "Error",
          description: "Failed to load course data",
          variant: "destructive",
        });
        navigate("/courses");
      } finally {
        setIsLoading(false);
      }
    }

    fetchCourseData();
  }, [id, user, toast, navigate]);

  const handleDeleteCourse = async () => {
    if (!course?.id) return;
    
    try {
      setDeleting(true);
      await deleteCourse(course.id);
      toast({
        title: "Course Deleted",
        description: "Course has been successfully deleted",
      });
      navigate("/courses");
    } catch (error) {
      console.error("Error deleting course:", error);
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  const handleAddAssignment = (newAssignment: Assignment) => {
    setAssignments(prev => [newAssignment, ...prev]);
    setShowAssignmentForm(false);
  };

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
    
    const code = course?.code?.split(' ')[0] || "";
    for (const [prefix, color] of Object.entries(colors)) {
      if (code.startsWith(prefix)) {
        return color;
      }
    }
    
    return "from-blue-800/40 to-blue-900/70"; // Default
  };

  const courseImageUrl = () => {
    const code = course?.code?.split(' ')[0] || "";
    
    if (code.startsWith("CS") || code.includes("COMPSCI")) {
      return "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=250&q=80";
    } 
    if (code.startsWith("MATH")) {
      return "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=250&q=80";
    }
    if (code.startsWith("ENG") || code.includes("LIT")) {
      return "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=250&q=80";
    }
    
    // Default image
    return "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&h=500&q=80";
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center mb-4">
          <div className="h-6 w-6 bg-slate-200 rounded mr-2"></div>
          <div className="h-6 w-32 bg-slate-200 rounded"></div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="h-48 bg-slate-200"></div>
          <div className="p-6 space-y-4">
            <div className="h-8 w-1/2 bg-slate-200 rounded"></div>
            <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
            <div className="flex justify-between pt-2">
              <div className="h-6 w-24 bg-slate-200 rounded"></div>
              <div className="flex space-x-2">
                <div className="h-10 w-24 bg-slate-200 rounded"></div>
                <div className="h-10 w-24 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-6 w-40 bg-slate-200 rounded"></div>
            <div className="h-10 w-36 bg-slate-200 rounded"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 h-52">
                <div className="bg-slate-200 h-4 w-20 mb-3 rounded"></div>
                <div className="bg-slate-200 h-6 w-4/5 mb-2 rounded"></div>
                <div className="bg-slate-200 h-4 w-full mb-1 rounded"></div>
                <div className="bg-slate-200 h-4 w-3/4 mb-4 rounded"></div>
                <div className="flex items-center mt-auto">
                  <div className="bg-slate-200 h-4 w-24 rounded"></div>
                  <div className="bg-slate-200 h-4 w-16 ml-4 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-3" />
        <h3 className="text-lg font-medium text-slate-900 mb-1">Course Not Found</h3>
        <p className="text-slate-500 mb-4">The course you're looking for doesn't exist or was deleted</p>
        <Button onClick={() => navigate("/courses")}>
          Go to Courses
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        className="mb-4 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        onClick={() => navigate("/courses")}
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Courses
      </Button>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url('${courseImageUrl()}')` }}>
          <div className={`w-full h-full flex items-center justify-center bg-gradient-to-b ${getBackgroundColor()}`}>
            <span className="text-white font-bold text-xl">{course.code}</span>
          </div>
        </div>
        <div className="p-6">
          <div className="flex justify-between">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">{course.name}</h1>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowEditForm(true)}
                className="text-slate-600 border-slate-300"
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline" 
                size="icon"
                onClick={() => setShowDeleteAlert(true)}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {course.description && (
            <p className="text-slate-600 mb-4">{course.description}</p>
          )}
          
          <div className="flex justify-between items-center text-sm text-slate-500 pt-2 border-t border-slate-100 mt-2">
            <span>
              <Calendar className="inline-block h-4 w-4 mr-1" /> {course.term}
            </span>
            <span>
              <BookOpen className="inline-block h-4 w-4 mr-1" /> {assignments.length} assignments
            </span>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">Assignments</h2>
          <Button 
            onClick={() => setShowAssignmentForm(true)}
            className="flex items-center"
          >
            <PlusIcon className="mr-2 h-4 w-4" /> Add Assignment
          </Button>
        </div>
        
        {assignments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No assignments yet</h3>
            <p className="text-slate-500 mb-4">Create your first assignment for this course</p>
            <Button onClick={() => setShowAssignmentForm(true)}>
              Add Assignment
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment) => (
              <AssignmentCard 
                key={assignment.id} 
                assignment={assignment}
                courses={[course]}
                onClick={() => navigate(`/assignments/${assignment.id}`)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Delete Course Alert Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the course "{course.name}" and all of its assignments.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCourse}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? "Deleting..." : "Delete Course"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Assignment Form Dialog */}
      {showAssignmentForm && course && (
        <AssignmentForm 
          courseId={course.id!}
          onClose={() => setShowAssignmentForm(false)}
          onSuccess={handleAddAssignment}
        />
      )}
      
      {/* Edit Course Form Dialog */}
      {showEditForm && course && (
        <CourseForm 
          course={course}
          onClose={() => setShowEditForm(false)}
          onSuccess={(updatedCourse) => {
            setCourse(updatedCourse);
            setShowEditForm(false);
          }}
        />
      )}
    </div>
  );
}
