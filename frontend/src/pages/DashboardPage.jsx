import { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardActionArea, useMediaQuery, useTheme } from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import BarChartIcon from '@mui/icons-material/BarChart';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BackgroundIcons from '../components/common/BackgroundIcons';
import Navbar from '../components/common/Navbar';
import { LineChart } from '@mui/x-charts';
import api from '../services/api';


const DashboardPage = () => {
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState([]);
  const [chartKey, setChartKey] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Pobierz dane postępów użytkownika
  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        const response = await api.get('/progress');
        setProgressData(response.data);
        setChartKey((prevKey) => prevKey + 1);
      } catch (error) {
        console.error('Błąd podczas pobierania danych postępów:', error);
      }
    };

    fetchProgressData();
  }, []);

  const handleStepChange = (step) => {
    setActiveStep(step);
  };

  // Przygotuj dane dla wykresu
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
  };

  const chartData = {
    x: progressData.map((entry) => formatDate(entry.date)),
    y: progressData.map((entry) => entry.weight),
    y2: progressData.map((entry) => entry.trainingTime),
  };

  console.log(chartData)

  // Konfiguracja animacji dla kart
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15,
        duration: 0.5,
      },
    }),
  };

  // Konfiguracja animacji dla przycisków
  const buttonVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.6,
        type: "spring",
        stiffness: 100
      },
    }),
  };

  const cardGroups = [
    {
      title: "Treningi i Dieta",
      cards: [
        {
          icon: <FitnessCenterIcon sx={{ fontSize: '50px', color: '#2196F3', mb: 2 }} />,
          title: 'Moje Treningi',
          description: 'Przeglądaj i edytuj swój plan treningowy.',
          path: '/exercises',
          color: '#2196F3'
        },
        {
          icon: <RestaurantIcon sx={{ fontSize: '50px', color: '#FF7043', mb: 2 }} />,
          title: 'Moje Diety',
          description: 'Twórz i zarządzaj swoim planem dietetycznym.',
          path: '/diets',
          color: '#FF7043'
        },
      ]
    },
    {
      title: "Postępy i Analiza",
      cards: [
        {
          icon: <BarChartIcon sx={{ fontSize: '50px', color: '#8E24AA', mb: 2 }} />,
          title: 'Moje Postępy',
          description: 'Monitoruj swoje wyniki i analizuj zmiany.',
          path: '/progress',
          color: '#8E24AA'
        },
        {
          icon: <QueryStatsIcon sx={{ fontSize: '50px', color: '#EFBF04', mb: 2 }} />,
          title: 'Moje Analizy',
          description: 'Analiza związku zdrowia z ekonomią.',
          path: '/analytics',
          color: '#EFBF04'
        }
      ]
    }
  ];

  const renderCardGroups = () => {
    return (
      <>
        <Box sx={{ width: '100%', mb: 2 }}>
          {/* Przełącznik grup - widoczny na wszystkich urządzeniach */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            mb: 4,
            width: '100%',
            maxWidth: '400px',
            mx: 'auto'
          }}>
            {cardGroups.map((group, index) => (
              <motion.div
                key={index}
                custom={index}
                initial="hidden"
                animate="visible"
                variants={buttonVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                style={{ flex: 1 }}
              >
                <Box
                  sx={{
                    px: { xs: 1.5, sm: 2 },
                    py: 1,
                    mx: { xs: 0.5, sm: 1 },
                    borderRadius: '20px',
                    cursor: 'pointer',
                    bgcolor: index === activeStep ? '#4CAF50' : 'rgba(255, 255, 255, 0.7)',
                    color: index === activeStep ? 'white' : '#424242',
                    fontWeight: index === activeStep ? 'bold' : 'normal',
                    transition: 'all 0.3s ease',
                    boxShadow: index === activeStep ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
                    textAlign: 'center',
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={() => handleStepChange(index)}
                >
                  {group.title}
                </Box>
              </motion.div>
            ))}
          </Box>

          {/* Karty aktywnej grupy */}
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Box
              sx={{
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '12px',
                boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.15)',
                padding: { xs: '16px', sm: '20px' },
                maxWidth: '700px',
                mx: 'auto',
              }}
            >
              <Typography
                variant={isMobile ? "h6" : "h5"}
                sx={{
                  fontWeight: 600,
                  mb: 2,
                  color: '#424242',
                  borderBottom: '2px solid #4CAF50',
                  paddingBottom: '8px',
                  display: 'inline-block',
                }}
              >
                {cardGroups[activeStep].title}
              </Typography>

              <Grid container spacing={isMobile ? 2 : 3} justifyContent="center">
                {cardGroups[activeStep].cards.map((card, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <motion.div
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      variants={cardVariants}
                      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
                    >
                      <Card
                        sx={{
                          background: '#ffffff',
                          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
                          textAlign: 'center',
                          borderLeft: `6px solid ${card.color}`,
                          borderRadius: '8px',
                          height: '100%',
                        }}
                        onClick={() => navigate(card.path)}
                      >
                        <CardActionArea sx={{
                          padding: { xs: '16px', sm: '20px' },
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center'
                        }}>
                          {card.icon}
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                            {card.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {card.description}
                          </Typography>
                        </CardActionArea>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </motion.div>
        </Box>
      </>
    );
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #4CAF50, #81C784)',
        padding: '0',
      }}
    >
      {/* Navbar */}
      <Navbar />

      {/* Główne treści */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '20px',
          paddingTop: '20px',
          gap: '20px',
        }}
      >
        {/* Tło z ikonkami */}
        <BackgroundIcons />

        {/* Karty z funkcjonalnościami */}
        {renderCardGroups()}

        {/* Wykres */}
        <Box
          sx={{
            width: '100%',
            maxWidth: '1000px',
            background: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '12px',
            boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.15)',
            padding: { xs: '15px', sm: '25px' },
            zIndex: 1,
          }}
        >
          <Typography
            variant="h5"
            align="center"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: '#424242',
              borderBottom: '2px solid #4CAF50',
              paddingBottom: '8px',
              display: 'inline-block',
              marginLeft: '50%',
              transform: 'translateX(-50%)',
              marginBottom: '20px'
            }}
          >
            Twoje Postępy
          </Typography>
          <motion.div
            key={chartKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 3 }}
            style={{ width: '100%', overflowX: 'auto' }}
          >
            {progressData.length > 0 ? (
              <Box sx={{ minWidth: { xs: '320px', sm: '600px', md: '100%' }, maxWidth: '100%', margin: '0 auto' }}>
                <LineChart
                  width={isMobile ? 320 : 900}
                  height={isMobile ? 250 : 350}
                  series={[
                    {
                      data: chartData.y,
                      label: 'Waga (kg)',
                      color: '#8E24AA',
                      showMark: true,
                      valueFormatter: (value) => `${value} kg`,
                      markStyle: {
                        r: 5,
                        stroke: '#fff',
                        strokeWidth: 2,
                        fill: '#8E24AA', 
                      }
                    },
                    {
                      data: chartData.y2,
                      label: 'Czas Treningu (min)',
                      color: '#2196F3',
                      showMark: true,
                      valueFormatter: (value) => `${value} min`,
                      markStyle: {
                        r: 5,
                        stroke: '#fff',
                        strokeWidth: 2,
                        fill: '#2196F3', 
                      }
                    },
                  ]}
                  xAxis={[
                    {
                      scaleType: 'point',
                      data: chartData.x,
                    },
                  ]}
                  sx={{
                    '.MuiLineElement-root': {
                      strokeWidth: 4,
                    },
                  }}
                  slotProps={{
                    legend: {
                      direction: 'row',
                      position: { vertical: 'bottom', horizontal: 'center' },
                      padding: { top: 20 },
                    },
                  }}
                />
              </Box>
            ) : (
              <Typography align="center" sx={{ py: 8, color: '#757575' }}>
                Brak danych do wyświetlenia. Rozpocznij śledzenie swoich postępów.
              </Typography>
            )}
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardPage;