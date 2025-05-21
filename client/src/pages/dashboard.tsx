import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  getUserCourses, 
  getUserAssignments, 
  getUserFiles,
  type Course,
  type Assignment,
  type FileItem as FileItemType
} from "@/lib/firebase";
import CourseCard from "@/components/course/course-card";
import AssignmentCard from "@/components/assignment/assignment-card";
import FileItem from "@/components/file/file-item";
import { Button } from "@/components/ui/button";
import { PlusIcon, Calendar, FileText, Sparkles } from "lucide-react";
import CourseForm from "@/components/course/course-form";
import { formatDistanceToNow } from "date-fns";
import OnboardingController from "@/components/onboarding/onboarding-controller";
import PaymentModal from "@/components/pro/payment-modal";

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [files, setFiles] = useState<FileItemType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  
  // Don't load from localStorage automatically anymore
  useEffect(() => {
    if (courses && courses.length > 0) {
      console.log("Storing courses in localStorage:", courses);
      localStorage.setItem('userCourses', JSON.stringify(courses));
    }
  }, [courses]);
  
  useEffect(() => {
    // Clear localStorage when component mounts to prevent stale data
    localStorage.removeItem('userCourses');
    
    async function fetchData() {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch data one by one with error handling for each
        try {
          console.log("Fetching courses for user:", user.uid);
          const coursesData = await getUserCourses(user.uid);
          console.log("Courses data received from Firebase:", coursesData);
          if (Array.isArray(coursesData)) {
            setCourses(coursesData);
          } else {
            setCourses([]);
          }
        } catch (error) {
          console.error("Error fetching courses:", error);
          setCourses([]);
        }
        
        try {
          console.log("Fetching assignments for user:", user.uid);
          const assignmentsData = await getUserAssignments(user.uid);
          console.log("Assignments data:", assignmentsData);
          if (Array.isArray(assignmentsData)) {
            setAssignments(assignmentsData);
          } else {
            setAssignments([]);
          }
        } catch (error) {
          console.error("Error fetching assignments:", error);
          setAssignments([]);
        }
        
        try {
          console.log("Fetching files for user:", user.uid);
          const filesData = await getUserFiles(user.uid);
          console.log("Files data:", filesData);
          if (Array.isArray(filesData)) {
            setFiles(filesData);
          } else {
            setFiles([]);
          }
        } catch (error) {
          console.error("Error fetching files:", error);
          setFiles([]);
        }
      } catch (error) {
        console.error("Error in dashboard data loading:", error);
        toast({
          title: "Note",
          description: "Some dashboard data could not be loaded",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [user, toast]);
  
  const recentAssignments = assignments.slice(0, 3);
  const recentFiles = files.slice(0, 5);

  return (
    <div>
      {/* Help button removed, now accessible from user dropdown menu */}
      
      {/* Welcome Banner */}
      <div className="mb-8 bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="relative h-48 md:h-64 bg-cover bg-center bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&h=500&q=80')]">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-indigo-600/80"></div>
          <div className="absolute inset-0 flex items-center p-8">
            <div className="max-w-2xl">
              <h1 className="text-white text-2xl sm:text-3xl font-bold mb-2">
                {user?.name ? `Welcome back, ${user.name}!` : 'Welcome back!'}
              </h1>
              <p className="text-blue-100 text-sm sm:text-base">
                Track your academic journey and keep all your work organized in one place.
              </p>
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 sm:p-6">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-3xl font-bold text-blue-600">{courses.length}</p>
            <p className="text-sm text-slate-600">Active Courses</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <p className="text-3xl font-bold text-purple-600">{assignments.length}</p>
            <p className="text-sm text-slate-600">Assignments</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <p className="text-3xl font-bold text-green-600">
              {assignments.filter(a => a.status === 'submitted').length}
            </p>
            <p className="text-sm text-slate-600">Completed</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg text-center">
            <p className="text-3xl font-bold text-amber-600">{files.length}</p>
            <p className="text-sm text-slate-600">Files Uploaded</p>
          </div>
        </div>
      </div>

      {/* Your Courses Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">Your Courses</h2>
          <div className="flex space-x-3">
            {!user?.isPro && (
              <Button 
                onClick={() => setShowProModal(true)}
                variant="ghost"
                className="px-4 py-2 border border-yellow-400 text-yellow-500 hover:bg-yellow-50 rounded-lg text-sm font-medium flex items-center"
              >
                <Sparkles className="mr-2 h-4 w-4 text-yellow-400" /> Try Pro
              </Button>
            )}
            <Button 
              onClick={() => setShowCourseForm(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-600 flex items-center"
            >
              <PlusIcon className="mr-2 h-4 w-4" /> Add New Course
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="h-36 bg-slate-200 animate-pulse"></div>
                <div className="p-5">
                  <div className="bg-slate-200 h-6 w-3/4 mb-1 rounded animate-pulse"></div>
                  <div className="bg-slate-200 h-4 w-1/2 mb-3 rounded animate-pulse"></div>
                  <div className="flex justify-between items-center">
                    <div className="bg-slate-200 h-4 w-24 rounded animate-pulse"></div>
                    <div className="bg-slate-200 h-4 w-24 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No courses yet</h3>
            <p className="text-slate-500 mb-4">Start by adding your first course</p>
            <Button onClick={() => setShowCourseForm(true)} className="mb-3">
              Add Course
            </Button>
            
            {!user?.isPro && (
              <div className="mt-4 text-sm text-slate-500">
                Or, go Pro and let us import your syllabus for you!{" "}
                <button 
                  onClick={() => setShowProModal(true)} 
                  className="text-yellow-500 hover:text-yellow-600 font-medium inline-flex items-center"
                >
                  Try Pro
                  <Sparkles className="h-3.5 w-3.5 ml-1 text-yellow-400" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard 
                key={course.id} 
                course={course} 
                assignmentCount={assignments.filter(a => a.courseId === course.id).length}
                onClick={() => navigate(`/courses/${course.id}`)}
                onDelete={(courseId) => {
                  // Force refresh from server
                  setIsLoading(true);
                  
                  // Update courses state
                  setCourses(prevCourses => {
                    const updatedCourses = prevCourses.filter(c => c.id !== courseId);
                    // Clear localStorage completely to ensure fresh data on next load
                    localStorage.removeItem('userCourses');
                    return updatedCourses;
                  });
                  
                  // Update assignments state - remove all assignments for this course
                  setAssignments(prevAssignments => prevAssignments.filter(a => a.courseId !== courseId));
                  
                  // Update files state - remove all files associated with this course
                  setFiles(prevFiles => prevFiles.filter(f => f.courseId !== courseId));
                  
                  // Refetch data after a short delay
                  setTimeout(async () => {
                    if (user) {
                      try {
                        const coursesData = await getUserCourses(user.uid);
                        setCourses(coursesData);
                      } catch (error) {
                        console.error("Error refreshing courses after deletion:", error);
                      } finally {
                        setIsLoading(false);
                      }
                    }
                  }, 1000);
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Recent Assignments Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">Recent Assignments</h2>
          <Button 
            variant="link" 
            onClick={() => navigate("/assignments")}
            className="text-primary hover:text-blue-700"
          >
            View All
          </Button>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 h-52 animate-pulse">
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
        ) : recentAssignments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No assignments yet</h3>
            <p className="text-slate-500 mb-4">Start adding assignments to your courses</p>
            <Button onClick={() => navigate("/assignments")}>
              Create Assignment
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentAssignments.map((assignment) => (
              <AssignmentCard 
                key={assignment.id} 
                assignment={assignment} 
                courses={courses}
                onClick={() => navigate(`/assignments/${assignment.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Files Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">Recent Files</h2>
          <Button 
            variant="link" 
            onClick={() => navigate("/files")}
            className="text-primary hover:text-blue-700"
          >
            View All Files
          </Button>
        </div>
        
        {isLoading ? (
          <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      File Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8 bg-slate-200 rounded"></div>
                          <div className="ml-4 bg-slate-200 h-5 w-40 rounded"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="bg-slate-200 h-5 w-20 rounded"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="bg-slate-200 h-5 w-16 rounded"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="bg-slate-200 h-5 w-24 rounded"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="bg-slate-200 h-5 w-16 ml-auto rounded"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : recentFiles.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-400 mb-3" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No files uploaded yet</h3>
            <p className="text-slate-500 mb-4">Upload files to your assignments</p>
            <Button onClick={() => navigate("/assignments")}>
              Go to Assignments
            </Button>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      File Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Course
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {recentFiles.map((file) => {
                    const course = courses.find(c => c.id === file.courseId);
                    return (
                      <FileItem 
                        key={file.id}
                        file={file}
                        courseName={course?.name || 'Unknown Course'}
                        uploadTime={file.createdAt instanceof Date ? formatDistanceToNow(file.createdAt, { addSuffix: true }) : 'Unknown'}
                        onDelete={(fileId) => {
                          // Update the files list immediately when a file is deleted
                          setFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
                        }}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Pro Upgrade Modal */}
      {user && (
        <PaymentModal
          open={showProModal}
          onOpenChange={setShowProModal}
          userId={user.uid}
          onSuccess={() => {
            toast({
              title: "Upgrade successful!",
              description: "You now have access to all Pro features.",
            });
          }}
        />
      )}
      
      {/* Course Form Modal */}
      {showCourseForm && (
        <CourseForm 
          onClose={() => setShowCourseForm(false)}
          onSuccess={(course) => {
            setCourses(prev => [course, ...prev]);
            setShowCourseForm(false);
            toast({
              title: "Course added",
              description: "Your course was added successfully.",
            });
          }}
        />
      )}
    </div>
  );
}
