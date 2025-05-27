import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import LandingPage from "@/pages/landing";
import DashboardPage from "@/pages/dashboard";
import CoursesPage from "@/pages/courses/courses";
import CourseDetailPage from "@/pages/courses/course-detail";
import EditCoursePage from "@/pages/courses/edit-course";
import AssignmentsPage from "@/pages/assignments/assignments";
import AssignmentDetailPage from "@/pages/assignments/assignment-detail";
import EditAssignmentPage from "@/pages/assignments/edit-assignment";
import FilesPage from "@/pages/files/files";
import FileUploadPage from "@/pages/files/upload";
import MyAccountPage from "@/pages/my-account";
import ProDashboard from "@/pages/pro-dashboard";
import SummaryDetail from "@/pages/summary-detail";
import NotFound from "@/pages/not-found";
import AppLayout from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/hooks/use-auth";

function Router() {
  return (
    <Switch>

      <Route path="/">
        <LandingPage />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <AppLayout>
            <DashboardPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/courses/edit/:id">
        {(params) => (
          <ProtectedRoute>
            <AppLayout>
              <EditCoursePage id={params.id} />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/courses/:id">
        {(params) => (
          <ProtectedRoute>
            <AppLayout>
              <CourseDetailPage id={params.id} />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/courses">
        <ProtectedRoute>
          <AppLayout>
            <CoursesPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/assignments/edit/:id">
        {(params) => (
          <ProtectedRoute>
            <AppLayout>
              <EditAssignmentPage id={params.id} />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/assignments/:id">
        {(params) => (
          <ProtectedRoute>
            <AppLayout>
              <AssignmentDetailPage id={params.id} />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/assignments">
        <ProtectedRoute>
          <AppLayout>
            <AssignmentsPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/files">
        <ProtectedRoute>
          <AppLayout>
            <FilesPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/files/upload">
        <ProtectedRoute>
          <AppLayout>
            <FileUploadPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/my-account">
        <ProtectedRoute>
          <AppLayout>
            <MyAccountPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/pro-dashboard">
        <ProtectedRoute>
          <AppLayout>
            <ProDashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/summaries/:id">
        {(params) => (
          <ProtectedRoute>
            <AppLayout>
              <SummaryDetail />
            </AppLayout>
          </ProtectedRoute>
        )}
      </Route>
      <Route>
        <NotFound />
      </Route>
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
