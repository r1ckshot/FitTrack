import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/ClientDashboard'; // Używamy jednego dashboardu dla wszystkich
import ProgressPage from './pages/ProgressPage';
import TrainingPlansPage from './pages/TrainingPlansPage';
import DietPlansPage from './pages/DietPlansPage';
import ProfilePage from './pages/UserProfile';
import { SnackbarProvider } from './contexts/SnackbarContext';
import { isAuthenticated } from './utils/auth';

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const updateAuthStatus = () => {
    setIsLoggedIn(isAuthenticated());
    setIsLoading(false);
  };

  useEffect(() => {
    updateAuthStatus();
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
          <Route path="/login" element={<LoginPage updateAuthStatus={updateAuthStatus} />} />
          <Route
            path="/dashboard"
            element={isLoggedIn ? <Dashboard /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/progress"
            element={isLoggedIn ? <ProgressPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/exercises"
            element={isLoggedIn ? <TrainingPlansPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/diets"
            element={isLoggedIn ? <DietPlansPage /> : <Navigate to="/login" replace />}
          />
          <Route
            path="/profile"
            element={isLoggedIn ? <ProfilePage /> : <Navigate to="/login" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </SnackbarProvider>
  );
};

export default App;