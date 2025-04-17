import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Snackbar, Alert } from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import api from '../services/api';
import { motion } from 'framer-motion';
import BackgroundIcons from '../components/BackgroundIcons';

const validationSchema = yup.object({
  email: yup.string().email('Nieprawidłowy email').required('Email jest wymagany'),
  password: yup.string().min(6, 'Hasło musi mieć co najmniej 6 znaków').required('Hasło jest wymagane'),
});

const LoginPage = () => {
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const response = await api.post('/auth/login', values);
        localStorage.setItem('token', response.data.token); // Zapis tokena do localStorage
        setSnackbar({ open: true, message: 'Zalogowano pomyślnie!', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: error.response?.data?.error || 'Błąd logowania', severity: 'error' });
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
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
          background: '#ffffff',
        }}
      >
        <Typography variant="h4" align="center" gutterBottom>
          Logowanie
        </Typography>
        <form onSubmit={formik.handleSubmit}>
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
            Zaloguj się
          </Button>
        </form>
      </motion.div>
    </Box>
  );
};

export default LoginPage;