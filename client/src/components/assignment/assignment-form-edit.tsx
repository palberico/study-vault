import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { updateAssignment, Course, Assignment } from "@/lib/firebase";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, Tag, X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    message: "Title must be at least 3 characters long."
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters long."
  }),
  dueDate: z.date({
    required_error: "Please select a due date."
  }),
  status: z.enum(["pending", "submitted", "overdue"], {
    required_error: "Please select a status."
  }),
  courseId: z.string().min(1, {
    message: "Please select a course."
  }),
  links: z.array(resourceLinkSchema).optional(),
  tags: z.array(z.string()).optional()
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

interface AssignmentEditFormProps {
  assignment: Assignment;
  courses: Course[];
  onCancel: () => void;
  onSuccess: (assignment: Assignment) => void;
}

export default function AssignmentFormEdit({ assignment, courses, onCancel, onSuccess }: AssignmentEditFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [, navigate] = useLocation();

  // Convert dueDate to Date object and ensure it's valid
  let dueDateObj;
  try {
    dueDateObj = assignment.dueDate instanceof Date 
      ? assignment.dueDate 
      : new Date(assignment.dueDate);
    
    // Check if date is valid
    if (isNaN(dueDateObj.getTime())) {
      // If date is invalid, use current date
      dueDateObj = new Date();
    }
  } catch (error) {
    console.error("Error parsing date:", error);
    dueDateObj = new Date(); // Fallback to current date
  }

  const form = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: assignment.title || "",
      description: assignment.description || "",
      dueDate: dueDateObj,
      status: assignment.status as "pending" | "submitted" | "overdue",
      courseId: assignment.courseId || "",
      links: assignment.links || [],
      tags: assignment.tags || []
    }
  });
  
  // Set up field array for resource links
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "links"
  });
  
  async function onSubmit(values: AssignmentFormValues) {
    if (!user) {
      toast({
        title: "Authentication error",
        description: "You must be logged in to update an assignment",
        variant: "destructive"
      });
      return;
    }

    if (!assignment.id) {
      toast({
        title: "Error",
        description: "Cannot update assignment without ID",
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
      
      // Prepare the update data with filtered links
      const updateData = {
        ...values,
        links: filteredLinks.length > 0 ? filteredLinks : []
      };
      
      // Update assignment in Firebase
      await updateAssignment(assignment.id, updateData);
      
      // Create updated assignment object
      const updatedAssignment: Assignment = {
        ...assignment,
        ...updateData
      };
      
      toast({
        title: "Assignment updated",
        description: `${values.title} has been updated successfully`
      });
      
      onSuccess(updatedAssignment);
    } catch (error) {
      console.error("Error updating assignment:", error);
      toast({
        title: "Error",
        description: "Failed to update assignment",
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
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Assignment
      </Button>
      
      <Card className="max-w-[650px] mx-auto">
        <CardHeader>
          <CardTitle>Edit Assignment</CardTitle>
        </CardHeader>
        <CardContent className="max-h-[70vh] overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignment Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. Final Project" 
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
                        placeholder="Describe the assignment requirements..."
                        className="resize-none h-24"
                        {...field} 
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isSubmitting}
                            >
                              {field.value && !isNaN(new Date(field.value).getTime()) ? (
                                format(new Date(field.value), "PPP")
                              ) : (
                                <span>Pick a date</span>
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
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
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
                            <SelectValue placeholder="Select status" />
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
              </div>
              
              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id || ""}>
                            {course.code} - {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Tags Section */}
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem className="mb-6">
                    <FormLabel className="flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      <span>Tags</span>
                    </FormLabel>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {field.value?.map((tag, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary"
                          className="px-2 py-1 text-sm"
                        >
                          {tag}
                          <button
                            type="button"
                            className="ml-1 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              const newTags = [...field.value || []];
                              newTags.splice(index, 1);
                              field.onChange(newTags);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="Add a tag (e.g. 'important', 'research', 'essay')"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && tagInput.trim()) {
                              e.preventDefault();
                              const newTag = tagInput.trim();
                              if (!field.value?.includes(newTag)) {
                                field.onChange([...(field.value || []), newTag]);
                              }
                              setTagInput('');
                            }
                          }}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => {
                          if (tagInput.trim()) {
                            const newTag = tagInput.trim();
                            if (!field.value?.includes(newTag)) {
                              field.onChange([...(field.value || []), newTag]);
                            }
                            setTagInput('');
                          }
                        }}
                        disabled={isSubmitting || !tagInput.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Resource Links Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-base">Resource Links (Optional)</FormLabel>
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
                
                {fields.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic py-2">
                    No resource links added. Click "Add Link" to add resources for this assignment.
                  </div>
                ) : (
                  fields.map((field, index) => (
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
                        disabled={isSubmitting}
                      >
                        ×
                      </Button>
                    </div>
                  ))
                )}
              </div>
              
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
                  {isSubmitting ? "Updating..." : "Update Assignment"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}