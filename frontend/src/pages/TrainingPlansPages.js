import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, CardActions, IconButton, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Chip, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import BackgroundIcons from '../components/BackgroundIcons';
import Navbar from '../components/Navbar';
import TrainingPlanForm from '../components/TrainingPlanForm';
import TrainingPlanDetails from '../components/TrainingPlanDetails';
import api from '../services/api';

const TrainingPlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openForm, setOpenForm] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [viewMode, setViewMode] = useState('edit'); // 'edit' lub 'view'

  // Uniwersalna funkcja do pobierania ID planu (działa z obiema bazami)
  const getPlanId = (plan) => {
    if (!plan) return null;
    
    // Próbujemy znaleźć ID w różnych możliwych formatach
    return plan.mysqlId || plan._id || plan.id || null;
  };

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
    setViewMode('edit');
    setOpenForm(true);
  };

  // Handle opening form for editing plan
  const handleEditPlan = (plan) => {
    setSelectedPlan(plan);
    setViewMode('edit');
    setOpenForm(true);
  };

  // Handle opening details view for a plan
  const handleViewPlan = (plan) => {
    setSelectedPlan(plan);
    setViewMode('view');
    setOpenDetails(true);
  };

  // Handle plan deletion confirmation
  const handleDeleteConfirm = (plan) => {
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  // Handle actual deletion
  const handleDeletePlan = async () => {
    try {
      const planId = getPlanId(planToDelete);

      // Jeśli żadne ID nie jest dostępne, zgłoś błąd
      if (!planId) {
        throw new Error('Nie można usunąć planu. Brak ID planu.');
      }

      // Wywołanie API z odpowiednim ID
      await api.delete(`/training-plans/${planId}`);

      // Zamknięcie okna dialogowego i odświeżenie listy planów
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
      await fetchPlans();
    } catch (error) {
      console.error('Błąd podczas usuwania planu treningowego:', error);
    }
  };

  // Handle form close
  const handleFormClose = (refreshNeeded = false) => {
    setOpenForm(false);
    setSelectedPlan(null);
    if (refreshNeeded) {
      fetchPlans();
    }
  };

  // Handle details view close
  const handleDetailsClose = () => {
    setOpenDetails(false);
    setSelectedPlan(null);
  };

  // Handle activating a plan
  const handleActivatePlan = async (plan) => {
    try {
      // Najpierw deaktywujemy wszystkie aktywne plany
      await Promise.all(
        plans
          .filter(p => p.isActive)
          .map(async (p) => {
            const id = getPlanId(p);
            if (id) {
              await api.put(`/training-plans/${id}`, { ...p, isActive: false });
            }
          })
      );
      
      // Następnie aktywujemy wybrany plan
      const planId = getPlanId(plan);
      if (planId) {
        await api.put(`/training-plans/${planId}`, { ...plan, isActive: true });
        
        // Odświeżamy listę planów
        fetchPlans();
      } else {
        console.error('Nie można aktywować planu. Brak ID planu.');
      }
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
              textShadow: '0px 4px 8px rgba(0,0,0,0.4)',
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
                color: '#42A5F5',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: '#f0f0f0',
                },
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
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
                  backgroundColor: '#42A5F5',
                  '&:hover': {
                    backgroundColor: '#0b7dda',
                  },
                }}
              >
                Dodaj Plan
              </Button>
            </Box>
          </motion.div>
        ) : (
          <Grid container spacing={3}>
            {plans.map((plan, index) => (
              <Grid item xs={12} sm={6} md={4} key={getPlanId(plan) || index}>
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
                      borderLeft: plan.isActive ? '5px solid #42A5F5' : 'none',
                      boxShadow: plan.isActive
                        ? '0 0 20px rgba(76,92,175,0.5)'
                        : '0 4px 8px rgba(0,0,0,0.1)',
                    }}
                  >
                    {plan.isActive && (
                      <Chip
                        label="AKTYWNY"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          backgroundColor: '#42A5F5',
                          color: 'white',
                          fontWeight: 'bold',
                          zIndex: 1,
                        }}
                      />
                    )}
                    <CardContent sx={{ flexGrow: 1, pt: plan.isActive ? 4 : 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <FitnessCenterIcon
                          sx={{ fontSize: 30, color: '#42A5F5', mr: 1, flexShrink: 0 }}
                        />
                        <Tooltip title={plan.name} placement="top">
                          <Typography 
                            variant="h6" 
                            component="div"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              lineHeight: '1.2',
                              maxHeight: '2.4em'
                            }}  
                          >
                            {plan.name}
                          </Typography>
                        </Tooltip>
                      </Box>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          height: '3.6em'
                        }}
                      >
                        {plan.description || 'Brak opisu'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Dni treningowe: {plan.days?.length || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Utworzono: {new Date(plan.dateCreated || Date.now()).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                      <Box>
                        <Tooltip title="Przeglądaj">
                          <IconButton
                            size="small"
                            onClick={() => handleViewPlan(plan)}
                            sx={{ color: '#FBBC05' }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edytuj">
                          <IconButton
                            size="small"
                            onClick={() => handleEditPlan(plan)}
                            sx={{ color: '#4285F4' }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Usuń">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteConfirm(plan)}
                            sx={{ color: '#EA4335' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      {!plan.isActive && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleActivatePlan(plan)}
                          sx={{
                            color: '#42A5F5',
                            borderColor: '#42A5F5',
                            '&:hover': {
                              borderColor: '#0b7dda',
                              backgroundColor: 'rgba(76,92,175,0.1)',
                            },
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
        disableEscapeKeyDown={false}
      >
        <DialogTitle>
          {selectedPlan ? 'Edytuj Plan Treningowy' : 'Dodaj Nowy Plan Treningowy'}
        </DialogTitle>
        <DialogContent dividers>
          <TrainingPlanForm plan={selectedPlan} onClose={handleFormClose} />
        </DialogContent>
      </Dialog>

      {/* Training Plan Details Dialog */}
      <Dialog
        open={openDetails}
        onClose={handleDetailsClose}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Szczegóły Planu Treningowego</DialogTitle>
        <DialogContent dividers>
          {selectedPlan && <TrainingPlanDetails plan={selectedPlan} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDetailsClose}>Zamknij</Button>
          <Button 
            onClick={() => {
              handleDetailsClose();
              handleEditPlan(selectedPlan);
            }}
            color="primary"
          >
            Edytuj Plan
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
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