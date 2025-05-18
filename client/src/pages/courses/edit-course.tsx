import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getCourse } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CourseForm from "@/components/course/course-form";
import { ArrowLeft } from "lucide-react";

export default function EditCoursePage({ id }: { id: string }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCourse() {
      if (!id) {
        navigate("/courses");
        return;
      }

      try {
        setLoading(true);
        const courseData = await getCourse(id);
        setCourse(courseData);
      } catch (error) {
        console.error("Error loading course:", error);
        setError("Failed to load course. Please try again.");
        toast({
          title: "Error",
          description: "Failed to load course details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadCourse();
  }, [id, navigate, toast]);

  const handleSuccess = () => {
    toast({
      title: "Success",
      description: "Course updated successfully",
    });
    navigate(`/courses/${id}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center h-40">
              <p>Loading course details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col justify-center items-center h-40">
              <p className="text-red-500 mb-4">{error || "Course not found"}</p>
              <Button onClick={() => navigate("/courses")}>Go back to courses</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Button 
        variant="ghost" 
        onClick={() => navigate(`/courses/${id}`)} 
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle>Edit Course</CardTitle>
        </CardHeader>
        <CardContent>
          <CourseForm 
            course={course} 
            onClose={() => navigate(`/courses/${id}`)} 
            onSuccess={handleSuccess} 
          />
        </CardContent>
      </Card>
    </div>
  );
}