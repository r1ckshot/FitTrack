import React from 'react';
import { Box, Typography, Grid, Card, CardActionArea } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import BackgroundIcons from '../components/BackgroundIcons';
import Navbar from '../components/Navbar'; 

const TrainerDashboard = () => {
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
          Dashboard Trenera
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
              onClick={() => navigate('/clients')}
            >
              <CardActionArea sx={{ padding: '20px' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Zarządzaj Klientami
                </Typography>
                <Typography>Przeglądaj i zarządzaj swoimi klientami.</Typography>
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
              onClick={() => navigate('/create-plan')}
            >
              <CardActionArea sx={{ padding: '20px' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Twórz Plany Treningowe
                </Typography>
                <Typography>Twórz i zarządzaj planami treningowymi.</Typography>
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
              onClick={() => navigate('/statistics')}
            >
              <CardActionArea sx={{ padding: '20px' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Statystyki Klientów
                </Typography>
                <Typography>Analizuj postępy swoich klientów.</Typography>
              </CardActionArea>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
    </>
  );
};

export default TrainerDashboard;