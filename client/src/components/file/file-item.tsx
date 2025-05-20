import { useState } from "react";
import { FileItem as FileItemType, deleteFile } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { FileIcon, Download, Trash2 } from "lucide-react";
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

interface FileItemProps {
  file: FileItemType;
  courseName?: string;
  uploadTime: string;
  showCourse?: boolean;
  onDelete?: (fileId: string) => void;
}

export default function FileItem({ 
  file, 
  courseName = "Unknown", 
  uploadTime,
  showCourse = true,
  onDelete 
}: FileItemProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  
  // Get file type icon based on file extension
  const getFileIcon = () => {
    const extension = file.name.split('.').pop()?.toLowerCase() || "";
    
    // Color classes for different file types
    let colorClass = "text-blue-600 bg-blue-100";
    
    if (['pdf'].includes(extension)) {
      colorClass = "text-red-600 bg-red-100";
    } else if (['doc', 'docx'].includes(extension)) {
      colorClass = "text-blue-600 bg-blue-100";
    } else if (['xls', 'xlsx', 'csv'].includes(extension)) {
      colorClass = "text-green-600 bg-green-100";
    } else if (['ppt', 'pptx'].includes(extension)) {
      colorClass = "text-orange-600 bg-orange-100";
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      colorClass = "text-purple-600 bg-purple-100";
    }
    
    return (
      <div className={`flex-shrink-0 h-8 w-8 flex items-center justify-center rounded ${colorClass}`}>
        <FileIcon className="h-4 w-4" />
      </div>
    );
  };
  
  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };
  
  // Handle file download
  const handleDownload = () => {
    if (!file.url) {
      toast({
        title: "Download error",
        description: "File URL is not available",
        variant: "destructive"
      });
      return;
    }
    
    // Create an anchor element and set the href to the file URL
    const anchor = document.createElement('a');
    anchor.href = file.url;
    anchor.target = '_blank';
    anchor.download = file.name;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };
  
  // Handle file deletion
  const handleDelete = async () => {
    if (!file.id) return;
    
    try {
      setIsDeleting(true);
      
      // Check if file has path property first (new uploads will have this)
      let filePath = '';
      
      if ('path' in file && file.path) {
        // Use the stored path directly if available
        filePath = file.path;
      } else {
        // Legacy files: Try to extract path from URL as a fallback
        // This tries to handle files that were uploaded before we added the path field
        try {
          // First try to extract the path from the Firebase storage URL
          // Example: https://firebasestorage.googleapis.com/v0/b/bucket/o/files%2Fuser%2Ffile.pdf?alt=...
          const url = new URL(file.url);
          const pathParam = url.pathname.split('/o/')[1];
          if (pathParam) {
            filePath = decodeURIComponent(pathParam);
          } else {
            // Simple fallback if URL parsing fails
            const filePathStart = file.url.indexOf('files/');
            filePath = filePathStart !== -1 ? decodeURIComponent(file.url.substring(filePathStart).split('?')[0]) : '';
          }
        } catch (urlError) {
          console.error("Error parsing file URL:", urlError);
          // If URL parsing fails, try a simpler approach
          const filePathStart = file.url.indexOf('files/');
          filePath = filePathStart !== -1 ? file.url.substring(filePathStart).split('?')[0] : '';
        }
      }
      
      console.log("Deleting file with path:", filePath);
      
      if (!filePath) {
        throw new Error("Could not determine file path for deletion");
      }
      
      await deleteFile(file.id, filePath);
      
      toast({
        title: "File deleted",
        description: `${file.name} has been deleted successfully`
      });
      
      if (onDelete) {
        onDelete(file.id);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting the file",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteAlert(false);
    }
  };

  return (
    <>
      <tr className="hover:bg-slate-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            {getFileIcon()}
            <div className="ml-4">
              <div className="text-sm font-medium text-slate-900">{file.name}</div>
            </div>
          </div>
        </td>
        {showCourse && (
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-slate-700">{courseName}</div>
          </td>
        )}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-slate-700">{formatFileSize(file.size)}</div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
          {uploadTime}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <Button 
            variant="link" 
            onClick={handleDownload}
            className="text-indigo-600 hover:text-indigo-900 mr-3"
          >
            View
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => file.url ? handleDownload() : null}
            className="text-slate-600 hover:text-slate-900 mr-1"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowDeleteAlert(true)}
            className="text-red-600 hover:text-red-900"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </td>
      </tr>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the file "{file.name}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete File"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
