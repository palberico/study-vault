import { useLocation } from "wouter";
import { Course } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CourseCardProps {
  course: Course;
  assignmentCount: number;
  onClick?: () => void;
}

export default function CourseCard({ course, assignmentCount, onClick }: CourseCardProps) {
  const [, navigate] = useLocation();

  // Generate background image and color based on course code
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
    
    const code = course.code.split(' ')[0] || "";
    for (const [prefix, color] of Object.entries(colors)) {
      if (code.startsWith(prefix)) {
        return color;
      }
    }
    
    return "from-blue-800/40 to-blue-900/70"; // Default
  };

  const getCourseStatusColor = () => {
    const code = course.code.split(' ')[0] || "";
    if (code.startsWith("CS")) return "bg-blue-500";
    if (code.startsWith("MATH")) return "bg-green-500";
    if (code.startsWith("ENG")) return "bg-purple-500";
    if (code.startsWith("BIO")) return "bg-red-500";
    return "bg-blue-500"; // Default
  };

  const getCourseBackgroundImage = () => {
    const code = course.code.split(' ')[0] || "";
    
    if (code.startsWith("CS")) {
      return "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=250&q=80";
    } 
    if (code.startsWith("MATH")) {
      return "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=250&q=80";
    }
    if (code.startsWith("ENG")) {
      return "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=250&q=80";
    }
    
    // Default image - digital organization
    return "https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&h=250&q=80";
  };

  // Function to handle click on the card
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (course.id) {
      navigate(`/courses/${course.id}`);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all border border-slate-200" onClick={handleClick}>
      <div className="h-36 bg-cover bg-center" style={{ backgroundImage: `url('${getCourseBackgroundImage()}')` }}>
        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-b ${getBackgroundColor()}`}>
          <span className="text-white font-bold text-xl">{course.code}</span>
        </div>
      </div>
      <CardContent className="p-5">
        <h3 className="font-semibold text-lg mb-1">{course.name}</h3>
        <p className="text-slate-600 text-sm mb-3 line-clamp-1">{course.description || "No description"}</p>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-600">
            <BookOpen className="inline-block h-4 w-4 mr-1" /> {assignmentCount} {assignmentCount === 1 ? 'assignment' : 'assignments'}
          </span>
          <span className="text-slate-600">
            <Calendar className="inline-block h-4 w-4 mr-1" /> {course.term}
          </span>
        </div>
      </CardContent>
      <div className="border-t border-slate-200 px-5 py-3 bg-slate-50 flex justify-between items-center">
        <span className="text-xs font-medium">
          <span className={`inline-block w-2 h-2 rounded-full ${getCourseStatusColor()} mr-2`}></span>
          Active
        </span>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs"
            onClick={(e) => {
              e.stopPropagation();
              // Store course ID in localStorage for assignment form
              localStorage.setItem('selectedCourseId', course.id || '');
              navigate(`/assignments/new?courseId=${course.id}`);
            }}
          >
            Add Assignment
          </Button>
          <Button variant="link" className="text-primary hover:text-blue-700 text-sm font-medium p-0 h-auto">
            View Course
          </Button>
        </div>
      </div>
    </Card>
  );
}
