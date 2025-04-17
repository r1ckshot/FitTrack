import React from 'react';
import { Box, Typography, Grid, Card, CardActionArea } from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BackgroundIcons from '../components/BackgroundIcons'; 
import Navbar from '../components/Navbar'; 

const ClientDashboard = () => {
  const navigate = useNavigate();

  return (
    <>
    <Navbar />
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #4CAF50, #81C784)',
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
    </Box>
    </>
  );
};

export default ClientDashboard;