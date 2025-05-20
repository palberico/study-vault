import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getUserFiles, getUserCourses, type FileItem, type Course } from "@/lib/firebase";
import FileItemComponent from "@/components/file/file-item";
import { Search, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow } from "date-fns";

// Helper function to safely format timestamps from various sources
const safeRelativeTime = (value: any): string => {
  try {
    if (!value) return "Unknown date";
    
    // If it's a Firestore Timestamp (has seconds and nanoseconds)
    if (typeof value === 'object' && 'seconds' in value && typeof value.seconds === 'number') {
      return formatDistanceToNow(new Date(value.seconds * 1000), { addSuffix: true });
    }
    
    // If it's already a Date object
    if (value instanceof Date) {
      return formatDistanceToNow(value, { addSuffix: true });
    }
    
    // Handle string or number timestamp
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return "Unknown date";
    }
    
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Unknown date";
  }
};

export default function FilesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [files, setFiles] = useState<FileItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>("all");
  
  useEffect(() => {
    async function fetchFiles() {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const [filesData, coursesData] = await Promise.all([
          getUserFiles(user.uid),
          getUserCourses(user.uid)
        ]);
        
        setFiles(filesData);
        setCourses(coursesData);
      } catch (error) {
        console.error("Error fetching files:", error);
        toast({
          title: "Error",
          description: "Failed to load your files",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchFiles();
  }, [user, toast]);
  
  // Get unique file types
  const fileTypes = Array.from(new Set(files.map(file => {
    const extension = file.name.split('.').pop()?.toLowerCase() || "";
    if (['pdf', 'doc', 'docx'].includes(extension)) {
      return extension;
    }
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return 'image';
    }
    if (['ppt', 'pptx'].includes(extension)) {
      return 'presentation';
    }
    if (['xls', 'xlsx', 'csv'].includes(extension)) {
      return 'spreadsheet';
    }
    return 'other';
  })));
  
  const filteredFiles = files.filter(file => {
    // Text search filter
    const textMatch = file.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Course filter
    const courseMatch = courseFilter === "all" || file.courseId === courseFilter;
    
    // File type filter
    const extension = file.name.split('.').pop()?.toLowerCase() || "";
    let fileType = 'other';
    
    if (['pdf', 'doc', 'docx'].includes(extension)) {
      fileType = extension;
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      fileType = 'image';
    } else if (['ppt', 'pptx'].includes(extension)) {
      fileType = 'presentation';
    } else if (['xls', 'xlsx', 'csv'].includes(extension)) {
      fileType = 'spreadsheet';
    }
    
    const typeMatch = fileTypeFilter === "all" || fileType === fileTypeFilter;
    
    return textMatch && courseMatch && typeMatch;
  });
  
  const handleFileDeleted = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Your Files</h1>
        <p className="text-slate-500">
          Access and manage all your uploaded assignment files
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="relative w-full md:w-1/2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <Input
            type="text"
            placeholder="Search files by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map(course => (
                <SelectItem key={course.id} value={course.id || ""}>
                  {course.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="File Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {fileTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 animate-pulse">
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
                      <tr key={i}>
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
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              {searchTerm || courseFilter !== "all" || fileTypeFilter !== "all" ? (
                <>
                  <Search className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                  <h3 className="text-lg font-medium text-slate-900 mb-1">No matching files found</h3>
                  <p className="text-slate-500 mb-4">Try adjusting your search or filters</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchTerm("");
                      setCourseFilter("all");
                      setFileTypeFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                </>
              ) : (
                <>
                  <FileText className="mx-auto h-12 w-12 text-slate-400 mb-3" />
                  <h3 className="text-lg font-medium text-slate-900 mb-1">No files uploaded yet</h3>
                  <p className="text-slate-500 mb-4">Upload files to your assignments to see them here</p>
                </>
              )}
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
                  {filteredFiles.map((file) => {
                    const course = courses.find(c => c.id === file.courseId);
                    return (
                      <FileItemComponent 
                        key={file.id} 
                        file={file}
                        courseName={course?.name || 'Unknown Course'}
                        uploadTime={safeRelativeTime(file.createdAt)}
                        onDelete={handleFileDeleted}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
