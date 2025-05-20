import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getUserAssignments, getUserCourses, type Assignment, type Course } from "@/lib/firebase";
import AssignmentCard from "@/components/assignment/assignment-card";
import AssignmentForm from "@/components/assignment/assignment-form";
import { Button } from "@/components/ui/button";
import { PlusIcon, FileText, Filter, Search, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FilterStatus = "all" | "pending" | "submitted" | "overdue";

export default function AssignmentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  
  useEffect(() => {
    async function fetchAssignments() {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const [assignmentsData, coursesData] = await Promise.all([
          getUserAssignments(user.uid),
          getUserCourses(user.uid)
        ]);
        
        setAssignments(assignmentsData);
        setCourses(coursesData);
        
        // Extract all unique tags from assignments
        const allTags = assignmentsData.reduce((tags: string[], assignment) => {
          if (assignment.tags && assignment.tags.length > 0) {
            assignment.tags.forEach(tag => {
              if (!tags.includes(tag)) {
                tags.push(tag);
              }
            });
          }
          return tags;
        }, []);
        
        setAvailableTags(allTags);
      } catch (error) {
        console.error("Error fetching assignments:", error);
        toast({
          title: "Error",
          description: "Failed to load your assignments",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAssignments();
  }, [user, toast]);
  
  const filteredAssignments = assignments.filter(assignment => {
    // Text search filter
    const textMatch = 
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const statusMatch = 
      statusFilter === "all" || 
      assignment.status === statusFilter;
    
    // Course filter
    const courseMatch = 
      courseFilter === "all" || 
      assignment.courseId === courseFilter;
    
    // Tag filter
    const tagMatch = 
      tagFilter.length === 0 || // If no tags selected, show all
      (assignment.tags && tagFilter.some(tag => assignment.tags?.includes(tag)));
    
    return textMatch && statusMatch && courseMatch && tagMatch;
  });
  
  const handleAddAssignment = (newAssignment: Assignment) => {
    setAssignments(prev => [newAssignment, ...prev]);
    setShowAssignmentForm(false);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Assignments</h1>
        <p className="text-slate-500">
          View and manage all your course assignments
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="w-full md:w-1/3 space-y-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <Input
              type="text"
              placeholder="Search assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Tag filter - moved under search bar */}
          {availableTags.length > 0 && (
            <div>
              <div className="flex items-center mb-2 gap-2">
                <Tag className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Filter by tags:</span>
              </div>
              <div className="flex flex-wrap gap-2 max-w-md">
                {availableTags.map(tag => (
                  <Badge 
                    key={tag}
                    variant={tagFilter.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer ${tagFilter.includes(tag) ? 'bg-blue-500 hover:bg-blue-600' : 'hover:bg-slate-100'}`}
                    onClick={() => {
                      if (tagFilter.includes(tag)) {
                        setTagFilter(tagFilter.filter(t => t !== tag));
                      } else {
                        setTagFilter([...tagFilter, tag]);
                      }
                    }}
                  >
                    {tagFilter.includes(tag) ? (
                      <Check className="mr-1 h-3 w-3" />
                    ) : (
                      <Tag className="mr-1 h-3 w-3" />
                    )}
                    {tag}
                  </Badge>
                ))}
                {tagFilter.length > 0 && (
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                    onClick={() => setTagFilter([])}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear Tags
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-slate-500 flex-shrink-0" />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as FilterStatus)}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <FileText className="h-4 w-4 text-slate-500 flex-shrink-0" />
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id || ""}>
                    {course.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            onClick={() => setShowAssignmentForm(true)}
            className="flex items-center justify-center w-full sm:w-auto h-10"
          >
            <PlusIcon className="mr-2 h-4 w-4" /> Add Assignment
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 h-52 animate-pulse">
              <div className="bg-slate-200 h-4 w-20 mb-3 rounded"></div>
              <div className="bg-slate-200 h-6 w-4/5 mb-2 rounded"></div>
              <div className="bg-slate-200 h-4 w-full mb-1 rounded"></div>
              <div className="bg-slate-200 h-4 w-3/4 mb-4 rounded"></div>
              <div className="flex items-center mt-auto">
                <div className="bg-slate-200 h-4 w-24 rounded"></div>
                <div className="bg-slate-200 h-4 w-16 ml-4 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          {searchTerm || statusFilter !== "all" || courseFilter !== "all" ? (
            <>
              <Search className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No matching assignments found</h3>
              <p className="text-slate-500 mb-4">Try adjusting your search or filters</p>
              <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setCourseFilter("all");
                }}>
                  Clear Filters
                </Button>
                <Button onClick={() => setShowAssignmentForm(true)}>
                  Add Assignment
                </Button>
              </div>
            </>
          ) : (
            <>
              <FileText className="mx-auto h-12 w-12 text-slate-400 mb-3" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No assignments yet</h3>
              <p className="text-slate-500 mb-4">Start by adding your first assignment</p>
              <Button onClick={() => setShowAssignmentForm(true)}>
                Add Assignment
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard 
              key={assignment.id} 
              assignment={assignment} 
              courses={courses}
              // Removed onClick prop so only the View Details button navigates to the detail page
            />
          ))}
        </div>
      )}
      
      {showAssignmentForm && (
        <AssignmentForm 
          onClose={() => setShowAssignmentForm(false)}
          onSuccess={handleAddAssignment}
          courses={courses}
        />
      )}
    </div>
  );
}
