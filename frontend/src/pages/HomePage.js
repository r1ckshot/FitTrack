import React from 'react';
import { Box, Button, Typography, Grid, Card } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { motion } from 'framer-motion';
import BackgroundIcons from '../components/BackgroundIcons'; // Import wspólnego komponentu

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        height: '100vh', // Całość w jednym widoku
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
        background: 'linear-gradient(135deg, #4CAF50, #81C784)',
      }}
    >
      {/* Tło z ikonkami */}
      <BackgroundIcons />

      {/* Lewa strona z nazwą projektu */}
      <motion.div
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1 }}
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative', // Ustawienie zdjęcia na wyższej warstwie
          zIndex: 1, // Zdjęcie i treść są nad ikonkami w tle
        }}
      >
        <Box
          sx={{
            width: '90%',
            height: '80%',
            backgroundImage: 'url("https://cdn.prod.website-files.com/6367f8198bef742a30d18cba/63ada715a1f81e20c820e8bb_wDpzFbIyPTEF_abBbSYiH5FGFfAB35sepoNRNCERqu8-p-800.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
          }}
        >
          <Typography
            variant="h2"
            align="center"
            sx={{
              color: '#ffffff',
              fontWeight: 700,
              textShadow: '0px 4px 8px rgba(0,0,0,0.4)',
              mb: 2,
            }}
          >
            FitTrack
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#ffffff',
                color: '#4CAF50',
                fontWeight: 'bold',
                '&:hover': { backgroundColor: '#f0f0f0' },
              }}
              onClick={() => navigate('/register')}
            >
              Zarejestruj się
            </Button>
            <Button
              variant="outlined"
              sx={{
                borderColor: '#ffffff',
                color: '#ffffff',
                fontWeight: 'bold',
                '&:hover': { borderColor: '#f0f0f0', backgroundColor: 'rgba(255, 255, 255, 0.1)' },
              }}
              onClick={() => navigate('/login')}
            >
              Zaloguj się
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* Prawa strona z funkcjonalnościami */}
      <motion.div
        initial={{ x: 200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1 }}
        style={{
          flex: 1,
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1, // Funkcjonalności również nad ikonkami
        }}
      >
        <Typography
          variant="h4"
          align="center"
          sx={{
            color: '#ffffff',
            fontWeight: 600,
            mb: 3,
          }}
        >
          Funkcjonalności aplikacji
        </Typography>
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} sm={6}>
            <Card
              sx={{
                background: '#ffffff',
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
                textAlign: 'center',
                padding: '20px',
              }}
            >
              <FitnessCenterIcon sx={{ fontSize: '40px', color: '#4CAF50', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Treningi
              </Typography>
              <Typography>Wyszukuj ćwiczenia z bazy.</Typography>
              <Typography>Dodawaj własne ćwiczenia.</Typography>
              <Typography>Twórz plany treningowe.</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card
              sx={{
                background: '#ffffff',
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
                textAlign: 'center',
                padding: '20px',
              }}
            >
              <RestaurantIcon sx={{ fontSize: '40px', color: '#4CAF50', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Dieta
              </Typography>
              <Typography>Wyszukuj potrawy z bazy.</Typography>
              <Typography>Dodawaj własne przepisy.</Typography>
              <Typography>Twórz plany dietetyczne.</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card
              sx={{
                background: '#ffffff',
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
                textAlign: 'center',
                padding: '20px',
              }}
            >
              <CalendarTodayIcon sx={{ fontSize: '40px', color: '#4CAF50', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Rezerwacje
              </Typography>
              <Typography>Zapisuj się na zajęcia grupowe.</Typography>
              <Typography>Umawiaj sesje prywatne z trenerem.</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Card
              sx={{
                background: '#ffffff',
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
                textAlign: 'center',
                padding: '20px',
              }}
            >
              <TrendingUpIcon sx={{ fontSize: '40px', color: '#4CAF50', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Postępy
              </Typography>
              <Typography>Śledź swoje parametry.</Typography>
              <Typography>Analizuj zmiany na wykresach.</Typography>
            </Card>
          </Grid>
        </Grid>
      </motion.div>
    </Box>
  );
};

export default HomePage;