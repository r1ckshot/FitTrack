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
  CardContent
} from '@mui/material';
import { motion } from 'framer-motion';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import ExerciseSelection from './ExerciseSelection';

const TrainingDayForm = ({ day, onUpdate, onRemove }) => {
  const [dayData, setDayData] = useState({
    dayOfWeek: day.dayOfWeek || '',
    name: day.name || '',
    order: day.order || 1,
    exercises: day.exercises || []
  });

  const [openExerciseDialog, setOpenExerciseDialog] = useState(false);
  const [editExerciseIndex, setEditExerciseIndex] = useState(null);
  const [exerciseDialogMode, setExerciseDialogMode] = useState('add'); // 'add' or 'edit'
  const [currentExercise, setCurrentExercise] = useState(null);

  // Days of week options
  const daysOfWeek = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    const updatedDayData = {
      ...dayData,
      [name]: value
    };

    // If day of week is changed, update the name only if it hasn't been manually edited
    if (name === 'dayOfWeek' && (dayData.name === '' || dayData.name === `${dayData.dayOfWeek} - Trening`)) {
      updatedDayData.name = `${value} - Trening`;
    }

    setDayData(updatedDayData);
    onUpdate(updatedDayData);
  };

  // Open dialog to add new exercise
  const handleAddExercise = () => {
    setExerciseDialogMode('add');
    setEditExerciseIndex(null);
    setOpenExerciseDialog(true);
  };

  // Open dialog to edit exercise
  const handleEditExercise = (index) => {
    setExerciseDialogMode('edit');
    setEditExerciseIndex(index);
    setCurrentExercise(dayData.exercises[index]); // Zapisz dane ćwiczenia
    setOpenExerciseDialog(true);
  };

  // Handle exercise selection/update
  const handleExerciseSelect = (exercise) => {
    let updatedExercises;

    if (exerciseDialogMode === 'add') {
      // Add new exercise with default sets and reps
      const newExercise = {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sets: 3,
        reps: 12,
        weight: 0,
        restTime: 60, // Dodajemy domyślny czas odpoczynku zamiast notatek
        order: dayData.exercises.length + 1,
        gifUrl: exercise.gifUrl,
        // Zapisujemy wszystkie informacje o ćwiczeniu
        bodyPart: exercise.bodyPart,
        equipment: exercise.equipment,
        target: exercise.target
      };
      updatedExercises = [...dayData.exercises, newExercise];
    } else {
      // Update existing exercise preserving sets, reps, etc.
      updatedExercises = [...dayData.exercises];
      const existingExercise = updatedExercises[editExerciseIndex];
      updatedExercises[editExerciseIndex] = {
        ...existingExercise,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        gifUrl: exercise.gifUrl,
        order: existingExercise.order,
        // Aktualizujemy również dane o ćwiczeniu
        bodyPart: exercise.bodyPart,
        equipment: exercise.equipment,
        target: exercise.target
      };
    }

    const updatedDay = { ...dayData, exercises: updatedExercises };
    setDayData(updatedDay);
    onUpdate(updatedDay);
    setOpenExerciseDialog(false);
  };

  // Update exercise details (sets, reps, weight, restTime)
  const handleExerciseDetailChange = (index, field, value) => {
    const updatedExercises = [...dayData.exercises];
    // Zmieniamy obsługę pola na restTime
    updatedExercises[index] = {
      ...updatedExercises[index],
      [field]: parseInt(value) || 0
    };

    const updatedDay = { ...dayData, exercises: updatedExercises };
    setDayData(updatedDay);
    onUpdate(updatedDay);
  };

  // Remove exercise
  const handleRemoveExercise = (index) => {
    const updatedExercises = dayData.exercises
      .filter((_, i) => i !== index)
      .map((exercise, idx) => ({
        ...exercise,
        order: idx + 1
      }));
    const updatedDay = { ...dayData, exercises: updatedExercises };
    setDayData(updatedDay);
    onUpdate(updatedDay);
  };

  const handleDialogClose = () => {
    setOpenExerciseDialog(false);
    setCurrentExercise(null); // Resetuj dane edytowanego ćwiczenia
  };

  // Move exercise up or down
  const handleMoveExercise = (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === dayData.exercises.length - 1)
    ) {
      return;
    }
  
    const updatedExercises = [...dayData.exercises];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
  
    // Zamiana miejscami
    [updatedExercises[index], updatedExercises[newIndex]] = 
      [updatedExercises[newIndex], updatedExercises[index]];
  
    // Aktualizacja order dla wszystkich ćwiczeń
    const reorderedExercises = updatedExercises.map((ex, idx) => ({
      ...ex,
      order: idx + 1
    }));
  
    const updatedDay = { ...dayData, exercises: reorderedExercises };
    setDayData(updatedDay);
    onUpdate(updatedDay);
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
                <MenuItem key={day} value={day}>{day}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            id="name"
            name="name"
            label="Nazwa treningu"
            value={dayData.name}
            onChange={handleChange}
          />
        </Box>

        <IconButton
          color="error"
          onClick={onRemove}
          sx={{ ml: 2 }}
        >
          <DeleteIcon />
        </IconButton>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Ćwiczenia</Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddExercise}
          sx={{
            color: '#4CAF50',
            borderColor: '#4CAF50',
            '&:hover': {
              borderColor: '#3b8a3e',
              backgroundColor: 'rgba(76,175,80,0.1)'
            }
          }}
        >
          Dodaj ćwiczenie
        </Button>
      </Box>

      {dayData.exercises.length === 0 ? (
        <Card sx={{ backgroundColor: '#f9f9f9', mb: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <FitnessCenterIcon sx={{ fontSize: 40, color: '#ccc', mb: 2 }} />
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Brak ćwiczeń w tym dniu treningowym
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddExercise}
              sx={{
                mt: 1,
                backgroundColor: '#4CAF50',
                '&:hover': {
                  backgroundColor: '#3b8a3e',
                }
              }}
            >
              Dodaj pierwsze ćwiczenie
            </Button>
          </CardContent>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <List>
            {dayData.exercises.map((exercise, index) => (
              <ListItem
                key={exercise.id || index}
                component={motion.div}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                sx={{
                  mb: 2,
                  backgroundColor: 'white',
                  borderRadius: 1,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  position: 'relative', // Dodajemy dla lepszego pozycjonowania przycisków
                  pr: 15 // Dodajemy padding po prawej stronie dla przycisków
                }}
              >
                <Box sx={{ display: 'flex', width: '100%', flexDirection: { xs: 'column', md: 'row' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '250px', mr: 2 }}>
                    {exercise.gifUrl && (
                      <Box component="img" src={exercise.gifUrl} alt={exercise.exerciseName} sx={{ width: 60, height: 60, mr: 2, objectFit: 'cover' }} />
                    )}
                    <ListItemText
                      primary={exercise.exerciseName || 'Ćwiczenie'}
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            {exercise.bodyPart || ''}
                          </Typography>
                          {exercise.equipment && (
                            <Typography variant="body2" component="span">
                              {' | ' + exercise.equipment}
                            </Typography>
                          )}
                          {exercise.target && (
                            <Typography variant="body2" component="span">
                              {' | ' + exercise.target}
                            </Typography>
                          )}
                        </>
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
                    <TextField
                      label="Serie"
                      type="number"
                      variant="outlined"
                      size="small"
                      value={exercise.sets}
                      onChange={(e) => handleExerciseDetailChange(index, 'sets', e.target.value)}
                      InputProps={{ inputProps: { min: 1 } }}
                      sx={{ width: '80px' }}
                    />
                    <TextField
                      label="Powtórzenia"
                      type="number"
                      variant="outlined"
                      size="small"
                      value={exercise.reps}
                      onChange={(e) => handleExerciseDetailChange(index, 'reps', e.target.value)}
                      InputProps={{ inputProps: { min: 1 } }}
                      sx={{ width: '110px' }}
                    />
                    <TextField
                      label="Ciężar (kg)"
                      type="number"
                      variant="outlined"
                      size="small"
                      value={exercise.weight}
                      onChange={(e) => handleExerciseDetailChange(index, 'weight', e.target.value)}
                      InputProps={{ inputProps: { min: 0 } }}
                      sx={{ width: '110px' }}
                    />
                    <TextField
                      label="Odpoczynek (s)"
                      type="number"
                      variant="outlined"
                      size="small"
                      value={exercise.restTime || 60}
                      onChange={(e) => handleExerciseDetailChange(index, 'restTime', e.target.value)}
                      InputProps={{ inputProps: { min: 0 } }}
                      sx={{ width: '110px' }}
                    />
                  </Box>
                </Box>

                <ListItemSecondaryAction sx={{
                  display: 'flex',
                  height: '100%',
                  alignItems: 'center',
                  right: 8 // Poprawione pozycjonowanie
                }}>
                  <IconButton
                    edge="end"
                    onClick={() => handleMoveExercise(index, 'up')}
                    disabled={index === 0}
                    sx={{ opacity: index === 0 ? 0.3 : 1 }}
                  >
                    <SwapVertIcon sx={{ transform: 'rotate(180deg)' }} />
                  </IconButton>
                  <IconButton
                    edge="end"
                    onClick={() => handleMoveExercise(index, 'down')}
                    disabled={index === dayData.exercises.length - 1}
                    sx={{ opacity: index === dayData.exercises.length - 1 ? 0.3 : 1 }}
                  >
                    <SwapVertIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleEditExercise(index)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleRemoveExercise(index)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </motion.div>
      )}

      {/* Exercise Selection Dialog */}
      <Dialog
        open={openExerciseDialog}
        onCancel={handleDialogClose}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {exerciseDialogMode === 'add' ? 'Dodaj ćwiczenie' : 'Edytuj ćwiczenie'}
        </DialogTitle>
        <DialogContent dividers>
          <ExerciseSelection
            onExerciseSelect={handleExerciseSelect}
            onCancel={handleDialogClose}
            currentExercise={exerciseDialogMode === 'edit' ? currentExercise : null}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExerciseDialog(false)}>Anuluj</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrainingDayForm;