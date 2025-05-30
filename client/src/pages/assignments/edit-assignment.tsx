import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getAssignment, getUserCourses } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AssignmentFormEdit from "@/components/assignment/assignment-form-edit";

export default function EditAssignmentPage({ id }: { id: string }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    async function loadData() {
      if (!id || !user) {
        navigate("/assignments");
        return;
      }

      try {
        setLoading(true);
        
        // Load assignment data
        const assignmentData = await getAssignment(id);
        setAssignment(assignmentData);
        
        // Load courses for the form
        const coursesData = await getUserCourses(user.uid);
        setCourses(coursesData);
      } catch (error) {
        console.error("Error loading data:", error);
        setError("Failed to load assignment. Please try again.");
        toast({
          title: "Error",
          description: "Failed to load assignment details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, navigate, toast, user]);

  const handleSuccess = () => {
    toast({
      title: "Success",
      description: "Assignment updated successfully",
    });
    navigate(`/assignments/${id}`);
  };

  if (loading) {
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

  if (error || !assignment) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col justify-center items-center h-40">
              <p className="text-red-500 mb-4">{error || "Assignment not found"}</p>
              <Button onClick={() => navigate("/assignments")}>Go back to assignments</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AssignmentFormEdit
      assignment={assignment}
      courses={courses}
      onCancel={() => navigate(`/assignments/${id}`)}
      onSuccess={handleSuccess}
    />
  );
}