import { Box, Button, Typography, Grid, Card } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import BarChartIcon from '@mui/icons-material/BarChart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import BackgroundIcons from '../components/common/BackgroundIcons';

const HomePage = () => {
  const navigate = useNavigate();
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Lista kart funkcjonalności
  const featureCards = [
    {
      icon: <FitnessCenterIcon sx={{ fontSize: '40px', color: '#2196F3', mb: 2 }} />,
      title: 'Plany Treningowe',
      description: [
        'Wyszukuj ćwiczenia z bazy.',
        'Dodawaj własne ćwiczenia.',
        'Twórz plany treningowe.'
      ]
    },
    {
      icon: <RestaurantIcon sx={{ fontSize: '40px', color: '#FF7043', mb: 2 }} />,
      title: 'Plany Dietetyczne',
      description: [
        'Wyszukuj potrawy z bazy.',
        'Dodawaj własne przepisy.',
        'Twórz plany dietetyczne.'
      ]
    },
    {
      icon: <BarChartIcon sx={{ fontSize: '40px', color: '#8E24AA', mb: 2 }} />,
      title: 'Śledź Postępy',
      description: [
        'Monitoruj swoje wyniki.',
        'Analizuj zmiany na wykresach.'
      ]
    },
    {
      icon: <AttachMoneyIcon sx={{ fontSize: '40px', color: '#EFBF04', mb: 2 }} />,
      title: 'Rób Analizy',
      description: [
        'Dokonaj analizy zdrowia z ekomomią.',
        'Wybierz interesujące Cię kraje i okresy czasu.',
      ]
    }
  ];

  // Efekt do automatycznej zmiany aktywnej karty co kilka sekund
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCardIndex((prevIndex) => (prevIndex + 1) % featureCards.length);
    }, 3000); // Zmiana co 3 sekundy

    return () => clearInterval(interval);
  }, [featureCards.length]);

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        overflow: 'hidden',
        position: 'relative',
        background: 'linear-gradient(135deg, #4CAF50, #81C784)',
      }}
    >
      {/* Tło z ikonkami */}
      <BackgroundIcons />

      {/* Lewa strona z nazwą projektu i animowanym konturem obrazka */}
      <motion.div
        initial={{ x: -200, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1 }}
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            width: '90%',
            height: '80%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {/* Obrazek z animowanym gradientem obramowania */}
          <Box
            component="img"
            src="https://cdn.prod.website-files.com/6367f8198bef742a30d18cba/63ada715a1f81e20c820e8bb_wDpzFbIyPTEF_abBbSYiH5FGFfAB35sepoNRNCERqu8-p-800.png"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '8px',
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
              border: '3px solid',
              borderImageSlice: 1,
              borderImageSource: 'linear-gradient(45deg, #4CAF50, #81C784, #4CAF50, #81C784)',
              animation: 'animatedgradient 3s ease alternate infinite',
              '@keyframes animatedgradient': {
                '0%': {
                  borderImageSource: 'linear-gradient(45deg, #4CAF50, #81C784, #4CAF50, #81C784)',
                },
                '50%': {
                  borderImageSource: 'linear-gradient(45deg, #81C784, #4CAF50, #81C784, #4CAF50)',
                },
                '100%': {
                  borderImageSource: 'linear-gradient(45deg, #4CAF50, #81C784, #4CAF50, #81C784)',
                }
              }
            }}
          />

          {/* Zawartość nad obrazkiem */}
          <Box
            sx={{
              position: 'absolute',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
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
          zIndex: 1,
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
        <Grid container spacing={4} justifyContent="center">
          {featureCards.map((card, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <motion.div
                animate={{
                  scale: activeCardIndex === index ? 1.1 : 1.05,
                  boxShadow: activeCardIndex === index ?
                    '0px 8px 30px rgba(0, 0, 0, 0.3)' :
                    '0px 4px 20px rgba(0, 0, 0, 0.2)',
                }}
                transition={{
                  duration: 0.5,
                  ease: "easeInOut"
                }}
              >
                <Card
                  sx={{
                    background: '#ffffff',
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
                    textAlign: 'center',
                    padding: '20px',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    border: activeCardIndex === index ? `3px solid ${index === 0 ? '#2196F3' : index === 1 ? '#FF7043' : index === 2 ? '#8E24AA' : '#EFBF04'}` : 'none',
                  }}
                >
                  {card.icon}
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {card.title}
                  </Typography>
                  {card.description.map((line, i) => (
                    <Typography key={i}>{line}</Typography>
                  ))}
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>
    </Box>
  );
};

export default HomePage;