import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { addAssignment, updateAssignment, getUserCourses, type Assignment, type Course } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const assignmentSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters."
  }),
  description: z.string().min(5, {
    message: "Description must be at least 5 characters."
  }),
  courseId: z.string().min(1, {
    message: "Please select a course."
  }),
  dueDate: z.date({
    required_error: "Please select a due date."
  }),
  status: z.enum(["pending", "submitted", "overdue"])
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

interface AssignmentFormProps {
  assignment?: Assignment;
  courseId?: string;
  onClose: () => void;
  onSuccess: (assignment: Assignment) => void;
  courses?: Course[];
}

export default function AssignmentForm({ 
  assignment, 
  courseId, 
  onClose, 
  onSuccess,
  courses: propCourses 
}: AssignmentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [courses, setCourses] = useState<Course[]>(propCourses || []);
  const [isLoadingCourses, setIsLoadingCourses] = useState(!propCourses);
  const isEditing = !!assignment;

  // Initialize form
  const defaultDate = assignment?.dueDate 
    ? (assignment.dueDate instanceof Date 
        ? assignment.dueDate 
        : new Date(assignment.dueDate)) 
    : new Date();
  
  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: assignment?.title || "",
      description: assignment?.description || "",
      courseId: assignment?.courseId || courseId || "",
      dueDate: defaultDate,
      status: assignment?.status || "pending"
    }
  });

  // Fetch courses if not provided
  // Use prop courses if provided, otherwise fetch from Firebase
  useEffect(() => {
    if (propCourses && propCourses.length > 0) {
      console.log("Using provided courses:", propCourses);
      setCourses(propCourses);
      return;
    }
    
    async function fetchCourses() {
      if (!user) return;
      
      try {
        setIsLoadingCourses(true);
        console.log("Fetching courses for user:", user.uid);
        
        // Try to get courses directly from Firestore collection
        const coursesCollectionRef = collection(db, "courses");
        const q = query(coursesCollectionRef, where("userId", "==", user.uid));
        
        const querySnapshot = await getDocs(q);
        const fetchedCourses = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Course[];
        
        console.log("Directly fetched courses:", fetchedCourses);
        
        if (fetchedCourses && fetchedCourses.length > 0) {
          setCourses(fetchedCourses);
        } else {
          console.log("No courses found");
          setCourses([]);
          toast({
            title: "No courses found",
            description: "Please create a course first",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
        setCourses([]);
        toast({
          title: "Error loading courses",
          description: "Please try again or add a course first",
          variant: "destructive"
        });
      } finally {
        setIsLoadingCourses(false);
      }
    }
    
    fetchCourses();
  }, [user, toast, propCourses, db]);

  async function onSubmit(values: AssignmentFormValues) {
    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to create an assignment",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && assignment.id) {
        // Update existing assignment
        await updateAssignment(assignment.id, values);
        
        const updatedAssignment: Assignment = {
          ...assignment,
          ...values
        };
        
        toast({
          title: "Assignment updated",
          description: `${values.title} has been updated successfully`
        });
        
        onSuccess(updatedAssignment);
      } else {
        // Create new assignment
        const assignmentData = {
          userId: user.uid,
          ...values
        };
        
        const docRef = await addAssignment(assignmentData);
        const newAssignment: Assignment = {
          id: docRef.id,
          ...assignmentData,
          createdAt: new Date()
        };
        
        toast({
          title: "Assignment created",
          description: `${values.title} has been created successfully`
        });
        
        onSuccess(newAssignment);
      }
    } catch (error) {
      console.error("Error saving assignment:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} assignment`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Assignment" : "Add New Assignment"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update your assignment details below" 
              : "Enter the details for your new assignment"}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Assignment title" 
                      {...field} 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Description of the assignment"
                      className="resize-none h-20"
                      {...field} 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="courseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting || isLoadingCourses || !!courseId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingCourses ? (
                        <SelectItem value="loading" disabled>Loading courses...</SelectItem>
                      ) : courses.length === 0 ? (
                        <SelectItem value="empty" disabled>No courses available</SelectItem>
                      ) : (
                        courses.map((course) => (
                          <SelectItem key={course.id} value={course.id || ""}>
                            {course.code} - {course.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                          disabled={isSubmitting}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Select a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting 
                  ? (isEditing ? "Updating..." : "Creating...") 
                  : (isEditing ? "Update Assignment" : "Add Assignment")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
