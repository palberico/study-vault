import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { addCourse, updateCourse, type Course } from "@/lib/firebase";
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

const courseSchema = z.object({
  code: z.string().min(2, {
    message: "Course code must be at least 2 characters."
  }),
  name: z.string().min(3, {
    message: "Course name must be at least 3 characters."
  }),
  description: z.string().optional(),
  term: z.string().min(1, {
    message: "Please select a term."
  })
});

type CourseFormValues = z.infer<typeof courseSchema>;

interface CourseFormProps {
  course?: Course;
  onClose: () => void;
  onSuccess: (course: Course) => void;
}

export default function CourseForm({ course, onClose, onSuccess }: CourseFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!course;

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      code: course?.code || "",
      name: course?.name || "",
      description: course?.description || "",
      term: course?.term || ""
    }
  });

  const availableTerms = [
    "Spring 2025",
    "Summer 2025",
    "Fall 2025", 
    "Winter 2025",
    "Spring 2026",
    "Summer 2026",
    "Fall 2026",
    "Winter 2026",
    "Spring 2027",
    "Summer 2027",
    "Fall 2027",
    "Winter 2027",
    "Spring 2028",
    "Summer 2028",
    "Fall 2028",
    "Winter 2028"
  ];

  async function onSubmit(values: CourseFormValues) {
    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to create a course",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing && course.id) {
        // Update existing course
        await updateCourse(course.id, values);
        
        const updatedCourse: Course = {
          ...course,
          ...values
        };
        
        toast({
          title: "Course updated",
          description: `${values.name} has been updated successfully`
        });
        
        onSuccess(updatedCourse);
      } else {
        // Create new course
        const courseData = {
          userId: user.uid,
          ...values
        };
        
        const docRef = await addCourse(courseData);
        const newCourse: Course = {
          id: docRef.id,
          ...courseData,
          createdAt: new Date()
        };
        
        toast({
          title: "Course created",
          description: `${values.name} has been created successfully`
        });
        
        onSuccess(newCourse);
      }
    } catch (error) {
      console.error("Error saving course:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} course`,
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
          <DialogTitle>{isEditing ? "Edit Course" : "Add New Course"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Update your course details below" 
              : "Enter the details for your new course"}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Code</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. CS 101" 
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Introduction to Computer Science" 
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
                  <FormLabel>Course Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the course"
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
              name="term"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Term</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a term" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableTerms.map((term) => (
                        <SelectItem key={term} value={term}>
                          {term}
                        </SelectItem>
                      ))}
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
                  : (isEditing ? "Update Course" : "Add Course")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
