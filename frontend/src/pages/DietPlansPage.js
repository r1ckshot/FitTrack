import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, CardActions, IconButton, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Chip, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import BackgroundIcons from '../components/BackgroundIcons';
import Navbar from '../components/Navbar';
import DietPlanForm from '../components/DietPlanForm';
import DietPlanDetails from '../components/DietPlanDetails';
import api from '../services/api';

const DietPlansPage = () => {
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
    return plan.mysqlId || plan._id || plan.id || null;
  };

  // Fetch all diet plans
  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await api.get('/diet-plans');
      setPlans(response.data);
    } catch (error) {
      console.error('Błąd podczas pobierania planów dietetycznych:', error);
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
      if (!planId) throw new Error('Nie można usunąć planu. Brak ID planu.');

      await api.delete(`/diet-plans/${planId}`);

      setDeleteDialogOpen(false);
      setPlanToDelete(null);
      await fetchPlans();
    } catch (error) {
      console.error('Błąd podczas usuwania planu dietetycznego:', error);
    }
  };

  // Handle form close
  const handleFormClose = (refreshNeeded = false) => {
    setOpenForm(false);
    setSelectedPlan(null);
    if (refreshNeeded) fetchPlans();
  };

  // Handle details view close
  const handleDetailsClose = () => {
    setOpenDetails(false);
    setSelectedPlan(null);
  };

  // Handle activating a plan
  const handleActivatePlan = async (plan) => {
    try {
      await Promise.all(
        plans
          .filter(p => p.isActive)
          .map(async (p) => {
            const id = getPlanId(p);
            if (id) await api.put(`/diet-plans/${id}`, { ...p, isActive: false });
          })
      );

      const planId = getPlanId(plan);
      if (planId) {
        await api.put(`/diet-plans/${planId}`, { ...plan, isActive: true });
        fetchPlans();
      } else {
        console.error('Nie można aktywować planu. Brak ID planu.');
      }
    } catch (error) {
      console.error('Błąd podczas aktywacji planu dietetycznego:', error);
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
            Twoje Plany Dietetyczne
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
                color: '#FF7043',
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
                Nie masz jeszcze żadnych planów dietetycznych
              </Typography>
              <Typography variant="body1" gutterBottom>
                Stwórz swój pierwszy plan dietetyczny, aby zacząć.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreatePlan}
                sx={{
                  mt: 2,
                  backgroundColor: '#FF7043',
                  '&:hover': {
                    backgroundColor: '#E64A19',
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
                      borderLeft: plan.isActive ? '5px solid #FF7043' : 'none',
                      boxShadow: plan.isActive
                        ? '0 0 20px rgba(255,112,67,0.5)'
                        : '0 4px 8px rgba(0, 0, 0, 0.1)',
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
                          backgroundColor: '#FF7043',
                          color: 'white',
                          fontWeight: 'bold',
                          zIndex: 1,
                        }}
                      />
                    )}
                    <CardContent sx={{ flexGrow: 1, pt: plan.isActive ? 4 : 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <RestaurantMenuIcon
                          sx={{ fontSize: 30, color: '#FF7043', mr: 1, flexShrink: 0 }}
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
                        Dni dietetyczne: {plan.days?.length || 0}
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
                            color: '#FF7043',
                            borderColor: '#FF7043',
                            '&:hover': {
                              borderColor: '#E64A19',
                              backgroundColor: 'rgba(255,112,67,0.1)',
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

      {/* Diet Plan Form Dialog */}
      <Dialog
        open={openForm}
        onClose={() => handleFormClose()}
        fullWidth
        maxWidth="md"
        disableEscapeKeyDown={false}
      >
        <DialogTitle>
          {selectedPlan ? 'Edytuj Plan Dietetyczny' : 'Dodaj Nowy Plan Dietetyczny'}
        </DialogTitle>
        <DialogContent dividers>
          <DietPlanForm plan={selectedPlan} onClose={handleFormClose} />
        </DialogContent>
      </Dialog>

      {/* Diet Plan Details Dialog */}
      <Dialog
        open={openDetails}
        onClose={handleDetailsClose}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Szczegóły Planu Dietetycznego</DialogTitle>
        <DialogContent dividers>
          {selectedPlan && <DietPlanDetails plan={selectedPlan} />}
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

export default DietPlansPage;