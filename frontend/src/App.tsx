import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Villages from './pages/Villages';
import Projects from './pages/Projects';
import Funds from './pages/Funds';
import Analytics from './pages/Analytics';
import Manage from './pages/Manage';
import StateView from './pages/StateView';
import VillageDetailView from './pages/VillageDetailView';
import ProjectDetailView from './pages/ProjectDetailView';
import ProjectWorkspace from './pages/ProjectWorkspace';
import Employees from './pages/Employees';
import Volunteers from './pages/Volunteers';
import VillagePlanUpdate from './pages/VillagePlanUpdate';
import VillagePlanVisuals from './pages/VillagePlanVisuals';
import './App.css';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const OfficerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  // If not logged in, send to officer login view
  if (!user) {
    return <Navigate to="/login?role=officer" />;
  }

  // Only officers can access these pages
  if (user.role !== 'officer') {
    return <Navigate to="/dashboard" />;
  }

  return <>{children}</>;
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app">
      <Header user={user} onLogout={handleLogout} />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
};

const AppContent: React.FC = () => {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Routes with Header */}
        <Route path="*" element={
          <MainLayout>
            <Routes>
              <Route path="/" element={<Home />} />
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
                path="/villages"
                element={
                  <PrivateRoute>
                    <Villages />
                  </PrivateRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <PrivateRoute>
                    <Projects />
                  </PrivateRoute>
                }
              />
              <Route
                path="/funds"
                element={
                  <OfficerRoute>
                    <Funds />
                  </OfficerRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <OfficerRoute>
                    <Analytics />
                  </OfficerRoute>
                }
              />
              <Route
                path="/manage"
                element={
                  <OfficerRoute>
                    <Manage />
                  </OfficerRoute>
                }
              />
              <Route
                path="/manage/state/:stateName"
                element={
                  <OfficerRoute>
                    <StateView />
                  </OfficerRoute>
                }
              />
              <Route
                path="/manage/village/:villageId"
                element={
                  <OfficerRoute>
                    <VillageDetailView />
                  </OfficerRoute>
                }
              />
              <Route
                path="/manage/project/:projectId"
                element={
                  <OfficerRoute>
                    <ProjectDetailView />
                  </OfficerRoute>
                }
              />
              <Route
                path="/manage/workspace/:projectId"
                element={
                  <OfficerRoute>
                    <ProjectWorkspace />
                  </OfficerRoute>
                }
              />
              <Route
                path="/employees"
                element={
                  <OfficerRoute>
                    <Employees />
                  </OfficerRoute>
                }
              />
              <Route
                path="/village-plan-update"
                element={
                  <PrivateRoute>
                    <VillagePlanUpdate />
                  </PrivateRoute>
                }
              />
              <Route
                path="/village-plan-view/:villageId/:year"
                element={
                  <PrivateRoute>
                    <VillagePlanVisuals />
                  </PrivateRoute>
                }
              />
              <Route
                path="/volunteers"
                element={
                  <PrivateRoute>
                    <Volunteers />
                  </PrivateRoute>
                }
              />
            </Routes>
          </MainLayout>
        } />
      </Routes>
    </ErrorBoundary>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
