import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token'); // Usuwamy token z localStorage
    navigate('/'); // Przekierowanie na HomePage
  };

  return (
    <AppBar position="static" sx={{ background: '#4CAF50' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
          FitTrack
        </Typography>
        <Button color="inherit" onClick={() => navigate('/profile')}>
          Profil
        </Button>
        <Button color="inherit" onClick={handleLogout}>
          Wyloguj się
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;