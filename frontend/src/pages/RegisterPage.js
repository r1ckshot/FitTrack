import React from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { motion } from 'framer-motion';
import BackgroundIcons from '../components/BackgroundIcons';
import { useSnackbar } from '../contexts/SnackbarContext'; // Dodany import kontekstu Snackbar

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
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

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
        showSnackbar('Zarejestrowano pomyślnie! Przekierowanie do logowania...', 'success');
        setTimeout(() => navigate('/login'), 3000); // Przekierowanie z opóźnieniem
      } catch (error) {
        showSnackbar(error.response?.data?.error || 'Błąd rejestracji', 'error');
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
