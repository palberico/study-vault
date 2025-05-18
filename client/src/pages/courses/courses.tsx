import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getUserCourses, getUserAssignments, type Course, type Assignment } from "@/lib/firebase";
import CourseCard from "@/components/course/course-card";
import CourseForm from "@/components/course/course-form";
import { Button } from "@/components/ui/button";
import { PlusIcon, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function CoursesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  useEffect(() => {
    async function fetchCourses() {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const coursesData = await getUserCourses(user.uid);
        setCourses(coursesData);
        
        const assignmentsData = await getUserAssignments(user.uid);
        
        // Count assignments per course
        const assignmentCounts: Record<string, number> = {};
        assignmentsData.forEach((assignment: Assignment) => {
          if (assignment.courseId) {
            assignmentCounts[assignment.courseId] = (assignmentCounts[assignment.courseId] || 0) + 1;
          }
        });
        
        setAssignments(assignmentCounts);
      } catch (error) {
        console.error("Error fetching courses:", error);
        toast({
          title: "Error",
          description: "Failed to load your courses",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchCourses();
  }, [user, toast]);
  
  const filteredCourses = courses.filter(course => 
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const handleAddCourse = (newCourse: Course) => {
    setCourses(prev => [newCourse, ...prev]);
    setShowCourseForm(false);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Your Courses</h1>
        <p className="text-slate-500">
          Manage and organize all your academic courses in one place
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="relative w-full md:w-1/2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <Input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button 
          onClick={() => setShowCourseForm(true)}
          className="flex items-center"
        >
          <PlusIcon className="mr-2 h-4 w-4" /> Add New Course
        </Button>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-pulse">
              <div className="h-36 bg-slate-200"></div>
              <div className="p-5">
                <div className="bg-slate-200 h-6 w-3/4 mb-1 rounded"></div>
                <div className="bg-slate-200 h-4 w-1/2 mb-3 rounded"></div>
                <div className="flex justify-between items-center">
                  <div className="bg-slate-200 h-4 w-24 rounded"></div>
                  <div className="bg-slate-200 h-4 w-24 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          {searchTerm ? (
            <>
              <Search className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No matching courses found</h3>
              <p className="text-slate-500 mb-4">Try using different search terms</p>
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Clear Search
              </Button>
            </>
          ) : (
            <>
              <Calendar className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No courses yet</h3>
              <p className="text-slate-500 mb-4">Start by adding your first course</p>
              <Button onClick={() => setShowCourseForm(true)}>
                Add Course
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard 
              key={course.id} 
              course={course} 
              assignmentCount={assignments[course.id || ""] || 0}
              onClick={() => navigate(`/courses/${course.id}`)}
            />
          ))}
        </div>
      )}
      
      {showCourseForm && (
        <CourseForm 
          onClose={() => setShowCourseForm(false)}
          onSuccess={handleAddCourse}
        />
      )}
    </div>
  );
}
