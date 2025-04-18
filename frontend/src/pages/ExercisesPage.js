import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CardContent, CardMedia, Grid, CircularProgress, Chip, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  getBodyParts,
  getEquipmentList,
  getTargetList,
  getExercisesByBodyPart,
  getExercisesByEquipment,
  getExercisesByTarget,
} from '../services/exerciseService';
import BackgroundIcons from '../components/BackgroundIcons';
import Navbar from '../components/Navbar'; 

const ExercisesPage = () => {
  const [step, setStep] = useState(1); // User's current step in the process
  const [bodyParts, setBodyParts] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [targets, setTargets] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [workoutPlan, setWorkoutPlan] = useState([]); // Workout plan
  const [loading, setLoading] = useState(false);
  
  // Selection states
  const [selectedBodyPart, setSelectedBodyPart] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('');

  // Fetch initial data: body parts, equipment, and targets
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const bodyPartsData = await getBodyParts();
        setBodyParts(bodyPartsData);
        
        const equipmentData = await getEquipmentList();
        setEquipment(equipmentData);
        
        const targetsData = await getTargetList();
        setTargets(targetsData);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Function to handle body part selection
  const handleBodyPartSelect = async (bodyPart) => {
    setSelectedBodyPart(bodyPart);
    setStep(2);
  };

  // Function to handle equipment selection
  const handleEquipmentSelect = async (equipment) => {
    setSelectedEquipment(equipment);
    setStep(3);
  };

  // Function to handle target selection and fetch exercises
  const handleTargetSelect = async (target) => {
    setSelectedTarget(target);
    await fetchExercises(selectedBodyPart, selectedEquipment, target);
    setStep(4);
  };

  // Function to skip equipment selection
  const skipEquipment = () => {
    setSelectedEquipment('');
    setStep(3);
  };

  // Function to skip target selection and fetch exercises
  const skipTarget = async () => {
    setSelectedTarget('');
    await fetchExercises(selectedBodyPart, selectedEquipment, '');
    setStep(4);
  };

  // Function to fetch exercises based on selections
  const fetchExercises = async (bodyPart, equipment, target) => {
    setLoading(true);
    try {
      let exercisesData = [];
      
      // Prioritize filtering by the most specific criteria
      if (bodyPart && equipment && target) {
        // First get exercises by target (most specific)
        const targetExercises = await getExercisesByTarget(target);
        // Then filter by body part and equipment
        exercisesData = targetExercises.filter(
          ex => ex.bodyPart === bodyPart && ex.equipment === equipment
        );
      } else if (bodyPart && equipment) {
        // Get by equipment and filter by body part
        const equipmentExercises = await getExercisesByEquipment(equipment);
        exercisesData = equipmentExercises.filter(ex => ex.bodyPart === bodyPart);
      } else if (bodyPart && target) {
        // Get by target and filter by body part
        const targetExercises = await getExercisesByTarget(target);
        exercisesData = targetExercises.filter(ex => ex.bodyPart === bodyPart);
      } else if (equipment && target) {
        // Get by target and filter by equipment
        const targetExercises = await getExercisesByTarget(target);
        exercisesData = targetExercises.filter(ex => ex.equipment === equipment);
      } else if (bodyPart) {
        // Get by body part only
        exercisesData = await getExercisesByBodyPart(bodyPart);
      } else if (equipment) {
        // Get by equipment only
        exercisesData = await getExercisesByEquipment(equipment);
      } else if (target) {
        // Get by target only
        exercisesData = await getExercisesByTarget(target);
      }
      
      setExercises(exercisesData);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add exercise to workout plan
  const addToWorkoutPlan = (exercise) => {
    // Check if exercise is already in the plan
    if (!workoutPlan.some(item => item.id === exercise.id)) {
      setWorkoutPlan(prev => [...prev, exercise]);
    }
  };

  // Remove exercise from workout plan
  const removeFromWorkoutPlan = (exerciseId) => {
    setWorkoutPlan(prev => prev.filter(exercise => exercise.id !== exerciseId));
  };

  // Go back to previous step
  const goBack = () => {
    if (step === 2) {
      setSelectedBodyPart('');
      setStep(1);
    } else if (step === 3) {
      setSelectedEquipment('');
      setStep(2);
    } else if (step === 4) {
      setSelectedTarget('');
      setStep(3);
    }
  };

  // Reset all selections and go back to step 1
  const resetFilters = () => {
    setSelectedBodyPart('');
    setSelectedEquipment('');
    setSelectedTarget('');
    setExercises([]);
    setStep(1);
  };

  // Loading indicator
  if (loading && step === 1) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'linear-gradient(135deg, #4CAF50, #81C784)' }}>
        <CircularProgress sx={{ color: 'white' }} />
      </Box>
    );
  }

  return (
    
    <Box sx={{ minHeight: '100vh', position: 'relative', background: 'linear-gradient(135deg, #4CAF50, #81C784)', color: 'white' }}>
      <BackgroundIcons />
      <Navbar />
      <Box sx={{ padding: '20px' }}>
        <Typography variant="h4" align="center" gutterBottom component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          Twój Plan Treningowy
        </Typography>

        {/* Current selections display */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {selectedBodyPart && (
            <Chip 
              label={`Partia ciała: ${selectedBodyPart}`} 
              onDelete={resetFilters}
              sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
          )}
          {selectedEquipment && (
            <Chip 
              label={`Sprzęt: ${selectedEquipment}`} 
              onDelete={() => {
                setSelectedEquipment('');
                setSelectedTarget('');
                setStep(2);
              }}
              sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
          )}
          {selectedTarget && (
            <Chip 
              label={`Cel: ${selectedTarget}`} 
              onDelete={() => {
                setSelectedTarget('');
                setStep(3);
              }}
              sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
          )}
        </Box>

        {/* Back button for steps 2-4 */}
        {step > 1 && (
          <IconButton 
            onClick={goBack} 
            sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', mb: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}

        {/* Loading indicator for subsequent steps */}
        {loading && step > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress sx={{ color: 'white' }} />
          </Box>
        )}

        {/* Step 1: Body Part Selection */}
        {!loading && step === 1 && (
          <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Typography variant="h6" gutterBottom>
              Wybierz partię ciała:
            </Typography>
            <Grid container spacing={2}>
              {bodyParts.map((part) => (
                <Grid item xs={6} md={4} key={part}>
                  <Button
                    variant="contained"
                    sx={{ 
                      backgroundColor: 'rgba(0,100,0,0.7)', 
                      color: 'white', 
                      width: '100%',
                      '&:hover': { backgroundColor: 'rgba(0,130,0,0.9)' }
                    }}
                    onClick={() => handleBodyPartSelect(part)}
                  >
                    {part}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Step 2: Equipment Selection */}
        {!loading && step === 2 && (
          <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Typography variant="h6" gutterBottom>
              Wybierz sprzęt:
            </Typography>
            <Grid container spacing={2}>
              {equipment.map((item) => (
                <Grid item xs={6} md={4} key={item}>
                  <Button
                    variant="contained"
                    sx={{ 
                      backgroundColor: 'rgba(0,100,0,0.7)', 
                      color: 'white', 
                      width: '100%',
                      '&:hover': { backgroundColor: 'rgba(0,130,0,0.9)' }
                    }}
                    onClick={() => handleEquipmentSelect(item)}
                  >
                    {item}
                  </Button>
                </Grid>
              ))}
              <Grid item xs={12}>
                <Button 
                  variant="outlined" 
                  sx={{ color: 'white', borderColor: 'white' }}
                  onClick={skipEquipment}
                >
                  Pomiń wybór sprzętu
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Step 3: Target Selection */}
        {!loading && step === 3 && (
          <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Typography variant="h6" gutterBottom>
              Wybierz cel treningowy:
            </Typography>
            <Grid container spacing={2}>
              {targets.map((target) => (
                <Grid item xs={6} md={4} key={target}>
                  <Button
                    variant="contained"
                    sx={{ 
                      backgroundColor: 'rgba(0,100,0,0.7)', 
                      color: 'white', 
                      width: '100%',
                      '&:hover': { backgroundColor: 'rgba(0,130,0,0.9)' }
                    }}
                    onClick={() => handleTargetSelect(target)}
                  >
                    {target}
                  </Button>
                </Grid>
              ))}
              <Grid item xs={12}>
                <Button 
                  variant="outlined" 
                  sx={{ color: 'white', borderColor: 'white' }}
                  onClick={skipTarget}
                >
                  Pomiń wybór celu
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Step 4: Display Exercises */}
        {!loading && step === 4 && (
          <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Typography variant="h6" gutterBottom>
              Wyniki wyszukiwania: {exercises.length} ćwiczeń
            </Typography>
            
            {exercises.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                <Typography>
                  Nie znaleziono ćwiczeń dla wybranych filtrów. Spróbuj zmienić kryteria wyszukiwania.
                </Typography>
                <Button 
                  variant="contained" 
                  sx={{ mt: 2, backgroundColor: 'rgba(0,100,0,0.7)' }}
                  onClick={resetFilters}
                >
                  Resetuj filtry
                </Button>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {exercises.map((exercise) => (
                  <Grid item xs={12} md={6} lg={4} key={exercise.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardMedia component="img" height="200" image={exercise.gifUrl} alt={exercise.name} />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6">{exercise.name}</Typography>
                        <Typography variant="body2">Partia ciała: {exercise.bodyPart}</Typography>
                        <Typography variant="body2">Sprzęt: {exercise.equipment}</Typography>
                        <Typography variant="body2">Cel: {exercise.target}</Typography>
                        <Button
                          variant="contained"
                          sx={{ 
                            marginTop: '10px', 
                            backgroundColor: workoutPlan.some(item => item.id === exercise.id) ? 'grey' : 'green', 
                            color: 'white',
                            '&:hover': { backgroundColor: workoutPlan.some(item => item.id === exercise.id) ? '#555' : 'darkgreen' }
                          }}
                          onClick={() => addToWorkoutPlan(exercise)}
                          disabled={workoutPlan.some(item => item.id === exercise.id)}
                        >
                          {workoutPlan.some(item => item.id === exercise.id) ? 'Dodano do Planu' : 'Dodaj do Planu'}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* Workout Plan */}
        {workoutPlan.length > 0 && (
          <Box 
            sx={{ 
              marginTop: '30px', 
              padding: '20px', 
              backgroundColor: 'rgba(255,255,255,0.9)', 
              borderRadius: '8px', 
              color: 'black',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
            }}
            component={motion.div}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Typography variant="h5" gutterBottom>Mój Plan Treningowy:</Typography>
            <Grid container spacing={2}>
              {workoutPlan.map((exercise, index) => (
                <Grid item xs={12} key={index}>
                  <Card sx={{ display: 'flex', mb: 1 }}>
                    <CardMedia 
                      component="img" 
                      sx={{ width: 100 }} 
                      image={exercise.gifUrl} 
                      alt={exercise.name} 
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, p: 2 }}>
                      <Typography component="div" variant="h6">
                        {exercise.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {exercise.bodyPart} | {exercise.equipment} | {exercise.target}
                      </Typography>
                    </Box>
                    <Button 
                      sx={{ color: 'red', alignSelf: 'center', mr: 2 }}
                      onClick={() => removeFromWorkoutPlan(exercise.id)}
                    >
                      Usuń
                    </Button>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default ExercisesPage;