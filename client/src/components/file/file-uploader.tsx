import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { uploadFile, type FileItem } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Upload, FileUp, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";

interface FileUploaderProps {
  assignmentId: string;
  courseId: string;
  onUploadSuccess: (file: FileItem) => void;
}

export default function FileUploader({ 
  assignmentId, 
  courseId, 
  onUploadSuccess 
}: FileUploaderProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      
      // Clear the input value to ensure the change event fires again
      // even if the same file is selected twice in a row
      setTimeout(() => {
        if (e.target) {
          e.target.value = '';
        }
      }, 100);
    }
  };
  
  const handleFileUpload = async () => {
    if (!selectedFile || !user) {
      toast({
        title: "Error",
        description: "Please select a file to upload or sign in",
        variant: "destructive"
      });
      return;
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (selectedFile.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 5;
      });
    }, 150);
    
    try {
      const docRef = await uploadFile(
        selectedFile,
        assignmentId,
        courseId,
        user.uid
      );
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      const filePath = `files/${user.uid}/${assignmentId}/${selectedFile.name}`;
      const newFile: FileItem = {
        id: docRef.id,
        userId: user.uid,
        assignmentId,
        courseId,
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        url: "", // The actual URL is set by Firebase in the backend
        path: filePath, // Add the path for storage reference
        createdAt: new Date()
      };
      
      toast({
        title: "File uploaded",
        description: `${selectedFile.name} has been uploaded successfully`
      });
      
      onUploadSuccess(newFile);
      setTimeout(() => {
        setDialogOpen(false);
        setSelectedFile(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }, 1000);
    } catch (error) {
      console.error("Error uploading file:", error);
      clearInterval(progressInterval);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center">
          <Upload className="mr-2 h-4 w-4" /> Upload File
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Upload a file to this assignment. Supported file types include PDFs, documents, and images.
          </DialogDescription>
        </DialogHeader>
        
        <div className="my-6">
          <div 
            className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.currentTarget.classList.add('border-primary', 'bg-blue-50');
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.currentTarget.classList.remove('border-primary', 'bg-blue-50');
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.currentTarget.classList.remove('border-primary', 'bg-blue-50');
              
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                setSelectedFile(e.dataTransfer.files[0]);
              }
            }}
          >
            {selectedFile ? (
              <div className="space-y-2">
                <FileUp className="mx-auto h-10 w-10 text-slate-400" />
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            ) : (
              <>
                <FileUp className="mx-auto h-10 w-10 text-slate-400" />
                <p className="mt-2 text-sm font-medium">Click to select a file</p>
                <p className="text-xs text-slate-500 mt-1">or drag and drop here</p>
              </>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </div>
          
          {isUploading && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setDialogOpen(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={handleFileUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload File'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
