// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Importujemy strony (będziemy je tworzyć później)
// import HomePage from './pages/Home';
// import LoginPage from './pages/auth/Login';
// import RegisterPage from './pages/auth/Register';
// import DashboardPage from './pages/Dashboard';

// Importujemy kontekst auth (będziemy go tworzyć później)
// import { AuthProvider } from './contexts/AuthContext';

// Tymczasowe komponenty
const HomePage = () => <div>Strona główna</div>;
const LoginPage = () => <div>Strona logowania</div>;
const RegisterPage = () => <div>Strona rejestracji</div>;
const DashboardPage = () => <div>Panel użytkownika</div>;

// Motyw aplikacji
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* <AuthProvider> */}
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </Router>
      {/* </AuthProvider> */}
    </ThemeProvider>
  );
}

export default App;