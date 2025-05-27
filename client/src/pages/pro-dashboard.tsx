import React, { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Bot, Sparkles, Zap, LineChart, FileBarChart, BookOpen, Users, Flame, FileUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SyllabusAnalyzer from "@/components/pro/SyllabusAnalyzer"; // <-- Import new component
import SmartSummarizerEnhanced from "@/components/pro/SmartSummarizerEnhanced";

// Dummy analytics data (replace with real backend data as needed)
const studyTimeData: { day: string; hours: number }[] = [];
const assignmentCompletionRate = 0;
const totalAssignments = 0;
const upcomingDeadlines = 0;

export default function ProDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSyllabusModalOpen, setSyllabusModalOpen] = useState(false); // Only state needed
  const [isSmartSummarizerOpen, setSmartSummarizerOpen] = useState(false);

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

  if (!user?.isPro) {
    return null;
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
          <Card className="border-none shadow-md hover:shadow-lg transition-shadow h-full flex flex-col">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <Bot className="w-5 h-5 mr-2" />
                AI Assistant
              </CardTitle>
              <CardDescription className="text-blue-100">
                Study smarter with personalized help
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex-1">
              <p className="text-slate-600">
                Get intelligent answers to your questions and receive guided explanations for complex topics.
              </p>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                Start Chatting
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-none shadow-md hover:shadow-lg transition-shadow h-full flex flex-col">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <FileUp className="w-5 h-5 mr-2" />
                Syllabus Analyzer
              </CardTitle>
              <CardDescription className="text-emerald-100">
                Instantly create courses from syllabi
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex-1">
              <p className="text-slate-600">
                Upload your course syllabus and we'll automatically extract deadlines, assignments, and create a complete course structure.
              </p>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button
                onClick={() => setSyllabusModalOpen(true)}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                Upload Syllabus
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-none shadow-md hover:shadow-lg transition-shadow h-full flex flex-col">
            <CardHeader className="bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Smart Summaries
              </CardTitle>
              <CardDescription className="text-violet-100">
                Save time with AI-powered notes
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex-1">
              <p className="text-slate-600">
                Automatically generate concise summaries from your lecture notes, readings, and study materials.
              </p>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button 
                onClick={() => setSmartSummarizerOpen(true)}
                className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                Summarize
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-none shadow-md hover:shadow-lg transition-shadow h-full flex flex-col">
            <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <BookOpen className="w-5 h-5 mr-2" />
                Course Analytics
              </CardTitle>
              <CardDescription className="text-amber-100">
                Visualize your academic progress
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex-1">
              <p className="text-slate-600">
                Track your performance across all courses with detailed analytics and personalized insights.
              </p>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                View Analytics
              </Button>
            </CardFooter>
          </Card>

          <Card className="border-none shadow-md hover:shadow-lg transition-shadow h-full flex flex-col">
            <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Study Groups
              </CardTitle>
              <CardDescription className="text-cyan-100">
                Connect with other students
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 flex-1">
              <p className="text-slate-600">
                Create or join virtual study groups with students taking the same courses for collaborative learning.
              </p>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
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

      {/* Syllabus Analyzer Modal (now delegated to SyllabusAnalyzer component) */}
      <SyllabusAnalyzer
        open={isSyllabusModalOpen}
        onOpenChange={setSyllabusModalOpen}
        // Optionally, you can add onSyllabusProcessed={() => { /* refresh logic here */ }}
      />

      {/* Smart Summarizer Modal */}
      <SmartSummarizerEnhanced
        isOpen={isSmartSummarizerOpen}
        onClose={() => setSmartSummarizerOpen(false)}
      />
    </div>
  );
}

