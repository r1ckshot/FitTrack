import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardActionArea } from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BackgroundIcons from '../components/BackgroundIcons';
import Navbar from '../components/Navbar'; 
import { LineChart } from '@mui/x-charts';
import api from '../services/api';

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [progressData, setProgressData] = useState([]);
  const [chartKey, setChartKey] = useState(0); // Klucz do resetowania animacji wykresu

  // Pobierz dane postępów użytkownika
  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        const response = await api.get('/progress');
        setProgressData(response.data);
        setChartKey((prevKey) => prevKey + 1); // Odśwież animację wykresu
      } catch (error) {
        console.error('Błąd podczas pobierania danych postępów:', error);
      }
    };

    fetchProgressData();
  }, []);

  // Przygotuj dane dla wykresu
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' }); // Format MM/DD
  };

  const chartData = {
    x: progressData.map((entry) => formatDate(entry.date)), // Skrócone daty w formacie MM/DD
    y: progressData.map((entry) => entry.weight), // Waga
    y2: progressData.map((entry) => entry.trainingTime), // Czas treningu
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

        {/* Karty z funkcjonalnościami */}
        <Grid container spacing={3} justifyContent="center" sx={{ zIndex: 1 }}>
          <Grid item xs={12} sm={6} md={4}>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Card
                sx={{
                  background: '#ffffff',
                  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
                  textAlign: 'center',
                }}
                onClick={() => navigate('/plans')}
              >
                <CardActionArea sx={{ padding: '20px' }}>
                  <FitnessCenterIcon sx={{ fontSize: '50px', color: '#4CAF50', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Mój Plan Treningowy
                  </Typography>
                  <Typography>Przeglądaj i edytuj swój plan treningowy.</Typography>
                </CardActionArea>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Card
                sx={{
                  background: '#ffffff',
                  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
                  textAlign: 'center',
                }}
                onClick={() => navigate('/diet')}
              >
                <CardActionArea sx={{ padding: '20px' }}>
                  <RestaurantIcon sx={{ fontSize: '50px', color: '#4CAF50', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Moja Dieta
                  </Typography>
                  <Typography>Twórz i zarządzaj swoim planem dietetycznym.</Typography>
                </CardActionArea>
              </Card>
            </motion.div>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Card
                sx={{
                  background: '#ffffff',
                  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
                  textAlign: 'center',
                }}
                onClick={() => navigate('/progress')}
              >
                <CardActionArea sx={{ padding: '20px' }}>
                  <TrendingUpIcon sx={{ fontSize: '50px', color: '#4CAF50', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    Śledź Postępy
                  </Typography>
                  <Typography>Monitoruj swoje wyniki i analizuj zmiany.</Typography>
                </CardActionArea>
              </Card>
            </motion.div>
          </Grid>
        </Grid>

        {/* Wykres */}
        <Box
          sx={{
            width: '100%',
            maxWidth: '900px', // Zwiększona szerokość wykresu
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
            key={chartKey} // Klucz wymusza odświeżenie animacji
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }} // Spowolnienie animacji wejścia
          >
            <LineChart
              width={800} // Zwiększona szerokość wykresu
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
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
};

export default ClientDashboard;