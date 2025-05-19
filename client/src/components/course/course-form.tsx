import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { addCourse, updateCourse, uploadGenericFile, type Course } from "@/lib/firebase";
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
import { Label } from "@/components/ui/label";
import { UploadCloud, File } from "lucide-react";

const courseSchema = z.object({
  code: z.string().min(2, {
    message: "Course code must be at least 2 characters."
  }),
  name: z.string().min(3, {
    message: "Course name must be at least 3 characters."
  }),
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
  const [syllabus, setSyllabus] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [syllabusUrl, setSyllabusUrl] = useState<string | null>(course?.syllabusUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!course;

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      code: course?.code || "",
      name: course?.name || "",
      term: course?.term || ""
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
        description: "You must be logged in to create a course",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Handle syllabus upload if a file was selected
      let uploadedSyllabusUrl = syllabusUrl;
      let uploadedSyllabusName = course?.syllabusName || '';
      
      if (syllabus) {
        try {
          setUploadProgress(10);
          // Generate a unique path for the syllabus 
          const courseIdPrefix = isEditing && course?.id ? course.id : 'new-course';
          const syllabusPath = `syllabi/${user.uid}/${courseIdPrefix}/${Date.now()}_${syllabus.name}`;
          
          // Track upload progress
          const uploadResult = await uploadGenericFile(
            syllabus, 
            syllabusPath,
            (progress) => {
              setUploadProgress(Math.round(progress));
            }
          );
          
          uploadedSyllabusUrl = uploadResult.url;
          uploadedSyllabusName = uploadResult.name;
          setUploadProgress(100);
          
          toast({
            title: "Syllabus uploaded",
            description: "Syllabus file has been uploaded successfully"
          });
        } catch (uploadError) {
          console.error("Error uploading syllabus:", uploadError);
          toast({
            title: "Upload Error",
            description: "Failed to upload syllabus file",
            variant: "destructive"
          });
          // Continue with course creation/update even if syllabus upload fails
        }
      }

      if (isEditing && course?.id) {
        // Update existing course
        await updateCourse(course.id, {
          ...values,
          syllabusUrl: uploadedSyllabusUrl || undefined,
          syllabusName: uploadedSyllabusName || undefined,
        });
        
        const updatedCourse: Course = {
          ...course,
          ...values,
          syllabusUrl: uploadedSyllabusUrl || undefined,
          syllabusName: uploadedSyllabusName || undefined,
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
          ...values,
          syllabusUrl: uploadedSyllabusUrl || undefined,
          syllabusName: uploadedSyllabusName || undefined,
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
      setUploadProgress(0);
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
            
            <div className="space-y-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="syllabus">Upload Syllabus</Label>
                <div className="flex items-center gap-2">
                  <input 
                    type="file"
                    id="syllabus"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSyllabus(file);
                      }
                    }}
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-24 border-dashed flex flex-col items-center justify-center gap-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                  >
                    {syllabusUrl || syllabus ? (
                      <>
                        <File className="h-8 w-8 text-primary" />
                        <span className="text-sm text-center text-slate-500 truncate max-w-full px-2">
                          {syllabus?.name || "Syllabus uploaded"}
                        </span>
                        <span className="text-xs text-slate-500">Click to change</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-8 w-8 text-slate-400" />
                        <span className="text-sm text-slate-500">Click to upload syllabus</span>
                        <span className="text-xs text-slate-400">(PDF, DOC, DOCX)</span>
                      </>
                    )}
                  </Button>
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-primary h-1.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            </div>
            
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
