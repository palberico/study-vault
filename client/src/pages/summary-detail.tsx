import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getSummary, getUserCourses, type Summary, type Course } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, ExternalLink, Calendar, BookOpen, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SummaryDetail() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Get summary ID from URL
  const summaryId = window.location.pathname.split('/summaries/')[1];
  
  const [summary, setSummary] = useState<Summary | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (summaryId && user) {
      loadSummary();
    }
  }, [summaryId, user]);

  const loadSummary = async () => {
    if (!summaryId || !user) return;
    
    try {
      setIsLoading(true);
      const summaryData = await getSummary(summaryId);
      
      // Verify user owns this summary
      if (summaryData.userId !== user.uid) {
        toast({
          title: "Access denied",
          description: "You don't have permission to view this summary.",
          variant: "destructive"
        });
        navigate("/");
        return;
      }
      
      setSummary(summaryData);
      
      // Load course information
      const courses = await getUserCourses(user.uid);
      const summaryCourse = courses.find(c => c.id === summaryData.courseId);
      setCourse(summaryCourse || null);
      
    } catch (error) {
      console.error("Error loading summary:", error);
      toast({
        title: "Error loading summary",
        description: "Failed to load the summary. It may have been deleted.",
        variant: "destructive"
      });
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadDocument = () => {
    if (summary?.originalDocumentUrl) {
      window.open(summary.originalDocumentUrl, '_blank');
    }
  };

  const formatDate = (date: any) => {
    if (!date) return "Unknown date";
    
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "Unknown date";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Summary Not Found</h1>
          <p className="text-slate-500 mb-4">The summary you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">{summary.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              {course && (
                <div className="flex items-center">
                  <BookOpen className="w-4 h-4 mr-1" />
                  <span>{course.code} - {course.name}</span>
                </div>
              )}
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>Created {formatDate(summary.createdAt)}</span>
              </div>
            </div>
          </div>
          
          {summary.originalDocumentUrl && (
            <Button 
              onClick={handleDownloadDocument}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              View Original Document
            </Button>
          )}
        </div>
      </div>

      {/* Summary Content */}
      <div className="space-y-6">
        {/* Overview */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
            <CardTitle className="flex items-center text-blue-900">
              <Sparkles className="w-5 h-5 mr-2" />
              Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-slate-700 leading-relaxed text-lg">
              {summary.overview}
            </p>
          </CardContent>
        </Card>

        {/* Main Points */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 rounded-t-lg">
            <CardTitle className="flex items-center text-green-900">
              🎯 Main Points
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {summary.mainPoints.map((point, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 text-green-800 rounded-full flex items-center justify-center font-semibold mr-4 mt-1">
                    {index + 1}
                  </div>
                  <p className="text-slate-700 leading-relaxed flex-1 pt-1">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Terms */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-lg">
            <CardTitle className="flex items-center text-purple-900">
              🔑 Key Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              {summary.keyTerms.map((term, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="bg-purple-100 text-purple-800 hover:bg-purple-200 px-3 py-2 text-sm font-medium"
                >
                  {term}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Document Information */}
        {summary.originalDocumentName && (
          <Card>
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-t-lg">
              <CardTitle className="flex items-center text-slate-900">
                📄 Original Document
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-700">{summary.originalDocumentName}</p>
                  <p className="text-sm text-slate-500 mt-1">
                    This summary was generated from the uploaded document
                  </p>
                </div>
                {summary.originalDocumentUrl && (
                  <Button 
                    variant="outline"
                    onClick={handleDownloadDocument}
                    className="flex items-center"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open File
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actions */}
      <div className="mt-8 flex justify-center">
        <Button 
          onClick={() => navigate("/pro-dashboard")}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Create Another Summary
        </Button>
      </div>
    </div>
  );
}