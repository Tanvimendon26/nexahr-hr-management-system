import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Departments from './pages/Departments';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Tasks from './pages/Tasks';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import MyProfile from './pages/MyProfile';
import Unauthorized from './pages/Unauthorized';
import Loader from './components/Loader';

// Protected Route Guard
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center">
        <Loader message="Securing portal connection..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'Admin') {
    return <Navigate to="/admin" replace />;
  } else if (user.role === 'HR') {
    return <Navigate to="/hr" replace />;
  } else {
    return <Navigate to="/employee" replace />;
  }
}

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen bg-zinc-950 flex items-center justify-center">
        <Loader message="Securing portal connection..." />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Private layout-wrapped routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomeRedirect />} />
        
        <Route 
          path="admin" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="hr" 
          element={
            <ProtectedRoute allowedRoles={['HR']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="employee" 
          element={
            <ProtectedRoute allowedRoles={['Employee']}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="employees" 
          element={
            <ProtectedRoute allowedRoles={['Admin', 'HR']}>
              <Employees />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="departments" 
          element={
            <ProtectedRoute allowedRoles={['Admin', 'HR']}>
              <Departments />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="attendance" 
          element={
            <ProtectedRoute allowedRoles={['Admin', 'HR', 'Employee']}>
              <Attendance />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="leaves" 
          element={
            <ProtectedRoute allowedRoles={['Admin', 'HR']}>
              <Leaves />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="tasks" 
          element={
            <ProtectedRoute allowedRoles={['Admin', 'HR']}>
              <Tasks />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="reports" 
          element={
            <ProtectedRoute allowedRoles={['Admin', 'HR']}>
              <Reports />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="settings" 
          element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Settings />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="profile" 
          element={
            <ProtectedRoute allowedRoles={['Employee', 'HR', 'Admin']}>
              <MyProfile />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
