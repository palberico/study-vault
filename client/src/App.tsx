import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import LoginPage from "@/pages/auth/login";
import RegisterPage from "@/pages/auth/register";
import DashboardPage from "@/pages/dashboard";
import CoursesPage from "@/pages/courses/courses";
import CourseDetailPage from "@/pages/courses/course-detail";
import EditCoursePage from "@/pages/courses/edit-course";
import AssignmentsPage from "@/pages/assignments/assignments";
import AssignmentDetailPage from "@/pages/assignments/assignment-detail";
import EditAssignmentPage from "@/pages/assignments/edit-assignment";
import FilesPage from "@/pages/files/files";
import FileUploadPage from "@/pages/files/upload";
import NotFound from "@/pages/not-found";
import AppLayout from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <DashboardPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/courses/edit/:id" component={(params) => (
        <ProtectedRoute>
          <AppLayout>
            <EditCoursePage id={params.id} />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/courses/:id" component={(params) => (
        <ProtectedRoute>
          <AppLayout>
            <CourseDetailPage id={params.id} />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/courses" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <CoursesPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/assignments/edit/:id" component={(params) => (
        <ProtectedRoute>
          <AppLayout>
            <EditAssignmentPage id={params.id} />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/assignments/:id" component={(params) => (
        <ProtectedRoute>
          <AppLayout>
            <AssignmentDetailPage id={params.id} />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/assignments" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <AssignmentsPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/files" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <FilesPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route path="/files/upload" component={() => (
        <ProtectedRoute>
          <AppLayout>
            <FileUploadPage />
          </AppLayout>
        </ProtectedRoute>
      )} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
