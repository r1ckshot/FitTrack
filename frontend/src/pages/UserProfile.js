import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Snackbar, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import BackgroundIcons from '../components/BackgroundIcons';
import Navbar from '../components/Navbar';
import api from '../services/api';

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    // Pobierz dane użytkownika z backendu
    const fetchUserData = async () => {
      try {
        const response = await api.get('/users/profile'); // Endpoint do pobrania profilu
        setUserData(response.data);
        setFormData(response.data); // Ustaw dane użytkownika w formularzu
      } catch (error) {
        console.error('Błąd podczas pobierania danych użytkownika:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/users/profile', formData); // Endpoint do aktualizacji danych
      setSnackbar({ open: true, message: 'Profil zaktualizowany pomyślnie!', severity: 'success' });
    } catch (error) {
      console.error('Błąd podczas aktualizacji profilu:', error);
      setSnackbar({ open: true, message: 'Błąd podczas aktualizacji profilu.', severity: 'error' });
    }
  };

  if (!userData) {
    return <Typography>Ładowanie...</Typography>; // Wskaźnik ładowania
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #4CAF50, #81C784)',
      }}
    >
      <Navbar />
      <BackgroundIcons />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      <motion.div
        initial={{ y: -200, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          width: '400px',
          margin: '50px auto',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
          background: '#ffffff',
        }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          Twój Profil
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            margin="normal"
            value={formData.email}
            InputProps={{ readOnly: true }} // Pole tylko do odczytu
          />
          <TextField
            fullWidth
            label="Imię"
            name="firstName"
            margin="normal"
            value={formData.firstName || ''}
            onChange={handleInputChange}
          />
          <TextField
            fullWidth
            label="Nazwisko"
            name="lastName"
            margin="normal"
            value={formData.lastName || ''}
            onChange={handleInputChange}
          />
          <TextField
            fullWidth
            label="Data urodzenia"
            name="dateOfBirth"
            type="date"
            margin="normal"
            value={formData.dateOfBirth || ''}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            label="Płeć"
            name="gender"
            margin="normal"
            value={formData.gender || ''}
            onChange={handleInputChange}
          />
          <TextField
            fullWidth
            label="Waga (kg)"
            name="weight"
            type="number"
            margin="normal"
            value={formData.weight || ''}
            onChange={handleInputChange}
          />
          <TextField
            fullWidth
            label="Wzrost (cm)"
            name="height"
            type="number"
            margin="normal"
            value={formData.height || ''}
            onChange={handleInputChange}
          />
          <Button
            fullWidth
            type="submit"
            variant="contained"
            sx={{
              marginTop: '16px',
              backgroundColor: '#4CAF50',
              '&:hover': { backgroundColor: '#45A049' },
            }}
          >
            Zaktualizuj Profil
          </Button>
        </form>
      </motion.div>
    </Box>
  );
};

export default UserProfile;
