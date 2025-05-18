import {
  Box,
  Button,
  TextField,
  Typography,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { motion } from 'framer-motion';
import BackgroundIcons from '../components/common/BackgroundIcons';
import { useSnackbar } from '../contexts/SnackbarContext';

const validationSchema = yup.object({
  username: yup.string()
    .min(3, 'Nazwa użytkownika musi mieć co najmniej 3 znaki')
    .max(30, 'Nazwa użytkownika nie może przekraczać 30 znaków')
    .matches(/^[a-zA-Z0-9_-]+$/, 'Nazwa użytkownika może zawierać tylko litery, cyfry, podkreślenia i myślniki')
    .required('Nazwa użytkownika jest wymagana'),
  
  email: yup.string()
    .email('Nieprawidłowy format adresu email')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Nieprawidłowy format adresu email')
    .required('Adres email jest wymagany'),
  
  password: yup.string()
    .min(8, 'Hasło musi mieć co najmniej 8 znaków')
    .matches(/[a-z]/, 'Hasło musi zawierać co najmniej jedną małą literę')
    .matches(/[A-Z]/, 'Hasło musi zawierać co najmniej jedną wielką literę')
    .matches(/[0-9]/, 'Hasło musi zawierać co najmniej jedną cyfrę')
    .matches(/[^a-zA-Z0-9]/, 'Hasło musi zawierać co najmniej jeden znak specjalny')
    .required('Hasło jest wymagane')
});

const RegisterPage = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  const formik = useFormik({
    initialValues: {
      username: '',
      email: '',
      password: '',
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