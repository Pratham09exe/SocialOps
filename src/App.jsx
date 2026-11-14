import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppDataProvider } from './context/AppDataContext';
import AppLayout from './components/layout/AppLayout';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TaskBoard from './pages/TaskBoard';
import ContentCalendar from './pages/ContentCalendar';
import ContentSubmission from './pages/ContentSubmission';
import ApprovalQueue from './pages/ApprovalQueue';
import WorkloadReport from './pages/WorkloadReport';
import Employees from './pages/Employees';
import Clients from './pages/Clients';
import Invoices from './pages/Invoices';
import Expenses from './pages/Expenses';
import ActivityLog from './pages/ActivityLog';
import ContentRequests from './pages/ContentRequests';
import ClientProfile from './pages/ClientProfile';
import AccessDenied from './pages/AccessDenied';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authLoading } = useAuth();
  if (authLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: 'var(--bg-base)' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Verifying session...</div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Role-Guarded Route Component (Prevents manual URL tampering)
const RoleRoute = ({ children, allowedRoles }) => {
  const { activeRole } = useAuth();
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(activeRole)) {
    return <AccessDenied requiredRoles={allowedRoles} />;
  }
  return children;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppDataProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Login Route */}
              <Route path="/login" element={<Login />} />

              {/* Authenticated Application Shell */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                {/* Unified Role Dashboard */}
                <Route index element={<Dashboard />} />

                {/* Role-Guarded Routes */}
                <Route path="tasks" element={
                  <RoleRoute allowedRoles={['admin', 'employee', 'client']}>
                    <TaskBoard />
                  </RoleRoute>
                } />

                <Route path="calendar" element={
                  <RoleRoute allowedRoles={['admin', 'employee', 'client']}>
                    <ContentCalendar />
                  </RoleRoute>
                } />

                <Route path="submit-content" element={
                  <RoleRoute allowedRoles={['admin', 'employee']}>
                    <ContentSubmission />
                  </RoleRoute>
                } />

                <Route path="approvals" element={
                  <RoleRoute allowedRoles={['admin', 'employee', 'client']}>
                    <ApprovalQueue />
                  </RoleRoute>
                } />

                <Route path="workload" element={
                  <RoleRoute allowedRoles={['admin']}>
                    <WorkloadReport />
                  </RoleRoute>
                } />

                <Route path="employees" element={
                  <RoleRoute allowedRoles={['admin']}>
                    <Employees />
                  </RoleRoute>
                } />

                <Route path="clients" element={
                  <RoleRoute allowedRoles={['admin', 'employee']}>
                    <Clients />
                  </RoleRoute>
                } />

                <Route path="invoices" element={
                  <RoleRoute allowedRoles={['admin', 'client']}>
                    <Invoices />
                  </RoleRoute>
                } />

                <Route path="expenses" element={
                  <RoleRoute allowedRoles={['admin']}>
                    <Expenses />
                  </RoleRoute>
                } />

                <Route path="activity-log" element={
                  <RoleRoute allowedRoles={['admin']}>
                    <ActivityLog />
                  </RoleRoute>
                } />

                <Route path="requests" element={
                  <RoleRoute allowedRoles={['admin', 'employee', 'client']}>
                    <ContentRequests />
                  </RoleRoute>
                } />

                <Route path="profile" element={
                  <RoleRoute allowedRoles={['admin', 'client']}>
                    <ClientProfile />
                  </RoleRoute>
                } />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AppDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
