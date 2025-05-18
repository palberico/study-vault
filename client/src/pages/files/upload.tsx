import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getCourse, getAssignment, uploadFile, type FileItem } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { UploadCloud, X, FileText, File, ArrowLeft } from "lucide-react";

export default function FileUploadPage() {
  const [, params] = useRoute("/files/upload");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // URL params
  const searchParams = new URLSearchParams(window.location.search);
  const assignmentId = searchParams.get("assignmentId") || "";
  const courseId = searchParams.get("courseId") || "";
  
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [assignment, setAssignment] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  
  useEffect(() => {
    async function loadData() {
      if (!assignmentId || !courseId) {
        navigate("/");
        return;
      }
      
      try {
        const assignmentData = await getAssignment(assignmentId);
        const courseData = await getCourse(courseId);
        
        if (!assignmentData || !courseData) {
          navigate("/");
          return;
        }
        
        setAssignment(assignmentData);
        setCourse(courseData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Could not load assignment details. Please try again.",
          variant: "destructive",
        });
        navigate("/");
      }
    }
    
    loadData();
  }, [assignmentId, courseId, navigate, toast]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };
  
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };
  
  const handleUpload = async () => {
    if (!files.length || !user || !assignmentId || !courseId) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await uploadFile(file, assignmentId, courseId, user.uid);
        setUploadProgress(((i + 1) / files.length) * 100);
      }
      
      toast({
        title: "Success",
        description: `${files.length} file${files.length !== 1 ? 's' : ''} uploaded successfully.`,
      });
      
      // Return to assignment page
      navigate(`/assignments/${assignmentId}`);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast({
        title: "Error",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };
  
  // Get file icon based on file type
  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (['pdf'].includes(extension || '')) return 'PDF';
    if (['doc', 'docx'].includes(extension || '')) return 'DOC';
    if (['xls', 'xlsx'].includes(extension || '')) return 'XLS';
    if (['ppt', 'pptx'].includes(extension || '')) return 'PPT';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) return 'IMG';
    
    return 'FILE';
  };
  
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  if (!assignment || !course) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center h-40">
              <p>Loading assignment details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-10">
      <Button 
        variant="ghost" 
        onClick={() => navigate(`/assignments/${assignmentId}`)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Assignment
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
          <CardDescription>
            Upload files for {assignment.title} in {course.name} ({course.code})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <UploadCloud className="h-10 w-10 text-gray-400 mx-auto mb-4" />
              <Label htmlFor="file-upload" className="text-sm font-medium block mb-1 cursor-pointer">
                Click to upload or drag and drop
              </Label>
              <p className="text-xs text-slate-500">
                PDF, Word, Excel, PowerPoint, and image files up to 10MB
              </p>
              <Input
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
              />
            </div>
            
            {files.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Selected Files ({files.length})</h3>
                <div className="space-y-2 max-h-60 overflow-auto p-1">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between border rounded-md p-3 bg-slate-50">
                      <div className="flex items-center">
                        <div className="flex justify-center items-center h-10 w-10 rounded bg-blue-100 text-blue-700 mr-3 text-xs font-medium">
                          {getFileIcon(file)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {uploading && (
              <div className="mt-4">
                <div className="flex justify-between mb-1">
                  <p className="text-sm">Uploading...</p>
                  <p className="text-sm">{Math.round(uploadProgress)}%</p>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
            
            <div className="flex justify-end mt-4 space-x-2">
              <Button variant="outline" onClick={() => navigate(`/assignments/${assignmentId}`)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={files.length === 0 || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload Files'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}