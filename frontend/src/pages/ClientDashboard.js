import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardActionArea } from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BackgroundIcons from '../components/BackgroundIcons';
import Navbar from '../components/Navbar'; 
import { LineChart } from '@mui/x-charts';
import api from '../services/api';

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState([]);
  const [chartKey, setChartKey] = useState(0);

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

  // Konfiguracja animacji dla kart
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.5,
      },
    }),
  };

  // Dane kart
  const cardData = [
    {
      icon: <FitnessCenterIcon sx={{ fontSize: '50px', color: '#42A5F5', mb: 2 }} />,
      title: 'Mój Plan Treningowy',
      description: 'Przeglądaj i edytuj swój plan treningowy.',
      path: '/exercises',
      color: '#42A5F5'
    },
    {
      icon: <RestaurantIcon sx={{ fontSize: '50px', color: '#FF7043', mb: 2 }} />,
      title: 'Moja Dieta',
      description: 'Twórz i zarządzaj swoim planem dietetycznym.',
      path: '/diets',
      color: '#FF7043'
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: '50px', color: '#EC407A', mb: 2 }} />,
      title: 'Śledź Postępy',
      description: 'Monitoruj swoje wyniki i analizuj zmiany.',
      path: '/progress',
      color: '#EC407A'
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: '50px', color: '#EC407A', mb: 2 }} />,
      title: 'Trendy!',
      description: 'Monitoruj swoje wyniki i analizuj zmiany.',
      path: '/analytics',
      color: '#EC407B'
    }
  ];

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
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        {/* Tło z ikonkami */}
        <BackgroundIcons />

        <motion.div
          initial={{ y: -200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1 }}
          style={{ textAlign: 'center', zIndex: 1 }}
        >
          <Typography
            variant="h4"
            sx={{
              color: '#ffffff',
              fontWeight: 700,
              mb: 4,
              textShadow: '0px 4px 8px rgba(0,0,0,0.4)',
            }}
          >
            Witaj w swoim Dashboardzie
          </Typography>
        </motion.div>

        {/* Karty z funkcjonalnościami - teraz z animacją sekwencyjną */}
        <Grid container spacing={3} justifyContent="center" sx={{ zIndex: 1 }}>
          {cardData.map((card, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <motion.div
                custom={index}
                initial="hidden"
                animate="visible"
                variants={cardVariants}
                whileHover={{ scale: 1.05 }}
              >
                <Card
                  sx={{
                    background: '#ffffff',
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
                    textAlign: 'center',
                    borderTop: `4px solid ${card.color}`,
                  }}
                  onClick={() => navigate(card.path)}
                >
                  <CardActionArea sx={{ padding: '20px' }}>
                    {card.icon}
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {card.title}
                    </Typography>
                    <Typography>{card.description}</Typography>
                  </CardActionArea>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Wykres */}
        <Box
          sx={{
            width: '100%',
            maxWidth: '900px',
            marginTop: '40px',
            background: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
            padding: '20px',
            zIndex: 1,
          }}
        >
          <Typography variant="h6" align="center" gutterBottom>
            Twoje Postępy
          </Typography>
          <motion.div
            key={chartKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
          >
            {progressData.length > 0 ? (
              <LineChart
                width={800}
                height={350}
                series={[
                  { data: chartData.y, label: 'Waga (kg)' },
                  { data: chartData.y2, label: 'Czas Treningu (min)' },
                ]}
                xAxis={[
                  {
                    scaleType: 'point',
                    data: chartData.x,
                  },
                ]}
              />
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

export default ClientDashboard;