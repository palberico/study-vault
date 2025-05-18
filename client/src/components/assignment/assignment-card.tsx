import { formatDistanceToNow } from "date-fns";
import { Assignment, Course } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText } from "lucide-react";

interface AssignmentCardProps {
  assignment: Assignment;
  courses: Course[];
  onClick?: () => void;
}

export default function AssignmentCard({ assignment, courses, onClick }: AssignmentCardProps) {
  // Find the course this assignment belongs to
  const course = courses.find(c => c.id === assignment.courseId);
  
  // Format the due date
  const formatDueDate = () => {
    if (!assignment.dueDate) return "No due date";
    
    const dueDate = assignment.dueDate instanceof Date 
      ? assignment.dueDate 
      : new Date(assignment.dueDate);
    
    return formatDistanceToNow(dueDate, { addSuffix: true });
  };
  
  // Determine badge colors based on status
  const getStatusColor = () => {
    switch (assignment.status) {
      case "submitted":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };
  
  // Determine course badge color
  const getCourseColor = () => {
    if (!course) return "bg-blue-100 text-blue-800";
    
    const code = course.code.split(' ')[0] || "";
    if (code.startsWith("CS")) return "bg-blue-100 text-blue-800";
    if (code.startsWith("MATH")) return "bg-green-100 text-green-800";
    if (code.startsWith("ENG")) return "bg-purple-100 text-purple-800";
    if (code.startsWith("BIO")) return "bg-red-100 text-red-800";
    
    return "bg-blue-100 text-blue-800";
  };
  
  // Function to limit description text
  const truncateDescription = (text: string, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <Card 
      className="border border-slate-200 overflow-hidden hover:shadow-md transition-all"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={getCourseColor()}>
              {course?.code || "Unknown"}
            </Badge>
            <Badge variant="outline" className={getStatusColor()}>
              {assignment.status === "pending" ? `Due ${formatDueDate()}` : 
               assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 h-8 w-8">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </Button>
        </div>
        
        <h3 className="font-semibold text-lg mb-2">{assignment.title}</h3>
        <p className="text-slate-600 text-sm mb-4 line-clamp-2">
          {truncateDescription(assignment.description)}
        </p>
        
        <div className="flex items-center text-xs text-slate-500">
          <span>
            <Calendar className="inline mr-1 h-3 w-3" /> Due: {
              assignment.dueDate instanceof Date 
                ? assignment.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : new Date(assignment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            }
          </span>
          <span className="ml-4">
            <FileText className="inline mr-1 h-3 w-3" /> {assignment.id ? "Files attached" : "No files"}
          </span>
        </div>
      </CardContent>
      
      <div className="border-t border-slate-200 px-5 py-3 bg-slate-50 flex justify-between items-center">
        <span className="text-xs font-medium text-slate-500">
          Added: {
            assignment.createdAt instanceof Date 
              ? assignment.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : new Date(assignment.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          }
        </span>
        <Button 
          variant="link" 
          className="text-primary hover:text-blue-700 text-sm font-medium p-0 h-auto"
          onClick={onClick}
        >
          View Details
        </Button>
      </div>
    </Card>
  );
}
