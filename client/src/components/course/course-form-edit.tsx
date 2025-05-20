import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { updateCourse, type Course } from "@/lib/firebase";
import { useLocation } from "wouter";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

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

interface CourseEditFormProps {
  course: Course;
  onCancel: () => void;
  onSuccess: (course: Course) => void;
}

export default function CourseFormEdit({ course, onCancel, onSuccess }: CourseEditFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, navigate] = useLocation();

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      code: course.code || "",
      name: course.name || "",
      description: course.description || "",
      term: course.term || ""
    }
  });

  const availableTerms = [
    "May 2025",
    "August 2025",
    "October 2025", 
    "January 2026",
    "March 2026",
    "May 2026",
  ];

  async function onSubmit(values: CourseFormValues) {
    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to update a course",
        variant: "destructive"
      });
      return;
    }

    if (!course.id) {
      toast({
        title: "Error",
        description: "Cannot update course without ID",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Update course in Firebase
      await updateCourse(course.id, values);
      
      // Create updated course object
      const updatedCourse: Course = {
        ...course,
        ...values
      };
      
      toast({
        title: "Course updated",
        description: `${values.name} has been updated successfully`
      });
      
      onSuccess(updatedCourse);
    } catch (error) {
      console.error("Error updating course:", error);
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto py-6">
      <Button 
        variant="ghost" 
        onClick={onCancel}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Course
      </Button>
      
      <Card className="max-w-[650px] mx-auto">
        <CardHeader>
          <CardTitle>Edit Course</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[70vh] overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
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
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Update Course"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}