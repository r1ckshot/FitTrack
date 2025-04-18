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
import ExercisesPage from './pages/ExercisesPage';

const App = () => {
  const [role, setRole] = useState(null); // Rola użytkownika
  const [isLoading, setIsLoading] = useState(true); // Stan ładowania aplikacji

  // Funkcja aktualizująca rolę na podstawie tokena
  const updateRole = () => {
    const userRole = getUserRole(); // Pobierz rolę z tokena
    setRole(userRole); // Ustaw rolę
    setIsLoading(false); // Zakończ ładowanie
  };

  // Aktualizujemy rolę przy załadowaniu aplikacji
  useEffect(() => {
    updateRole(); // Wywołaj funkcję aktualizacji roli
  }, []);

  // Wyświetl wskaźnik ładowania, jeśli aplikacja jeszcze się inicjalizuje
  if (isLoading) {
    return <div>Loading...</div>;
  }

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
              <Navigate to="/" replace />
            )
          }
        />

        {/* Strona planów treningowych */}
        <Route path="/exercises" element={<ExercisesPage />} />

        {/* Obsługa nieznanych tras */}
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/progress" element={<ProgressPage />} />
      </Routes>
    </Router>
  );
};

export default App;