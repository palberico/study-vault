import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Bot, Sparkles, Zap, LineChart, FileBarChart, BookOpen, Users, Flame, Upload, FileUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { extractTextFromFile } from "@/lib/file-processor";
import { processSyllabusWithAI, type SyllabusData, type SyllabusAssignment } from "@/lib/openrouter-service";
import { addCourse, addAssignment, type Course, type Assignment } from "@/lib/firebase";

// Dummy data for visualizations
const studyTimeData = [
  { day: "Mon", hours: 3 },
  { day: "Tue", hours: 4 },
  { day: "Wed", hours: 2 },
  { day: "Thu", hours: 5 },
  { day: "Fri", hours: 4 },
  { day: "Sat", hours: 1 },
  { day: "Sun", hours: 2 },
];

const assignmentCompletionRate = 78;
const totalAssignments = 24;
const upcomingDeadlines = 5;

export default function ProDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSyllabusModalOpen, setSyllabusModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect non-pro users away
  React.useEffect(() => {
    if (user && !user.isPro) {
      toast({
        title: "Pro Access Required",
        description: "This area is exclusively for Pro users.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, navigate, toast]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    // Check if file is PDF or DOC/DOCX
    const fileType = file.type;
    if (
      fileType === "application/pdf" || 
      fileType === "application/msword" || 
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid File Format",
        description: "Please upload a PDF or Word document",
        variant: "destructive",
      });
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const processSyllabus = async () => {
    if (!selectedFile || !user) return;
    
    setIsProcessing(true);
    
    try {
      toast({
        title: "Processing Syllabus",
        description: "Your syllabus is being analyzed. This may take a moment...",
      });
      
      // Step 1: Extract text from the uploaded file
      const fileContent = await extractTextFromFile(selectedFile);
      
      if (!fileContent || fileContent.trim().length === 0) {
        throw new Error("Could not extract text from the syllabus file. Please try another file.");
      }
      
      // Step 2: Process the syllabus with the OpenRouter API
      const syllabusData = await processSyllabusWithAI(fileContent) as SyllabusData;
      
      if (!syllabusData || !syllabusData.course || !syllabusData.assignments) {
        throw new Error("Could not extract course or assignment information from the syllabus.");
      }
      
      // Step 3: Create the course in Firebase
      const courseData: Omit<Course, 'id' | 'createdAt'> = {
        userId: user.uid,
        code: syllabusData.course.code || 'Unknown Code',
        name: syllabusData.course.name || 'Unknown Course',
        description: syllabusData.course.description || '',
        term: syllabusData.course.term || 'Current Term',
      };
      
      const newCourse = await addCourse(courseData);
      
      if (!newCourse || !newCourse.id) {
        throw new Error("Failed to create the course. Please try again.");
      }
      
      // Store the course name for the success message
      const courseName = courseData.name;
      const courseId = newCourse.id;
      
      // Step 4: Create assignments for the course
      const assignmentPromises = syllabusData.assignments.map(async (assignmentData: SyllabusAssignment) => {
        const dueDateString = assignmentData.dueDate || new Date().toISOString().split('T')[0];
        const dueDate = new Date(dueDateString);
        
        // Set a default status based on due date
        const status = dueDate < new Date() ? 'overdue' : 'pending';
        
        const newAssignmentData: Omit<Assignment, 'id' | 'createdAt'> = {
          userId: user.uid,
          courseId: courseId,
          title: assignmentData.title || 'Untitled Assignment',
          description: assignmentData.description || '',
          dueDate: dueDate,
          status: status as 'pending' | 'submitted' | 'overdue',
          tags: [],
          links: []
        };
        
        return addAssignment(newAssignmentData);
      });
      
      await Promise.all(assignmentPromises);
      
      // Close the modal upon success
      setSyllabusModalOpen(false);
      setSelectedFile(null);
      setIsProcessing(false);
      
      toast({
        title: "Success!",
        description: `Course "${courseName}" with ${syllabusData.assignments.length} assignments has been created.`,
      });
      
      // Navigate to the course detail page
      navigate(`/courses/${courseId}`);
      
    } catch (error) {
      console.error('Error processing syllabus:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "There was an error processing your syllabus. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  if (!user?.isPro) {
    return null; // Don't render anything while redirecting
  }

  return (
    <div className="container mx-auto py-6">
      {/* Pro Dashboard Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-2">
          <Sparkles className="h-5 w-5 text-yellow-400" />
          <h1 className="text-3xl font-bold">Pro Dashboard</h1>
          <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white">PRO</Badge>
        </div>
        <p className="text-slate-500">
          Welcome to your exclusive Pro dashboard with advanced features and analytics.
        </p>
      </div>

      {/* Analytics Overview Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <FileBarChart className="w-5 h-5 mr-2 text-blue-500" />
              Assignment Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-3xl font-bold text-blue-700">{assignmentCompletionRate}%</p>
                <p className="text-sm text-slate-600">Completion Rate</p>
              </div>
              <div className="border-l pl-4">
                <p className="text-xl font-bold text-blue-700">{totalAssignments}</p>
                <p className="text-sm text-slate-600">Total Assignments</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-slate-500">Last updated today</p>
          </CardFooter>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <LineChart className="w-5 h-5 mr-2 text-purple-500" />
              Study Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[100px] w-full flex items-end justify-between">
              {studyTimeData.map((day) => (
                <div key={day.day} className="flex flex-col items-center">
                  <div 
                    className="bg-purple-500 w-6 rounded-t-sm" 
                    style={{ height: `${day.hours * 15}px` }}
                  ></div>
                  <span className="text-xs mt-1">{day.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-slate-500">21 hours this week</p>
          </CardFooter>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Flame className="w-5 h-5 mr-2 text-amber-500" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-amber-600">{upcomingDeadlines}</p>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div 
                      key={i}
                      className={`h-8 w-2 rounded-full ${i <= upcomingDeadlines ? 'bg-amber-400' : 'bg-amber-200'}`}
                    ></div>
                  ))}
                </div>
              </div>
              <p className="text-sm text-slate-600 mt-2">Assignments due this week</p>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <Button variant="link" className="p-0 h-auto text-amber-700">View all deadlines</Button>
          </CardFooter>
        </Card>
      </div>

      {/* Pro Features Cards */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-yellow-400" />
          Pro Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <Bot className="w-5 h-5 mr-2" />
                AI Assistant
              </CardTitle>
              <CardDescription className="text-blue-100">
                Study smarter with personalized help
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-slate-600">
                Get intelligent answers to your questions and receive guided explanations for complex topics.
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                Start Chatting
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <FileUp className="w-5 h-5 mr-2" />
                Syllabus Analyzer
              </CardTitle>
              <CardDescription className="text-blue-100">
                Instantly create courses from syllabi
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-slate-600">
                Upload your course syllabus and we'll automatically extract deadlines, assignments, and create a complete course structure.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => setSyllabusModalOpen(true)}
                className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700"
              >
                Upload Syllabus
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Smart Summaries
              </CardTitle>
              <CardDescription className="text-purple-100">
                Save time with AI-powered notes
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-slate-600">
                Automatically generate concise summaries from your lecture notes, readings, and study materials.
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
                Summarize
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Course Analytics
              </CardTitle>
              <CardDescription className="text-amber-100">
                Visualize your academic progress
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-slate-600">
                Track your performance across all courses with detailed analytics and personalized insights.
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                View Analytics
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Study Groups
              </CardTitle>
              <CardDescription className="text-green-100">
                Connect with other students
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-slate-600">
                Create or join virtual study groups with students taking the same courses for collaborative learning.
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                Find Groups
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Pro Tips Section */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 p-6 rounded-lg border border-slate-100 shadow-sm">
        <div className="flex items-center mb-4">
          <div className="p-2 bg-yellow-100 rounded-full mr-4">
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Pro Member Tips</h3>
            <p className="text-sm text-slate-500">Get the most from your Pro membership</p>
          </div>
        </div>
        <ul className="space-y-2 text-slate-700">
          <li className="flex items-start">
            <div className="h-5 w-5 text-yellow-500 mr-2">•</div>
            <span>Use AI explanations to deepen your understanding of complex topics</span>
          </li>
          <li className="flex items-start">
            <div className="h-5 w-5 text-yellow-500 mr-2">•</div>
            <span>Generate practice questions to test your knowledge before exams</span>
          </li>
          <li className="flex items-start">
            <div className="h-5 w-5 text-yellow-500 mr-2">•</div>
            <span>Schedule weekly review sessions with Smart Summaries to strengthen retention</span>
          </li>
        </ul>
      </div>
      
      {/* Syllabus Upload Modal */}
      <Dialog open={isSyllabusModalOpen} onOpenChange={setSyllabusModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl">
              <FileUp className="h-5 w-5 mr-2 text-indigo-500" />
              Syllabus Analyzer
            </DialogTitle>
            <DialogDescription>
              Upload your course syllabus to automatically create a structured course with all assignments and deadlines.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {isProcessing && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-8 rounded-lg shadow-xl flex flex-col items-center">
                  <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <h3 className="text-xl font-semibold mb-2">Processing Your Syllabus</h3>
                  <p className="text-gray-600 text-center max-w-md">
                    Our AI is analyzing your syllabus to extract course details and assignments. 
                    This may take up to 30 seconds depending on the file size.
                  </p>
                </div>
              </div>
            )}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center ${
                isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <FileUp className="h-10 w-10 mx-auto mb-3 text-slate-400" />
              
              {selectedFile ? (
                <div>
                  <p className="font-medium text-indigo-600">{selectedFile.name}</p>
                  <p className="text-sm text-slate-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setSelectedFile(null)}
                    disabled={isProcessing}
                  >
                    Change file
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="font-medium">Drag and drop your syllabus here</p>
                  <p className="text-sm text-slate-500 mt-1">Or click to browse from your computer</p>
                  <input
                    type="file"
                    className="hidden"
                    id="syllabusFileInput"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileInput}
                    disabled={isProcessing}
                  />
                  <Button
                    variant="ghost" 
                    size="sm"
                    className="mt-2"
                    onClick={() => document.getElementById('syllabusFileInput')?.click()}
                    disabled={isProcessing}
                  >
                    Browse files
                  </Button>
                </div>
              )}
            </div>
            
            <div className="mt-3 text-sm text-slate-500">
              <p>Supported file types: PDF, DOC, DOCX</p>
              <p className="mt-1">Our AI will extract course details, assignments, and deadlines from your syllabus.</p>
            </div>
          </div>
          
          <DialogFooter className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setSyllabusModalOpen(false);
                setSelectedFile(null);
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={processSyllabus}
              className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700"
              disabled={!selectedFile || isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-opacity-20 border-t-white"></span>
                  Processing...
                </>
              ) : (
                'Analyze Syllabus'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}