import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, CardActions, IconButton, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import BackgroundIcons from '../components/BackgroundIcons';
import Navbar from '../components/Navbar';
import TrainingPlanForm from '../components/TrainingPlanForm';
import api from '../services/api';

const TrainingPlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);

  // Fetch all training plans
  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await api.get('/training-plans');
      setPlans(response.data);
    } catch (error) {
      console.error('Błąd podczas pobierania planów treningowych:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  // Handle opening form for new plan
  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setOpenForm(true);
  };

  // Handle opening form for editing plan
  const handleEditPlan = (plan) => {
    setSelectedPlan(plan);
    setOpenForm(true);
  };

  // Handle plan deletion confirmation
  const handleDeleteConfirm = (plan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  // Handle actual deletion
  const handleDeletePlan = async () => {
    try {
      await api.delete(`/training-plans/${planToDelete._id || planToDelete.id}`);
      fetchPlans();
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    } catch (error) {
      console.error('Błąd podczas usuwania planu treningowego:', error);
    }
  };

  // Handle form close
  const handleFormClose = (refreshNeeded = false) => {
    setOpenForm(false);
    if (refreshNeeded) {
      fetchPlans();
    }
  };

  // Handle activating a plan
  const handleActivatePlan = async (plan) => {
    try {
      // First deactivate all plans
      await Promise.all(
        plans
          .filter(p => p.isActive)
          .map(p => api.put(`/training-plans/${p._id || p.id}`, { ...p, isActive: false }))
      );
      
      // Then activate the selected plan
      await api.put(`/training-plans/${plan._id || plan.id}`, { ...plan, isActive: true });
      fetchPlans();
    } catch (error) {
      console.error('Błąd podczas aktywacji planu treningowego:', error);
    }
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
      <Navbar />
      <BackgroundIcons />
      
      <Box sx={{ padding: '20px', flex: 1 }}>
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Typography 
            variant="h4" 
            align="center" 
            sx={{ 
              color: 'white', 
              mb: 4, 
              fontWeight: 700,
              textShadow: '0px 4px 8px rgba(0,0,0,0.4)'
            }}
          >
            Twoje Plany Treningowe
          </Typography>
        </motion.div>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <motion.div whileHover={{ scale: 1.05 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreatePlan}
              sx={{
                backgroundColor: 'white',
                color: '#4CAF50',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: '#f0f0f0',
                }
              }}
            >
              Dodaj Nowy Plan
            </Button>
          </motion.div>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress sx={{ color: 'white' }} />
          </Box>
        ) : plans.length === 0 ? (
          <Box
            sx={{
              backgroundColor: 'rgba(255,255,255,0.8)',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" gutterBottom>
              Nie masz jeszcze żadnych planów treningowych
            </Typography>
            <Typography variant="body1" gutterBottom>
              Stwórz swój pierwszy plan treningowy, aby zacząć.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreatePlan}
              sx={{
                mt: 2,
                backgroundColor: '#4CAF50',
                '&:hover': {
                  backgroundColor: '#3b8a3e',
                }
              }}
            >
              Dodaj Plan
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {plans.map((plan, index) => (
              <Grid item xs={12} sm={6} md={4} key={plan._id || plan.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      borderLeft: plan.isActive ? '5px solid #4CAF50' : 'none',
                      boxShadow: plan.isActive ? '0 0 20px rgba(76,175,80,0.5)' : '0 4px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    {plan.isActive && (
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          top: 10, 
                          right: 10, 
                          backgroundColor: '#4CAF50',
                          color: 'white',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}
                      >
                        AKTYWNY
                      </Box>
                    )}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <FitnessCenterIcon sx={{ fontSize: 30, color: '#4CAF50', mr: 1 }} />
                        <Typography variant="h6" component="div">
                          {plan.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {plan.description || 'Brak opisu'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Dni treningowe: {plan.days?.length || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Utworzono: {new Date(plan.dateCreated).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                      <Box>
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditPlan(plan)}
                          sx={{ color: '#4285F4' }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteConfirm(plan)}
                          sx={{ color: '#EA4335' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      {!plan.isActive && (
                        <Button 
                          size="small" 
                          variant="outlined"
                          onClick={() => handleActivatePlan(plan)}
                          sx={{ 
                            color: '#4CAF50', 
                            borderColor: '#4CAF50',
                            '&:hover': {
                              borderColor: '#3b8a3e',
                              backgroundColor: 'rgba(76,175,80,0.1)'
                            }
                          }}
                        >
                          Aktywuj
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Training Plan Form Dialog */}
      <Dialog
        open={openForm}
        onClose={() => handleFormClose()}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {selectedPlan ? 'Edytuj Plan Treningowy' : 'Dodaj Nowy Plan Treningowy'}
        </DialogTitle>
        <DialogContent dividers>
          <TrainingPlanForm 
            plan={selectedPlan} 
            onClose={handleFormClose} 
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Potwierdzenie usunięcia</DialogTitle>
        <DialogContent>
          <Typography>
            Czy na pewno chcesz usunąć plan "{planToDelete?.name}"? Tej operacji nie można cofnąć.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Anuluj</Button>
          <Button 
            onClick={handleDeletePlan} 
            sx={{ color: '#EA4335' }}
            autoFocus
          >
            Usuń
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrainingPlansPage;