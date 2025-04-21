import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import { motion } from 'framer-motion';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import MealSelection from './MealSelection';

const DietDayForm = ({ day, onUpdate, onRemove }) => {
  const [dayData, setDayData] = useState({
    dayOfWeek: day.dayOfWeek || '',
    name: day.name || '',
    order: day.order || 1,
    meals: day.meals || [],
  });

  const [openMealDialog, setOpenMealDialog] = useState(false);
  const [editMealIndex, setEditMealIndex] = useState(null);
  const [mealDialogMode, setMealDialogMode] = useState('add'); // 'add' or 'edit'
  const [currentMeal, setCurrentMeal] = useState(null);

  // Days of week options
  const daysOfWeek = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    const updatedDayData = {
      ...dayData,
      [name]: value,
    };

    // If day of week is changed, update the name only if it hasn't been manually edited
    if (name === 'dayOfWeek' && (dayData.name === '' || dayData.name === `${dayData.dayOfWeek} - Dieta`)) {
      updatedDayData.name = `${value} - Dieta`;
    }

    setDayData(updatedDayData);
    onUpdate(updatedDayData);
  };

  // Open dialog to add new meal
  const handleAddMeal = () => {
    setMealDialogMode('add');
    setEditMealIndex(null);
    setOpenMealDialog(true);
  };

  // Open dialog to edit meal
  const handleEditMeal = (index) => {
    setMealDialogMode('edit');
    setEditMealIndex(index);
    setCurrentMeal(dayData.meals[index]);
    setOpenMealDialog(true);
  };

  // Handle meal selection/update
  const handleMealSelect = (meal) => {
    let updatedMeals;

    if (mealDialogMode === 'add') {
      const newMeal = {
        recipeId: meal.id,
        title: meal.title,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        image: meal.image,
        order: dayData.meals.length + 1,
      };
      updatedMeals = [...dayData.meals, newMeal];
    } else {
      updatedMeals = [...dayData.meals];
      updatedMeals[editMealIndex] = {
        ...updatedMeals[editMealIndex],
        recipeId: meal.id,
        title: meal.title,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        image: meal.image,
      };
    }

    const updatedDay = { ...dayData, meals: updatedMeals };
    setDayData(updatedDay);
    onUpdate(updatedDay);
    setOpenMealDialog(false);
  };

  // Remove meal
  const handleRemoveMeal = (index) => {
    const updatedMeals = dayData.meals.filter((_, i) => i !== index);
    const updatedDay = { ...dayData, meals: updatedMeals };
    setDayData(updatedDay);
    onUpdate(updatedDay);
  };

  // Close dialog
  const handleDialogClose = () => {
    setOpenMealDialog(false);
    setCurrentMeal(null);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, width: '100%' }}>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="day-of-week-label">Dzień tygodnia</InputLabel>
            <Select
              labelId="day-of-week-label"
              id="dayOfWeek"
              name="dayOfWeek"
              value={dayData.dayOfWeek}
              label="Dzień tygodnia"
              onChange={handleChange}
            >
              {daysOfWeek.map((day) => (
                <MenuItem key={day} value={day}>
                  {day}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            id="name"
            name="name"
            label="Nazwa dnia"
            value={dayData.name}
            onChange={handleChange}
          />
        </Box>

        <IconButton color="error" onClick={onRemove} sx={{ ml: 2 }}>
          <DeleteIcon />
        </IconButton>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Posiłki</Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddMeal}
          sx={{
            color: '#FF7043',
            borderColor: '#FF7043',
            '&:hover': {
              borderColor: '#E64A19',
              backgroundColor: 'rgba(255,112,67,0.1)',
            },
          }}
        >
          Dodaj posiłek
        </Button>
      </Box>

      {dayData.meals.length === 0 ? (
        <Card sx={{ backgroundColor: '#f9f9f9', mb: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <RestaurantMenuIcon sx={{ fontSize: 40, color: '#ccc', mb: 2 }} />
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Brak posiłków w tym dniu dietetycznym
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddMeal}
              sx={{
                mt: 1,
                backgroundColor: '#FF7043',
                '&:hover': {
                  backgroundColor: '#E64A19',
                },
              }}
            >
              Dodaj pierwszy posiłek
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <List>
            {dayData.meals.map((meal, index) => (
              <ListItem
                key={meal.recipeId || index}
                component={motion.div}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                sx={{
                  mb: 2,
                  backgroundColor: 'white',
                  borderRadius: 1,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  position: 'relative',
                  pr: 15,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  {meal.image && (
                    <Box
                      component="img"
                      src={meal.image}
                      alt={meal.title}
                      sx={{ width: 60, height: 60, mr: 2, objectFit: 'cover' }}
                    />
                  )}
                  <ListItemText
                    primary={meal.title || 'Posiłek'}
                    secondary={
                      <>
                        <Typography variant="body2">
                          Kalorie: {meal.calories} kcal
                        </Typography>
                        <Typography variant="body2">
                          Białko: {meal.protein}, Węglowodany: {meal.carbs}, Tłuszcze: {meal.fat}
                        </Typography>
                      </>
                    }
                  />
                </Box>
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => handleEditMeal(index)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleRemoveMeal(index)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </motion.div>
      )}

      {/* Meal Selection Dialog */}
      <Dialog open={openMealDialog} onClose={handleDialogClose} fullWidth maxWidth="md">
        <DialogTitle>
          {mealDialogMode === 'add' ? 'Dodaj posiłek' : 'Edytuj posiłek'}
        </DialogTitle>
        <DialogContent dividers>
          <MealSelection
            onMealSelect={handleMealSelect}
            onCancel={handleDialogClose}
            currentMeal={mealDialogMode === 'edit' ? currentMeal : null}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>Anuluj</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DietDayForm;