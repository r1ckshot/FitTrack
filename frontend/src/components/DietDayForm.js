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
import SwapVertIcon from '@mui/icons-material/SwapVert';
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
        recipeUrl: meal.recipeUrl,
        order: dayData.meals.length + 1,
        isCustom: meal.isCustom || false // Dodajemy flagę isCustom
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
        recipeUrl: meal.recipeUrl,
        order: updatedMeals[editMealIndex].order, 
        isCustom: meal.isCustom || false // Dodajemy flagę isCustom
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
    
    // Dodaj aktualizację kolejności posiłków po usunięciu
    const reorderedMeals = updatedMeals.map((meal, idx) => ({
      ...meal,
      order: idx + 1
    }));
    
    const updatedDay = { ...dayData, meals: reorderedMeals };
    setDayData(updatedDay);
    onUpdate(updatedDay);
  };

  // Move meal up or down
  const handleMoveMeal = (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === dayData.meals.length - 1)
    ) {
      return;
    }

    const updatedMeals = [...dayData.meals];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap meals
    [updatedMeals[index], updatedMeals[newIndex]] = 
      [updatedMeals[newIndex], updatedMeals[index]];
    
    // Update order property for all meals
    const reorderedMeals = updatedMeals.map((meal, idx) => ({
      ...meal,
      order: idx + 1
    }));

    const updatedDay = { ...dayData, meals: reorderedMeals };
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
                <Box sx={{ display: 'flex', width: '100%', flexDirection: { xs: 'column', md: 'row' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '250px', mr: 2 }}>
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
                        <Typography variant="body2">
                          Kalorie: {meal.calories} kcal
                        </Typography>
                      }
                    />
                  </Box>

                  <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1,
                    my: { xs: 2, md: 0 },
                    width: '100%'
                  }}>
                    <Typography variant="body2" sx={{ mr: 2 }}>
                      Białko: {meal.protein}g
                    </Typography>
                    <Typography variant="body2" sx={{ mr: 2 }}>
                      Węglowodany: {meal.carbs}g
                    </Typography>
                    <Typography variant="body2">
                      Tłuszcze: {meal.fat}g
                    </Typography>
                  </Box>
                </Box>

                <ListItemSecondaryAction sx={{
                  display: 'flex',
                  height: '100%',
                  alignItems: 'center',
                  right: 8
                }}>
                  <IconButton
                    edge="end"
                    onClick={() => handleMoveMeal(index, 'up')}
                    disabled={index === 0}
                    sx={{ opacity: index === 0 ? 0.3 : 1 }}
                  >
                    <SwapVertIcon sx={{ transform: 'rotate(180deg)' }} />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={() => handleMoveMeal(index, 'down')}
                    disabled={index === dayData.meals.length - 1}
                    sx={{ opacity: index === dayData.meals.length - 1 ? 0.3 : 1 }}
                  >
                    <SwapVertIcon />
                  </IconButton>
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