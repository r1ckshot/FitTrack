import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Snackbar, Alert } from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import { motion } from 'framer-motion';
import api from '../services/api';
import Navbar from '../components/Navbar'; // Import Navbar
import BackgroundIcons from '../components/BackgroundIcons'; // Import tła z ikonami

const ProgressPage = () => {
  const [progressData, setProgressData] = useState([]);
  const [formData, setFormData] = useState({
    weight: '',
    trainingTime: '',
    date: new Date().toISOString().substring(0, 10),
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchProgressData = async () => {
    try {
      const response = await api.get('/progress');
      setProgressData(response.data);
    } catch (error) {
      console.error('Błąd podczas pobierania danych postępów:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await api.put(`/progress/${editId}`, formData);
        setEditMode(false);
        setEditId(null);
        setSnackbar({ open: true, message: 'Postępy zaktualizowane pomyślnie!', severity: 'success' });
      } else {
        await api.post('/progress', formData);
        setSnackbar({ open: true, message: 'Postępy dodane pomyślnie!', severity: 'success' });
      }
      fetchProgressData();
      setFormData({ weight: '', trainingTime: '', date: new Date().toISOString().substring(0, 10) });
    } catch (error) {
      console.error('Błąd podczas zapisywania postępów:', error);
      setSnackbar({ open: true, message: 'Błąd podczas zapisywania postępów.', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/progress/${id}`);
      fetchProgressData();
      setSnackbar({ open: true, message: 'Postępy usunięte pomyślnie!', severity: 'success' });
    } catch (error) {
      console.error('Błąd podczas usuwania postępów:', error);
      setSnackbar({ open: true, message: 'Błąd podczas usuwania postępów.', severity: 'error' });
    }
  };

  const handleEdit = (entry) => {
    setFormData({
      weight: entry.weight,
      trainingTime: entry.trainingTime,
      date: entry.date.substring(0, 10),
    });
    setEditMode(true);
    setEditId(entry._id || entry.id);
  };

  useEffect(() => {
    fetchProgressData();
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #4CAF50, #81C784)',
      }}
    >
      {/* Navbar */}
      <Navbar />

      {/* Tło z ikonami */}
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

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
        }}
      >
        <motion.div
          initial={{ y: -200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          style={{
            width: '90%',
            maxWidth: '1200px',
            borderRadius: '8px',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
            background: '#ffffff',
            padding: '20px',
          }}
        >
          <Typography variant="h4" align="center" gutterBottom>
            Śledzenie Postępów
          </Typography>

          {/* Formularz */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}
          >
            <TextField
              label="Waga (kg)"
              type="number"
              inputProps={{ min: 30, max: 150 }}
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              required
            />
            <TextField
              label="Czas Treningu (minuty)"
              type="number"
              inputProps={{ min: 1, max: 240 }}
              value={formData.trainingTime}
              onChange={(e) => setFormData({ ...formData, trainingTime: e.target.value })}
              required
            />
            <TextField
              label="Data"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
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
              {editMode ? 'Zapisz Zmiany' : 'Dodaj Postępy'}
            </Button>
          </Box>

          {/* Tabela */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Waga (kg)</TableCell>
                  <TableCell>Czas Treningu (min)</TableCell>
                  <TableCell>Akcje</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {progressData.map((entry) => (
                  <TableRow key={entry._id || entry.id}>
                    <TableCell>{entry.date.substring(0, 10)}</TableCell>
                    <TableCell>{entry.weight}</TableCell>
                    <TableCell>{entry.trainingTime}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEdit(entry)}>
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(entry._id || entry.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </motion.div>
      </Box>
    </Box>
  );
};

export default ProgressPage;