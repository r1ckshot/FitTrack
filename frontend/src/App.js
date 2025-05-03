import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ClientDashboard from './pages/ClientDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { getUserRole } from './utils/auth';
import ProgressPage from './pages/ProgressPage';
import TrainingPlansPage from './pages/TrainingPlansPage';
import DietPlansPage from './pages/DietPlansPage';
import ProfilePage from './pages/UserProfile';
import { SnackbarProvider } from './contexts/SnackbarContext'; // dodany import

const App = () => {
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const updateRole = () => {
    const userRole = getUserRole();
    setRole(userRole);
    setIsLoading(false);
  };

  useEffect(() => {
    updateRole();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <SnackbarProvider> 
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage updateRole={updateRole} />} />
          <Route
            path="/dashboard"
            element={
              role === 'client' ? (
                <ClientDashboard />
              ) : role === 'trainer' ? (
                <TrainerDashboard />
              ) : role === 'admin' ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/exercises" element={<TrainingPlansPage />} />
          <Route path="/diets" element={<DietPlansPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </SnackbarProvider>
  );
};

export default App;
