import { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Guardians from './pages/Guardians';
import Fees from './pages/Fees';
import Concessions from './pages/Concessions';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function PrivateRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/students"
              element={
                <PrivateRoute>
                  <Students />
                </PrivateRoute>
              }
            />
            <Route
              path="/guardians"
              element={
                <PrivateRoute>
                  <Guardians />
                </PrivateRoute>
              }
            />
            <Route
              path="/fees"
              element={
                <PrivateRoute>
                  <Fees />
                </PrivateRoute>
              }
            />
            <Route
              path="/concessions"
              element={
                <PrivateRoute>
                  <Concessions />
                </PrivateRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <PrivateRoute>
                  <Payments />
                </PrivateRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <PrivateRoute>
                  <Reports />
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
