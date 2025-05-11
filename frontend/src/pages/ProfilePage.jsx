import { useState, useEffect } from 'react';
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Paper,
  Divider,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/common/Navbar';
import { motion } from 'framer-motion';
import BackgroundIcons from '../components/common/BackgroundIcons';
import { Edit as EditIcon, Save as SaveIcon, Lock as LockIcon, Delete as DeleteIcon } from '@mui/icons-material';

// Schema walidacji dla głównych danych profilu
const profileValidationSchema = yup.object({
  firstName: yup.string().nullable(),
  lastName: yup.string().nullable(),
  dateOfBirth: yup.date().nullable().max(new Date(), 'Data urodzenia nie może być z przyszłości'),
  gender: yup.string().nullable(),
  weight: yup.number().nullable().positive('Waga musi być liczbą dodatnią'),
  height: yup.number().nullable().positive('Wzrost musi być liczbą dodatnią')
});

// Schema walidacji dla zmiany hasła
const passwordValidationSchema = yup.object({
  currentPassword: yup.string().required('Obecne hasło jest wymagane'),
  newPassword: yup.string().min(6, 'Nowe hasło musi mieć co najmniej 6 znaków').required('Nowe hasło jest wymagane'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('newPassword'), null], 'Hasła muszą być identyczne')
    .required('Potwierdzenie hasła jest wymagane')
});

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const navigate = useNavigate();

  // Pobieranie danych profilu po załadowaniu komponentu
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await api.get('/profile');
        const profileData = response.data;

        // Jeśli dane profileData są zagnieżdżone, dostosowujemy format
        if (profileData.profileData) {
          setUserData({
            username: profileData.username,
            email: profileData.email,
            firstName: profileData.profileData.firstName || '',
            lastName: profileData.profileData.lastName || '',
            dateOfBirth: profileData.profileData.dateOfBirth ? new Date(profileData.profileData.dateOfBirth).toISOString().split('T')[0] : '',
            gender: profileData.profileData.gender || '',
            weight: profileData.profileData.weight || '',
            height: profileData.profileData.height || ''
          });
        } else {
          setUserData({
            username: profileData.username,
            email: profileData.email,
            firstName: profileData.firstName || '',
            lastName: profileData.lastName || '',
            dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth).toISOString().split('T')[0] : '',
            gender: profileData.gender || '',
            weight: profileData.weight || '',
            height: profileData.height || ''
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Błąd podczas pobierania danych profilu:', error);
        setSnackbar({
          open: true,
          message: error.response?.data?.error || 'Nie udało się pobrać danych profilu',
          severity: 'error'
        });
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Formik do obsługi formularza profilu
  const profileFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      firstName: userData?.firstName || '',
      lastName: userData?.lastName || '',
      dateOfBirth: userData?.dateOfBirth || '',
      gender: userData?.gender || '',
      weight: userData?.weight || '',
      height: userData?.height || ''
    },
    validationSchema: profileValidationSchema,
    onSubmit: async (values) => {
      try {
        // Dodajemy logowanie dla debugowania
        console.log('Wartości wysyłane do API:', values);

        await api.put('/profile', values);
        setIsEditing(false);
        setSnackbar({ open: true, message: 'Profil został zaktualizowany pomyślnie!', severity: 'success' });

        // Aktualizacja danych lokalnie
        setUserData({
          ...userData,
          ...values
        });
      } catch (error) {
        console.error('Błąd aktualizacji profilu:', error.response?.data || error);
        setSnackbar({
          open: true,
          message: error.response?.data?.error || 'Błąd podczas aktualizacji profilu',
          severity: 'error'
        });
      }
    },
  });

  // Formik do obsługi zmiany hasła
  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    validationSchema: passwordValidationSchema,
    onSubmit: async (values) => {
      try {
        await api.put('/profile/change-password', {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword
        });
        setPasswordDialog(false);
        setSnackbar({ open: true, message: 'Hasło zostało zmienione pomyślnie!', severity: 'success' });
        passwordFormik.resetForm();
      } catch (error) {
        setSnackbar({
          open: true,
          message: error.response?.data?.error || 'Błąd podczas zmiany hasła',
          severity: 'error'
        });
      }
    }
  });

  // Obsługa usuwania konta
  const handleDeleteAccount = async () => {
    try {
      await api.delete('/profile');
      setSnackbar({ open: true, message: 'Konto zostało usunięte pomyślnie!', severity: 'success' });
      // Usuń token z localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Przekieruj do strony logowania po krótkim opóźnieniu
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Błąd podczas usuwania konta',
        severity: 'error'
      });
      setDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography>Ładowanie profilu...</Typography>
      </Box>
    );
  }

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
        padding: '20px'
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
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        style={{
          width: '100%',
          maxWidth: '800px',
          borderRadius: '8px',
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
          background: '#ffffff',
          overflow: 'hidden'
        }}
      >
        <Paper sx={{ padding: '24px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4">Twój Profil</Typography>
            <Box>
              {!isEditing ? (
                <Button
                  startIcon={<EditIcon />}
                  variant="contained"
                  color="primary"
                  onClick={() => setIsEditing(true)}
                  sx={{
                    backgroundColor: '#4CAF50',
                    '&:hover': { backgroundColor: '#45A049' },
                    marginRight: '8px'
                  }}
                >
                  Edytuj profil
                </Button>
              ) : (
                <Button
                  startIcon={<SaveIcon />}
                  variant="contained"
                  color="primary"
                  onClick={profileFormik.handleSubmit}
                  sx={{
                    backgroundColor: '#4CAF50',
                    '&:hover': { backgroundColor: '#45A049' },
                    marginRight: '8px'
                  }}
                >
                  Zapisz zmiany
                </Button>
              )}
              <Button
                startIcon={<DeleteIcon />}
                variant="outlined"
                color="error"
                onClick={() => setDeleteDialog(true)}
              >
                Usuń konto
              </Button>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={3}>
            {/* Informacje o koncie */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Informacje o koncie</Typography>
              <TextField
                fullWidth
                label="Nazwa użytkownika"
                value={userData.username}
                disabled
                margin="normal"
              />
              <TextField
                fullWidth
                label="Email"
                value={userData.email}
                disabled
                margin="normal"
              />
              <Button
                startIcon={<LockIcon />}
                variant="outlined"
                color="primary"
                onClick={() => setPasswordDialog(true)}
                sx={{ mt: 2 }}
              >
                Zmień hasło
              </Button>
            </Grid>

            {/* Dane osobowe */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Dane osobowe</Typography>
              <form onSubmit={profileFormik.handleSubmit}>
                <TextField
                  fullWidth
                  label="Imię"
                  name="firstName"
                  value={profileFormik.values.firstName}
                  onChange={profileFormik.handleChange}
                  error={profileFormik.touched.firstName && Boolean(profileFormik.errors.firstName)}
                  helperText={profileFormik.touched.firstName && profileFormik.errors.firstName}
                  disabled={!isEditing}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Nazwisko"
                  name="lastName"
                  value={profileFormik.values.lastName}
                  onChange={profileFormik.handleChange}
                  error={profileFormik.touched.lastName && Boolean(profileFormik.errors.lastName)}
                  helperText={profileFormik.touched.lastName && profileFormik.errors.lastName}
                  disabled={!isEditing}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Data urodzenia"
                  name="dateOfBirth"
                  type="date"
                  value={profileFormik.values.dateOfBirth}
                  onChange={profileFormik.handleChange}
                  error={profileFormik.touched.dateOfBirth && Boolean(profileFormik.errors.dateOfBirth)}
                  helperText={profileFormik.touched.dateOfBirth && profileFormik.errors.dateOfBirth}
                  disabled={!isEditing}
                  margin="normal"
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel
                    id="gender-label"
                    shrink={Boolean(profileFormik.values.gender) || isEditing}
                  >
                    Płeć
                  </InputLabel>
                  <Select
                    labelId="gender-label"
                    name="gender"
                    value={profileFormik.values.gender}
                    onChange={profileFormik.handleChange}
                    error={profileFormik.touched.gender && Boolean(profileFormik.errors.gender)}
                    disabled={!isEditing}
                    label="Płeć"
                    notched={Boolean(profileFormik.values.gender) || isEditing}
                  >
                    <MenuItem value="">Wybierz płeć</MenuItem>
                    <MenuItem value="male">Mężczyzna</MenuItem>
                    <MenuItem value="female">Kobieta</MenuItem>
                    <MenuItem value="other">Inna</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Waga (kg)"
                  name="weight"
                  type="number"
                  value={profileFormik.values.weight}
                  onChange={profileFormik.handleChange}
                  error={profileFormik.touched.weight && Boolean(profileFormik.errors.weight)}
                  helperText={profileFormik.touched.weight && profileFormik.errors.weight}
                  disabled={!isEditing}
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Wzrost (cm)"
                  name="height"
                  type="number"
                  value={profileFormik.values.height}
                  onChange={profileFormik.handleChange}
                  error={profileFormik.touched.height && Boolean(profileFormik.errors.height)}
                  helperText={profileFormik.touched.height && profileFormik.errors.height}
                  disabled={!isEditing}
                  margin="normal"
                />
              </form>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>

      {/* Dialog zmiany hasła */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)}>
        <DialogTitle>Zmień hasło</DialogTitle>
        <form onSubmit={passwordFormik.handleSubmit}>
          <DialogContent>
            <DialogContentText>
              Aby zmienić hasło, wprowadź swoje obecne hasło oraz nowe hasło.
            </DialogContentText>
            <TextField
              fullWidth
              label="Obecne hasło"
              name="currentPassword"
              type="password"
              value={passwordFormik.values.currentPassword}
              onChange={passwordFormik.handleChange}
              error={passwordFormik.touched.currentPassword && Boolean(passwordFormik.errors.currentPassword)}
              helperText={passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Nowe hasło"
              name="newPassword"
              type="password"
              value={passwordFormik.values.newPassword}
              onChange={passwordFormik.handleChange}
              error={passwordFormik.touched.newPassword && Boolean(passwordFormik.errors.newPassword)}
              helperText={passwordFormik.touched.newPassword && passwordFormik.errors.newPassword}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Potwierdź nowe hasło"
              name="confirmPassword"
              type="password"
              value={passwordFormik.values.confirmPassword}
              onChange={passwordFormik.handleChange}
              error={passwordFormik.touched.confirmPassword && Boolean(passwordFormik.errors.confirmPassword)}
              helperText={passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword}
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordDialog(false)}>Anuluj</Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                backgroundColor: '#4CAF50',
                '&:hover': { backgroundColor: '#45A049' },
              }}
            >
              Zmień hasło
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog potwierdzenia usunięcia konta */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Czy na pewno chcesz usunąć konto?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Ta operacja jest nieodwracalna. Wszystkie Twoje dane zostaną usunięte z systemu. Czy jesteś pewien, że chcesz kontynuować?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Anuluj</Button>
          <Button onClick={handleDeleteAccount} color="error" variant="contained">
            Usuń konto
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfilePage;