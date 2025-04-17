import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ClientDashboard from './pages/ClientDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { getUserRole } from './utils/auth'; // Import funkcji

const App = () => {
  const [role, setRole] = useState(null);

  // Funkcja aktualizująca rolę na podstawie tokena
  const updateRole = () => {
    const userRole = getUserRole();
    setRole(userRole);
  };

  // Aktualizujemy rolę przy załadowaniu aplikacji
  useEffect(() => {
    updateRole();
  }, []);

  return (
    <Router>
      <Routes>
        {/* Strona główna */}
        <Route path="/" element={<HomePage />} />

        {/* Rejestracja i Logowanie */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage updateRole={updateRole} />} />

        {/* Dashboard z dynamicznym renderowaniem na podstawie roli */}
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
              <Navigate to="/" />
            )
          }
        />

        {/* Obsługa nieznanych tras */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;