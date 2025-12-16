import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import OrganizerNotifications from "./pages/OrganizerNotifications";
import CreateOrganizerNotification from "./pages/CreateOrganizerNotification";
import EditOrganizerNotification from "./pages/EditOrganizerNotification";
import OrganizerNotificationStats from "./pages/OrganizerNotificationStats";
import CreateConference from "./pages/CreateConference";
import ConferenceDetail from "./pages/ConferenceDetail";
import NotFound from "./pages/NotFound";
import SessionSchedule from "./pages/SessionSchedule";
import RegistrationList from "./pages/RegistrationList";
import FormManagement from "./pages/FormManagement";
import EditConference from "./pages/EditConference";
import CheckIn from "./pages/CheckIn";
import AdminDashboard from "./pages/AdminDashboard";
import AdminConferences from "./pages/AdminConferences";
import AdminUsers from "./pages/AdminUsers";
import AdminSystemUsers from "./pages/AdminSystemUsers";
import AdminRoles from "./pages/AdminRoles";
import AdminNotifications from "./pages/AdminNotifications";
import CreateNotification from "./pages/CreateNotification";
import EditNotification from "./pages/EditNotification";
import NotificationStats from "./pages/NotificationStats";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            {/* <Route path="/register" element={<Register />} /> */}

            {/* Organizer Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredUserType="organizer">
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute requiredUserType="organizer">
                  <OrganizerNotifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications/create"
              element={
                <ProtectedRoute requiredUserType="organizer">
                  <CreateOrganizerNotification />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications/:id/edit"
              element={
                <ProtectedRoute requiredUserType="organizer">
                  <EditOrganizerNotification />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications/:id/stats"
              element={
                <ProtectedRoute requiredUserType="organizer">
                  <OrganizerNotificationStats />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-conference"
              element={
                <ProtectedRoute requiredUserType="organizer">
                  <CreateConference />
                </ProtectedRoute>
              }
            />
            <Route
              path="/conference/:id/dashboard"
              element={
                <ProtectedRoute requiredUserType="organizer">
                  <ConferenceDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/conference/:id/schedule"
              element={
                <ProtectedRoute requiredUserType="organizer">
                  <SessionSchedule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/conference/:id/registrations"
              element={
                <ProtectedRoute requiredUserType="organizer">
                  <RegistrationList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/conference/:id/form"
              element={
                <ProtectedRoute requiredUserType="organizer">
                  <FormManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/conference/:id/edit"
              element={
                <ProtectedRoute requiredUserType="organizer">
                  <EditConference />
                </ProtectedRoute>
              }
            />
            <Route
              path="/conference/:id/check-in"
              element={
                <ProtectedRoute requiredUserType="organizer">
                  <CheckIn />
                </ProtectedRoute>
              }
            />
            <Route
              path="/conferences"
              element={
                <ProtectedRoute requiredUserType="organizer">
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredUserType="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/conferences"
              element={
                <ProtectedRoute requiredUserType="admin">
                  <AdminConferences />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/requests"
              element={
                <ProtectedRoute requiredUserType="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requiredUserType="admin">
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/system-users"
              element={
                <ProtectedRoute requiredUserType="admin">
                  <AdminSystemUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/roles"
              element={
                <ProtectedRoute requiredUserType="admin">
                  <AdminRoles />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <ProtectedRoute requiredUserType="admin">
                  <AdminNotifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notifications/create"
              element={
                <ProtectedRoute requiredUserType="admin">
                  <CreateNotification />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notifications/:id/edit"
              element={
                <ProtectedRoute requiredUserType="admin">
                  <EditNotification />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notifications/:id/stats"
              element={
                <ProtectedRoute requiredUserType="admin">
                  <NotificationStats />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute requiredUserType="admin">
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
