import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  addAssignment, 
  updateAssignment, 
  getUserCourses, 
  db, 
  type Assignment, 
  type Course 
} from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
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
// useEffect is already imported at the top
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const resourceLinkSchema = z.object({
  label: z.string().min(1, {
    message: "Link label is required."
  }),
  url: z.string().url({
    message: "Please enter a valid URL."
  })
});

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
  status: z.enum(["pending", "submitted", "overdue"]),
  links: z.array(resourceLinkSchema).optional()
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
      status: assignment?.status || "pending",
      links: assignment?.links || [{ label: "", url: "" }]
    }
  });
  
  // Set up field array for resource links
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "links"
  });

  // Check for a course ID in the URL or localStorage
  useEffect(() => {
    // First check if we have courses from props
    if (propCourses && propCourses.length > 0) {
      console.log("Using provided courses:", propCourses);
      setCourses(propCourses);
      return;
    }
    
    // Then check URL parameters for courseId
    const params = new URLSearchParams(window.location.search);
    const urlCourseId = params.get('courseId');
    
    // Or check localStorage for a selected course
    const storedCourseId = localStorage.getItem('selectedCourseId');
    
    if (urlCourseId || storedCourseId) {
      const courseId = urlCourseId || storedCourseId;
      console.log("Found course ID in params/storage:", courseId);
      
      // If we have a courseId, set it in the form
      if (courseId) {
        form.setValue("courseId", courseId);
      }
    }
    
    // Always fetch courses to populate the dropdown
    async function fetchCourses() {
      if (!user) return;
      
      try {
        setIsLoadingCourses(true);
        console.log("Fetching courses for user:", user.uid);
        
        const coursesData = await getUserCourses(user.uid);
        console.log("Fetched courses:", coursesData);
        
        if (Array.isArray(coursesData) && coursesData.length > 0) {
          setCourses(coursesData);
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
    
    // Clean up localStorage after use
    return () => {
      localStorage.removeItem('selectedCourseId');
    };
  }, [user, toast, propCourses, form]);

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
      // Filter out empty links
      const filteredLinks = values.links ? values.links.filter(link => 
        link.label.trim() !== "" && link.url.trim() !== ""
      ) : [];
      
      if (isEditing && assignment.id) {
        // Update existing assignment
        const updateData = {
          ...values,
          links: filteredLinks.length > 0 ? filteredLinks : []
        };
        
        await updateAssignment(assignment.id, updateData);
        
        const updatedAssignment: Assignment = {
          ...assignment,
          ...updateData
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
          ...values,
          links: filteredLinks.length > 0 ? filteredLinks : []
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
            
            {/* Resource Links Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel className="text-base">Resource Links</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ label: "", url: "" })}
                  disabled={isSubmitting}
                >
                  Add Link
                </Button>
              </div>
              
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2 bg-secondary/20 p-2 rounded-md">
                  <FormField
                    control={form.control}
                    name={`links.${index}.label`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">Label</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isSubmitting} placeholder="e.g., Lecture Video" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name={`links.${index}.url`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">URL</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isSubmitting} placeholder="https://..." />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => remove(index)}
                    disabled={isSubmitting || fields.length === 1}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
            
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
