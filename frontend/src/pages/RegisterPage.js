import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Snackbar,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SportsGymnasticsIcon from '@mui/icons-material/SportsGymnastics';
import EmojiFoodBeverageIcon from '@mui/icons-material/EmojiFoodBeverage';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import { motion } from 'framer-motion';

const validationSchema = yup.object({
  username: yup.string().required('Nazwa użytkownika jest wymagana'),
  email: yup.string().email('Nieprawidłowy email').required('Email jest wymagany'),
  password: yup.string().min(6, 'Hasło musi mieć co najmniej 6 znaków').required('Hasło jest wymagane'),
  role: yup.string().required('Wybór roli jest wymagany'),
  accessCode: yup.string().when('role', (role, schema) => {
    if (role === 'trainer' || role === 'admin') {
      return schema.required('Kod dostępu jest wymagany dla tej roli');
    }
    return schema.notRequired(); 
  }),
});

const RegisterPage = () => {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [backgroundIcons, setBackgroundIcons] = useState([]);
  const navigate = useNavigate();

  // Generowanie ikonek tylko raz przy załadowaniu komponentu
  useEffect(() => {
    const icons = [
      <FitnessCenterIcon fontSize="inherit" />,
      <RestaurantIcon fontSize="inherit" />,
      <CalendarTodayIcon fontSize="inherit" />,
      <TrendingUpIcon fontSize="inherit" />,
      <FavoriteIcon fontSize="inherit" />,
      <SportsGymnasticsIcon fontSize="inherit" />,
      <EmojiFoodBeverageIcon fontSize="inherit" />,
      <SelfImprovementIcon fontSize="inherit" />,
    ];
    const generatedIcons = Array.from({ length: 25 }).map(() => ({
      icon: icons[Math.floor(Math.random() * icons.length)],
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 50 + 30}px`,
      opacity: Math.random() * 0.3 + 0.1,
      rotation: Math.random() * 360,
    }));
    setBackgroundIcons(generatedIcons);
  }, []);

  const formik = useFormik({
    initialValues: {
      username: '',
      email: '',
      password: '',
      role: 'client', // Domyślna wartość dla roli
      accessCode: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        await api.post('/auth/register', values);
        setSnackbar({ open: true, message: 'Zarejestrowano pomyślnie! Przekierowanie do logowania...', severity: 'success' });
        setTimeout(() => navigate('/login'), 3000); // Przekierowanie z opóźnieniem
      } catch (error) {
        setSnackbar({ open: true, message: error.response?.data?.error || 'Błąd rejestracji', severity: 'error' });
      }
    },
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #4CAF50, #81C784)',
      }}
    >
      {/* Tło z ikonkami */}
      {backgroundIcons.map((item, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            top: item.top,
            left: item.left,
            fontSize: item.size,
            color: `rgba(255, 255, 255, ${item.opacity})`,
            transform: `rotate(${item.rotation * 360}deg)`,
            animation: `float ${10 + (index % 5)}s infinite ease-in-out`,
            '@keyframes float': {
              '0%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(20px)' },
              '100%': { transform: 'translateY(0px)' },
            },
          }}
        >
          {item.icon}
        </Box>
      ))}

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
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
          background: '#ffffff',
        }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          Rejestracja
        </Typography>
        <form onSubmit={formik.handleSubmit}>
          <TextField
            fullWidth
            label="Nazwa użytkownika"
            name="username"
            margin="normal"
            value={formik.values.username}
            onChange={formik.handleChange}
            error={formik.touched.username && Boolean(formik.errors.username)}
            helperText={formik.touched.username && formik.errors.username}
          />
          <TextField
            fullWidth
            label="Email"
            name="email"
            margin="normal"
            value={formik.values.email}
            onChange={formik.handleChange}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
          />
          <TextField
            fullWidth
            label="Hasło"
            name="password"
            type="password"
            margin="normal"
            value={formik.values.password}
            onChange={formik.handleChange}
            error={formik.touched.password && Boolean(formik.errors.password)}
            helperText={formik.touched.password && formik.errors.password}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel id="role-label" sx={{ top: '-8px' }}>
              Rola
            </InputLabel>
            <Select
              labelId="role-label"
              name="role"
              value={formik.values.role}
              onChange={formik.handleChange}
              error={formik.touched.role && Boolean(formik.errors.role)}
              sx={{
                textAlign: 'left', // Wyśrodkowanie tekstu w Select
                height: '56px', // Dopasowanie wysokości
              }}
            >
              <MenuItem value="client">Klient</MenuItem>
              <MenuItem value="trainer">Trener</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          {['trainer', 'admin'].includes(formik.values.role) && (
            <TextField
              fullWidth
              label="Kod dostępu"
              name="accessCode"
              margin="normal"
              value={formik.values.accessCode}
              onChange={formik.handleChange}
              error={formik.touched.accessCode && Boolean(formik.errors.accessCode)}
              helperText={formik.touched.accessCode && formik.errors.accessCode}
            />
          )}
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
            Zarejestruj się
          </Button>
        </form>
      </motion.div>
    </Box>
  );
};

export default RegisterPage;