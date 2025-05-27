import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  getAssignment,
  getCourse,
  getAssignmentFiles,
  deleteAssignment,
  updateAssignment,
  getUserSummaries,
  type Assignment,
  type Course,
  type FileItem as FirebaseFileItem,
  type Summary
} from "@/lib/firebase";
import FileUploader from "@/components/file/file-uploader";
import { Button } from "@/components/ui/button";
import {
  TrashIcon,
  PencilIcon,
  ArrowLeftIcon,
  Calendar,
  AlertTriangle,
  FileText,
  Tag
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
import AssignmentFormEdit from "@/components/assignment/assignment-form-edit";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import FileItemComponent from "@/components/file/file-item";

export default function AssignmentDetailPage({ id }: { id: string }) {
  // ID is now passed as a prop directly
  
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [files, setFiles] = useState<FirebaseFileItem[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Component is now using id directly from props

  useEffect(() => {
    async function fetchAssignmentData() {
      if (!user) return;
      
      // Validate the assignment ID
      if (!id || typeof id !== 'string' || id.trim() === '') {
        toast({
          title: "Invalid Assignment",
          description: "The assignment ID is invalid or missing",
          variant: "destructive",
        });
        navigate("/assignments");
        return;
      }

      try {
        setIsLoading(true);
        const assignmentId = id.trim();
        console.log("Fetching assignment with ID:", assignmentId);
        const assignmentData = await getAssignment(assignmentId);
        
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
        if (assignmentData.courseId) {
          try {
            const courseData = await getCourse(assignmentData.courseId);
            setCourse(courseData);
          } catch (courseError) {
            console.error("Error fetching course data:", courseError);
            // Continue even if course fetch fails
          }
        }
        
        try {
          const filesData = await getAssignmentFiles(id);
          setFiles(filesData);
        } catch (filesError) {
          console.error("Error fetching files:", filesError);
          // Continue even if files fetch fails
          setFiles([]);
        }

        // Fetch summaries related to this assignment
        try {
          const allSummaries = await getUserSummaries(user.uid);
          console.log("All summaries fetched:", allSummaries.length);
          console.log("Assignment ID we're looking for:", id);
          
          // Filter summaries for this specific assignment
          const assignmentSummaries = allSummaries.filter(summary => {
            console.log("Checking summary:", summary.title, "assignmentId:", summary.assignmentId, "against:", id);
            return summary.assignmentId === id;
          });
          
          // Also check summaries for this course if no assignment-specific ones found
          if (assignmentSummaries.length === 0 && assignmentData.courseId) {
            console.log("No assignment-specific summaries found, checking course summaries...");
            const courseSummaries = allSummaries.filter(summary => 
              summary.courseId === assignmentData.courseId && !summary.assignmentId
            );
            console.log("Course summaries found:", courseSummaries.length);
          }
          
          console.log("Final filtered summaries:", assignmentSummaries.length);
          setSummaries(assignmentSummaries);
        } catch (summariesError) {
          console.error("Error fetching summaries:", summariesError);
          setSummaries([]);
        }
        
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

  const handleFileUpload = (newFile: FirebaseFileItem) => {
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
                  className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700"
                  onClick={async () => {
                    if (!assignment.id) return;
                    try {
                      await updateAssignment(assignment.id, { status: 'submitted' });
                      setAssignment({
                        ...assignment,
                        status: 'submitted'
                      });
                      toast({
                        title: "Assignment submitted",
                        description: "Assignment status has been updated to submitted",
                      });
                    } catch (error) {
                      console.error("Error marking assignment as submitted:", error);
                      toast({
                        title: "Error",
                        description: "Could not update the assignment status",
                        variant: "destructive"
                      });
                    }
                  }}
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
          
          {/* Tags Section */}
          <div className="mb-4">
            <h3 className="font-medium text-slate-800 mb-2 flex items-center">
              <Tag className="h-4 w-4 mr-2" />
              Tags
            </h3>
            {assignment.tags && assignment.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {assignment.tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm italic">No tags added yet. Edit this assignment to add tags for better organization.</p>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between text-sm text-slate-500 mt-4 pt-4 border-t border-slate-100">
            <div>
              <Calendar className="inline-block h-4 w-4 mr-1" /> 
              Due: {(() => {
                try {
                  if (!assignment.dueDate) return 'No due date';
                  
                  let date;
                  if (assignment.dueDate instanceof Date) {
                    date = assignment.dueDate;
                  } else if (typeof assignment.dueDate === 'object' && assignment.dueDate !== null && 'toDate' in assignment.dueDate) {
                    date = (assignment.dueDate as any).toDate();
                  } else {
                    date = new Date(assignment.dueDate);
                  }
                  
                  if (isNaN(date.getTime())) return 'Invalid date';
                  return format(date, 'MMM dd, yyyy');
                } catch (error) {
                  console.error('Date formatting error:', error);
                  return 'Invalid date';
                }
              })()}
            </div>
            {/* Removed "Date Added" information as requested */}
          </div>
        </CardContent>
      </Card>
      
      {/* Resource Links Section */}
      {assignment.links && assignment.links.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Resource Links</h2>
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignment.links.map((link, index) => (
                  <a 
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col p-4 border border-slate-200 rounded-lg hover:border-primary hover:shadow-md transition-all bg-white"
                  >
                    <div className="flex items-center justify-center h-32 bg-slate-100 rounded-md mb-3 overflow-hidden">
                      <div className="bg-primary/10 p-4 rounded-full group-hover:bg-primary/20 transition-colors">
                        <FileText className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <h3 className="font-medium text-slate-800 group-hover:text-primary truncate mb-1">
                      {link.label}
                    </h3>
                    <p className="text-sm text-slate-500 truncate">{link.url}</p>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Files Section */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                  <div key={file.id} className="border border-slate-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-all">
                    <div className="flex items-center justify-center h-32 bg-slate-100 overflow-hidden relative">
                      {file.type.includes('image') ? (
                        <img src={file.url} alt={file.name} className="object-cover w-full h-full" />
                      ) : (
                        <div className="bg-slate-200 p-4 rounded-full">
                          <FileText className="h-8 w-8 text-slate-600" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-2">
                          <h3 className="font-medium text-slate-800 truncate mb-1">
                            {file.name}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB • Uploaded recently
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(file.url, '_blank')}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setFiles(prev => prev.filter(f => f.id !== file.id));
                            }}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summaries Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">AI Summaries</h2>
        </div>
        
        <Card>
          <CardContent className="p-6">
            {summaries.length === 0 ? (
              <div className="text-center py-6">
                <FileText className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">No summaries created yet</h3>
                <p className="text-slate-500 mb-4">Create AI-powered summaries for this assignment using the Smart Summarizer</p>
                {user?.isPro && (
                  <Button 
                    onClick={() => navigate("/pro-dashboard")}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Create Summary
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {summaries.map((summary) => (
                  <div 
                    key={summary.id} 
                    className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer bg-white"
                    onClick={() => navigate(`/summaries/${summary.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-2 hover:text-blue-600 transition-colors">
                          {summary.title}
                        </h4>
                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                          {summary.overview.length > 150 
                            ? `${summary.overview.substring(0, 150)}...` 
                            : summary.overview}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>📖 {summary.mainPoints.length} main points</span>
                          <span>🔑 {summary.keyTerms.length} key terms</span>
                          {summary.originalDocumentName && (
                            <span>📄 {summary.originalDocumentName}</span>
                          )}
                          <span>
                            {(() => {
                              try {
                                const date = summary.createdAt?.toDate ? summary.createdAt.toDate() : new Date(summary.createdAt);
                                return `Created ${format(date, 'MMM dd, yyyy')}`;
                              } catch (error) {
                                return 'Recently created';
                              }
                            })()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex items-center">
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                          View Summary →
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
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
      
      {/* Edit Assignment Form */}
      {showEditForm && assignment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full mx-auto" onClick={(e) => e.stopPropagation()}>
            <AssignmentFormEdit 
              assignment={assignment}
              courses={course ? [course] : []}
              onCancel={() => setShowEditForm(false)}
              onSuccess={(updatedAssignment: Assignment) => {
                setAssignment(updatedAssignment);
                setShowEditForm(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
