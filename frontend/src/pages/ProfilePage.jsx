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
  Container,
} from '@mui/material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Navbar from '../components/common/Navbar';
import { motion } from 'framer-motion';
import BackgroundIcons from '../components/common/BackgroundIcons';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Lock as LockIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
  ErrorOutline as ErrorIcon
} from '@mui/icons-material';

// Rozszerzona walidacja danych profilu
const profileValidationSchema = yup.object({
  firstName: yup.string()
    .max(50, 'Imię nie może przekraczać 50 znaków')
    .matches(/^[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż\s-]*$/, 'Imię może zawierać tylko litery, spacje i myślniki'),
  lastName: yup.string()
    .max(50, 'Nazwisko nie może przekraczać 50 znaków')
    .matches(/^[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż\s-]*$/, 'Nazwisko może zawierać tylko litery, spacje i myślniki'),
  dateOfBirth: yup.date()
    .nullable()
    .max(new Date(), 'Data urodzenia nie może być z przyszłości')
    .test('is-adult', 'Musisz mieć co najmniej 13 lat', function (value) {
      if (!value) return true; // Puste wartości są dozwolone
      const today = new Date();
      const thirteenYearsAgo = new Date();
      thirteenYearsAgo.setFullYear(today.getFullYear() - 13);
      return value <= thirteenYearsAgo;
    }),
  gender: yup.string().nullable(),
  weight: yup.number()
    .nullable()
    .positive('Waga musi być liczbą dodatnią')
    .min(20, 'Waga musi być większa niż 20 kg')
    .max(300, 'Waga nie może przekraczać 300 kg')
    .test('is-decimal', 'Waga może mieć maksymalnie 1 miejsce po przecinku', function (value) {
      if (!value) return true;
      return /^\d+(\.\d{0,1})?$/.test(value.toString());
    }),
  height: yup.number()
    .nullable()
    .positive('Wzrost musi być liczbą dodatnią')
    .min(50, 'Wzrost musi być większy niż 50 cm')
    .max(250, 'Wzrost nie może przekraczać 250 cm')
    .integer('Wzrost musi być liczbą całkowitą')
});

// Ulepszona walidacja dla zmiany hasła
const passwordValidationSchema = yup.object({
  currentPassword: yup.string()
    .required('Obecne hasło jest wymagane'),
  newPassword: yup.string()
    .min(8, 'Nowe hasło musi mieć co najmniej 8 znaków')
    .matches(/[a-z]/, 'Hasło musi zawierać co najmniej jedną małą literę')
    .matches(/[A-Z]/, 'Hasło musi zawierać co najmniej jedną wielką literę')
    .matches(/[0-9]/, 'Hasło musi zawierać co najmniej jedną cyfrę')
    .matches(/[^a-zA-Z0-9]/, 'Hasło musi zawierać co najmniej jeden znak specjalny')
    .required('Nowe hasło jest wymagane'),
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

  // Funkcja do zbierania wszystkich błędów walidacyjnych
  const getValidationErrors = () => {
    const errors = [];
    
    if (profileFormik.touched.firstName && profileFormik.errors.firstName) {
      errors.push(profileFormik.errors.firstName);
    }
    
    if (profileFormik.touched.lastName && profileFormik.errors.lastName) {
      errors.push(profileFormik.errors.lastName);
    }
    
    if (profileFormik.touched.dateOfBirth && profileFormik.errors.dateOfBirth) {
      errors.push(profileFormik.errors.dateOfBirth);
    }
    
    if (profileFormik.touched.gender && profileFormik.errors.gender) {
      errors.push(profileFormik.errors.gender);
    }
    
    if (profileFormik.touched.weight && profileFormik.errors.weight) {
      errors.push(profileFormik.errors.weight);
    }
    
    if (profileFormik.touched.height && profileFormik.errors.height) {
      errors.push(profileFormik.errors.height);
    }
    
    return errors;
  };
  
  // Sprawdzenie czy są jakiekolwiek błędy walidacyjne i formularz był dotknięty
  const validationErrors = getValidationErrors();
  const hasValidationErrors = validationErrors.length > 0;

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
    <>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #4CAF50, #81C784)',
          padding: '0',
          gap: 2,
        }}
      >
        <Navbar />
        {/* Tło z ikonkami */}
        <BackgroundIcons />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        <Container maxWidth="lg">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <Paper elevation={3} sx={{ overflow: 'hidden', borderRadius: '12px' }}>
              {/* Nagłówek z przyciskami */}
              <Box sx={{
                backgroundColor: '#f5f5f5',
                padding: '24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e0e0e0'
              }}>
                <Typography variant="h4" sx={{ fontWeight: 600, color: '#333' }}>
                  Twój Profil
                </Typography>
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
              {/* Zawartość główna */}
              <Box sx={{ display: 'flex', flexDirection: 'column-reverse' }}>
                {/* Informacje o koncie */}
                <Box sx={{
                  padding: { xs: '16px', sm: '24px' },
                  borderBottom: '1px solid #e0e0e0'
                }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 3
                  }}>
                    <InfoIcon sx={{ color: '#4CAF50', mr: 1 }} />
                    <Typography variant="h5" sx={{ fontWeight: 500 }}>
                      Informacje o koncie
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <TextField
                      fullWidth
                      label="Nazwa użytkownika"
                      value={userData.username}
                      disabled
                      margin="normal"
                      InputProps={{
                        sx: { borderRadius: '8px' }
                      }}
                    />

                    <TextField
                      fullWidth
                      label="Email"
                      value={userData.email}
                      disabled
                      margin="normal"
                      InputProps={{
                        sx: { borderRadius: '8px' }
                      }}
                    />
                  </Box>
                </Box>

                {/* Bezpieczeństwo */}
                <Box sx={{
                  padding: { xs: '16px', sm: '24px' },
                  borderBottom: '1px solid #e0e0e0'
                }}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2
                  }}>
                    <SecurityIcon sx={{ color: '#4CAF50', mr: 1 }} />
                    <Typography variant="h6">Bezpieczeństwo</Typography>
                  </Box>

                  <Button
                    startIcon={<LockIcon />}
                    variant="outlined"
                    color="primary"
                    fullWidth
                    onClick={() => setPasswordDialog(true)}
                    sx={{
                      borderRadius: '8px',
                      padding: '10px',
                      borderColor: '#4CAF50',
                      color: '#4CAF50',
                      '&:hover': {
                        borderColor: '#45A049',
                        backgroundColor: 'rgba(76, 175, 80, 0.04)'
                      }
                    }}
                  >
                    Zmień hasło
                  </Button>
                </Box>

                {/* Dane osobowe */}
                <Box sx={{ padding: { xs: '16px', sm: '24px' }, borderBottom: '1px solid #e0e0e0'}}>
                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 3
                  }}>
                    <PersonIcon sx={{ color: '#4CAF50', mr: 1 }} />
                    <Typography variant="h5" sx={{ fontWeight: 500 }}>
                      Dane osobowe
                    </Typography>
                  </Box>

                  <form onSubmit={profileFormik.handleSubmit}>
                    <Grid container spacing={2} justifyContent={'center'}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Imię"
                          name="firstName"
                          value={profileFormik.values.firstName}
                          onChange={profileFormik.handleChange}
                          onBlur={profileFormik.handleBlur}
                          error={profileFormik.touched.firstName && Boolean(profileFormik.errors.firstName)}
                          disabled={!isEditing}
                          margin="normal"
                          InputProps={{
                            sx: { borderRadius: '8px', width: '170px' }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Nazwisko"
                          name="lastName"
                          value={profileFormik.values.lastName}
                          onChange={profileFormik.handleChange}
                          onBlur={profileFormik.handleBlur}
                          error={profileFormik.touched.lastName && Boolean(profileFormik.errors.lastName)}
                          disabled={!isEditing}
                          margin="normal"
                          InputProps={{
                            sx: { borderRadius: '8px', width: '170px' }
                          }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Data urodzenia"
                          name="dateOfBirth"
                          type="date"
                          value={profileFormik.values.dateOfBirth}
                          onChange={profileFormik.handleChange}
                          onBlur={profileFormik.handleBlur}
                          error={profileFormik.touched.dateOfBirth && Boolean(profileFormik.errors.dateOfBirth)}
                          disabled={!isEditing}
                          margin="normal"
                          InputLabelProps={{
                            shrink: true,
                          }}
                          InputProps={{
                            sx: { borderRadius: '8px' }
                          }}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <FormControl
                          fullWidth
                          margin="normal"
                          error={profileFormik.touched.gender && Boolean(profileFormik.errors.gender)}
                        >
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
                            onBlur={profileFormik.handleBlur}
                            disabled={!isEditing}
                            label="Płeć"
                            notched={Boolean(profileFormik.values.gender) || isEditing}
                            sx={{ borderRadius: '8px', width: '150px' }}
                          >
                            <MenuItem value="">Wybierz płeć</MenuItem>
                            <MenuItem value="male">Mężczyzna</MenuItem>
                            <MenuItem value="female">Kobieta</MenuItem>
                            <MenuItem value="other">Inna</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Waga (kg)"
                          name="weight"
                          type="number"
                          value={profileFormik.values.weight}
                          onChange={profileFormik.handleChange}
                          onBlur={profileFormik.handleBlur}
                          error={profileFormik.touched.weight && Boolean(profileFormik.errors.weight)}
                          disabled={!isEditing}
                          margin="normal"
                          InputProps={{
                            inputProps: {
                              step: 0.1,
                              min: 20,
                              max: 300
                            },
                            sx: { borderRadius: '8px' }
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Wzrost (cm)"
                          name="height"
                          type="number"
                          value={profileFormik.values.height}
                          onChange={profileFormik.handleChange}
                          onBlur={profileFormik.handleBlur}
                          error={profileFormik.touched.height && Boolean(profileFormik.errors.height)}
                          disabled={!isEditing}
                          margin="normal"
                          InputProps={{
                            inputProps: {
                              step: 1,
                              min: 50,
                              max: 250
                            },
                            sx: { borderRadius: '8px' }
                          }}
                        />
                      </Grid>
                      
                      {/* Sekcja z błędami walidacyjnymi */}
                      {isEditing && hasValidationErrors && (
                        <Grid item xs={12}>
                          <Box 
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              backgroundColor: '#ffebee',
                              padding: 2,
                              borderRadius: 1,
                            }}
                          >
                            <ErrorIcon color="error" sx={{ mr: 1, flexShrink: 0, mt: 0.25 }} />
                            <Typography color="error">
                              {validationErrors.join(', ')}
                            </Typography>
                          </Box>
                        </Grid>
                      )}
                    </Grid>
                  </form>
                </Box>
              </Box>
            </Paper>
          </motion.div>
        </Container>
      </Box>

      {/* Dialog zmiany hasła */}
      <Dialog
        open={passwordDialog}
        onClose={() => setPasswordDialog(false)}
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <DialogTitle sx={{
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center'
        }}>
          <LockIcon sx={{ mr: 1, color: '#4CAF50' }} />
          Zmień hasło
        </DialogTitle>
        <form onSubmit={passwordFormik.handleSubmit}>
          <DialogContent sx={{ pt: 3 }}>
            <DialogContentText sx={{ mb: 2 }}>
              Aby zmienić hasło, wprowadź swoje obecne hasło oraz nowe hasło.
            </DialogContentText>
            <TextField
              fullWidth
              label="Obecne hasło"
              name="currentPassword"
              type="password"
              value={passwordFormik.values.currentPassword}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              error={passwordFormik.touched.currentPassword && Boolean(passwordFormik.errors.currentPassword)}
              helperText={passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword}
              margin="normal"
              InputProps={{
                sx: { borderRadius: '8px' }
              }}
            />
            <TextField
              fullWidth
              label="Nowe hasło"
              name="newPassword"
              type="password"
              value={passwordFormik.values.newPassword}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              error={passwordFormik.touched.newPassword && Boolean(passwordFormik.errors.newPassword)}
              helperText={passwordFormik.touched.newPassword && passwordFormik.errors.newPassword}
              margin="normal"
              InputProps={{
                sx: { borderRadius: '8px' }
              }}
            />
            <TextField
              fullWidth
              label="Potwierdź nowe hasło"
              name="confirmPassword"
              type="password"
              value={passwordFormik.values.confirmPassword}
              onChange={passwordFormik.handleChange}
              onBlur={passwordFormik.handleBlur}
              error={passwordFormik.touched.confirmPassword && Boolean(passwordFormik.errors.confirmPassword)}
              helperText={passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword}
              margin="normal"
              InputProps={{
                sx: { borderRadius: '8px' }
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
            <Button
              onClick={() => setPasswordDialog(false)}
              sx={{ borderRadius: '8px' }}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                backgroundColor: '#4CAF50',
                '&:hover': { backgroundColor: '#45A049' },
                borderRadius: '8px'
              }}
            >
              Zmień hasło
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog potwierdzenia usunięcia konta */}
      <Dialog
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        PaperProps={{
          sx: { borderRadius: '12px' }
        }}
      >
        <DialogTitle sx={{
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          color: '#d32f2f'
        }}>
          <DeleteIcon sx={{ mr: 1, color: '#d32f2f' }} />
          Czy na pewno chcesz usunąć konto?
        </DialogTitle>
        <DialogContent sx={{ mt: 2, pt: 3 }}>
          <DialogContentText>
            Ta operacja jest nieodwracalna. Wszystkie Twoje dane zostaną usunięte z systemu. Czy jesteś pewien, że chcesz kontynuować?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button
            onClick={() => setDeleteDialog(false)}
            sx={{ borderRadius: '8px' }}
          >
            Anuluj
          </Button>
          <Button
            onClick={handleDeleteAccount}
            color="error"
            variant="contained"
            sx={{ borderRadius: '8px' }}
          >
            Usuń konto
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProfilePage;