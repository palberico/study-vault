import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  getAssignment,
  getCourse,
  getAssignmentFiles,
  deleteAssignment,
  updateAssignment,
  type Assignment,
  type Course,
  type FileItem
} from "@/lib/firebase";
import FileUploader from "@/components/file/file-uploader";
import { Button } from "@/components/ui/button";
import {
  TrashIcon,
  PencilIcon,
  ArrowLeftIcon,
  Calendar,
  AlertTriangle,
  FileText
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
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import AssignmentForm from "@/components/assignment/assignment-form";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import FileItem from "@/components/file/file-item";

interface AssignmentDetailPageProps {
  id: string;
}

export default function AssignmentDetailPage({ id }: AssignmentDetailPageProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchAssignmentData() {
      if (!user) return;

      try {
        setIsLoading(true);
        const assignmentData = await getAssignment(id);
        
        // Verify the assignment belongs to the user
        if (assignmentData.userId !== user.uid) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view this assignment",
            variant: "destructive",
          });
          navigate("/assignments");
          return;
        }
        
        setAssignment(assignmentData);
        
        // Fetch related course and files
        const [courseData, filesData] = await Promise.all([
          getCourse(assignmentData.courseId),
          getAssignmentFiles(id)
        ]);
        
        setCourse(courseData);
        setFiles(filesData);
      } catch (error) {
        console.error("Error fetching assignment data:", error);
        toast({
          title: "Error",
          description: "Failed to load assignment data",
          variant: "destructive",
        });
        navigate("/assignments");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAssignmentData();
  }, [id, user, toast, navigate]);

  const handleDeleteAssignment = async () => {
    if (!assignment?.id) return;
    
    try {
      setDeleting(true);
      await deleteAssignment(assignment.id);
      toast({
        title: "Assignment Deleted",
        description: "Assignment has been successfully deleted",
      });
      navigate("/assignments");
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast({
        title: "Error",
        description: "Failed to delete assignment",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  const handleFileUpload = (newFile: FileItem) => {
    setFiles(prev => [newFile, ...prev]);
  };

  const handleStatusChange = async (newStatus: Assignment['status']) => {
    if (!assignment?.id) return;
    
    try {
      await updateAssignment(assignment.id, { status: newStatus });
      setAssignment(prev => prev ? { ...prev, status: newStatus } : null);
      toast({
        title: "Status Updated",
        description: `Assignment marked as ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating assignment status:", error);
      toast({
        title: "Error",
        description: "Failed to update assignment status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: Assignment['status']) => {
    switch (status) {
      case 'submitted':
        return "bg-green-100 text-green-800";
      case 'pending':
        return "bg-amber-100 text-amber-800";
      case 'overdue':
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center mb-4">
          <div className="h-6 w-6 bg-slate-200 rounded mr-2"></div>
          <div className="h-6 w-32 bg-slate-200 rounded"></div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="p-6 space-y-4">
            <div className="flex justify-between">
              <div className="h-8 w-1/2 bg-slate-200 rounded"></div>
              <div className="flex space-x-2">
                <div className="h-6 w-24 bg-slate-200 rounded"></div>
                <div className="h-10 w-10 bg-slate-200 rounded"></div>
                <div className="h-10 w-10 bg-slate-200 rounded"></div>
              </div>
            </div>
            <div className="h-4 w-32 bg-slate-200 rounded"></div>
            <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
            <div className="h-4 w-full bg-slate-200 rounded"></div>
            <div className="h-4 w-2/3 bg-slate-200 rounded"></div>
            <div className="pt-4 flex justify-between">
              <div className="h-6 w-24 bg-slate-200 rounded"></div>
              <div className="h-6 w-24 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="h-6 w-40 bg-slate-200 rounded"></div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 animate-pulse">
              <div className="h-6 w-32 bg-slate-200 rounded mb-4"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center">
                    <div className="h-8 w-8 bg-slate-200 rounded mr-4"></div>
                    <div className="flex-1">
                      <div className="h-4 w-48 bg-slate-200 rounded mb-1"></div>
                      <div className="h-3 w-24 bg-slate-200 rounded"></div>
                    </div>
                    <div className="h-6 w-20 bg-slate-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!assignment || !course) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-3" />
        <h3 className="text-lg font-medium text-slate-900 mb-1">Assignment Not Found</h3>
        <p className="text-slate-500 mb-4">The assignment you're looking for doesn't exist or was deleted</p>
        <Button onClick={() => navigate("/assignments")}>
          Go to Assignments
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button
        variant="ghost"
        className="mb-4 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        onClick={() => navigate("/assignments")}
      >
        <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Assignments
      </Button>
      
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-slate-800">{assignment.title}</h1>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                  {course.code}
                </Badge>
                <Badge variant="outline" className={getStatusColor(assignment.status)}>
                  {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                </Badge>
                <Badge variant="outline" className="bg-slate-100 text-slate-700">
                  {files.length} {files.length === 1 ? 'file' : 'files'}
                </Badge>
              </div>
            </div>
            
            <div className="flex gap-2 mt-2 md:mt-0">
              {assignment.status !== 'submitted' && (
                <Button 
                  variant="outline" 
                  className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                  onClick={() => handleStatusChange('submitted')}
                >
                  Mark as Submitted
                </Button>
              )}
              
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
          
          <Separator className="my-4" />
          
          <div className="mb-4">
            <h3 className="font-medium text-slate-800 mb-2">Description</h3>
            <p className="text-slate-600 whitespace-pre-line">{assignment.description}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between text-sm text-slate-500 mt-4 pt-4 border-t border-slate-100">
            <div>
              <Calendar className="inline-block h-4 w-4 mr-1" /> 
              Due: {assignment.dueDate instanceof Date 
                ? format(assignment.dueDate, 'MMM dd, yyyy') 
                : format(new Date(assignment.dueDate), 'MMM dd, yyyy')}
            </div>
            <div>
              Added: {assignment.createdAt instanceof Date 
                ? format(assignment.createdAt, 'MMM dd, yyyy') 
                : format(new Date(assignment.createdAt), 'MMM dd, yyyy')}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">Files</h2>
          {assignment && course && (
            <FileUploader
              assignmentId={assignment.id!}
              courseId={course.id!}
              onUploadSuccess={handleFileUpload}
            />
          )}
        </div>
        
        <Card>
          <CardContent className="p-6">
            {files.length === 0 ? (
              <div className="text-center py-6">
                <FileText className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">No files uploaded yet</h3>
                <p className="text-slate-500 mb-4">Upload files for this assignment using the button above</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        File Name
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
                    {files.map((file) => (
                      <FileItem 
                        key={file.id} 
                        file={file}
                        uploadTime={file.createdAt instanceof Date 
                          ? format(file.createdAt, 'MMM dd, yyyy') 
                          : format(new Date(file.createdAt), 'MMM dd, yyyy')}
                        showCourse={false}
                        onDelete={() => {
                          setFiles(prev => prev.filter(f => f.id !== file.id));
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Delete Assignment Alert Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the assignment "{assignment.title}" and all of its files.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAssignment}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleting ? "Deleting..." : "Delete Assignment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Edit Assignment Form Dialog */}
      {showEditForm && assignment && (
        <AssignmentForm 
          assignment={assignment}
          onClose={() => setShowEditForm(false)}
          onSuccess={(updatedAssignment) => {
            setAssignment(updatedAssignment);
            setShowEditForm(false);
          }}
          courses={course ? [course] : []}
        />
      )}
    </div>
  );
}
