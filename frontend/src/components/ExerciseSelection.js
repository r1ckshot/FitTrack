import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardMedia, 
  Grid, 
  CircularProgress, 
  Chip, 
  IconButton,
  TextField,
  InputAdornment
} from '@mui/material';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import {
  getBodyParts,
  getEquipmentList,
  getTargetList,
  getExercisesByBodyPart,
  getExercisesByEquipment,
  getExercisesByTarget,
} from '../services/exerciseService';

const ExerciseSelection = ({ onExerciseSelect, onCancel }) => {
  const [step, setStep] = useState(1); // User's current step in the process
  const [bodyParts, setBodyParts] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [targets, setTargets] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredExercises, setFilteredExercises] = useState([]);
  
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

  // Filter exercises when search term changes
  useEffect(() => {
    if (exercises.length > 0) {
      const filtered = exercises.filter(exercise => 
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.bodyPart.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.target.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredExercises(filtered);
    }
  }, [searchTerm, exercises]);

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
      setFilteredExercises(exercisesData);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
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
    setFilteredExercises([]);
    setStep(1);
  };

  // Loading indicator
  if (loading && step === 1) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress sx={{ color: '#4CAF50' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <Typography variant="h6" align="center" gutterBottom component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        Wybierz ćwiczenie
      </Typography>

      {/* Current selections display */}
      {(selectedBodyPart || selectedEquipment || selectedTarget) && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {selectedBodyPart && (
            <Chip 
              label={`Partia ciała: ${selectedBodyPart}`} 
              onDelete={resetFilters}
              sx={{ backgroundColor: 'rgba(76,175,80,0.2)', color: '#333' }}
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
              sx={{ backgroundColor: 'rgba(76,175,80,0.2)', color: '#333' }}
            />
          )}
          {selectedTarget && (
            <Chip 
              label={`Cel: ${selectedTarget}`} 
              onDelete={() => {
                setSelectedTarget('');
                setStep(3);
              }}
              sx={{ backgroundColor: 'rgba(76,175,80,0.2)', color: '#333' }}
            />
          )}
        </Box>
      )}

      {/* Back button for steps 2-4 */}
      {step > 1 && (
        <IconButton 
          onClick={goBack} 
          sx={{ backgroundColor: 'rgba(76,175,80,0.1)', color: '#4CAF50', mb: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
      )}

      {/* Loading indicator for subsequent steps */}
      {loading && step > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress sx={{ color: '#4CAF50' }} />
        </Box>
      )}

      {/* Step 1: Body Part Selection */}
      {!loading && step === 1 && (
        <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Typography variant="body1" gutterBottom>
            Wybierz partię ciała:
          </Typography>
          <Grid container spacing={2}>
            {bodyParts.map((part) => (
              <Grid item xs={6} md={4} key={part}>
                <Button
                  variant="contained"
                  sx={{ 
                    backgroundColor: 'rgba(76,175,80,0.8)', 
                    color: 'white', 
                    width: '100%',
                    '&:hover': { backgroundColor: 'rgba(76,175,80,0.9)' }
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
          <Typography variant="body1" gutterBottom>
            Wybierz sprzęt:
          </Typography>
          <Grid container spacing={2}>
            {equipment.map((item) => (
              <Grid item xs={6} md={4} key={item}>
                <Button
                  variant="contained"
                  sx={{ 
                    backgroundColor: 'rgba(76,175,80,0.8)', 
                    color: 'white', 
                    width: '100%',
                    '&:hover': { backgroundColor: 'rgba(76,175,80,0.9)' }
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
                sx={{ color: '#4CAF50', borderColor: '#4CAF50' }}
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
          <Typography variant="body1" gutterBottom>
            Wybierz cel treningowy:
          </Typography>
          <Grid container spacing={2}>
            {targets.map((target) => (
              <Grid item xs={6} md={4} key={target}>
                <Button
                  variant="contained"
                  sx={{ 
                    backgroundColor: 'rgba(76,175,80,0.8)', 
                    color: 'white', 
                    width: '100%',
                    '&:hover': { backgroundColor: 'rgba(76,175,80,0.9)' }
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
                sx={{ color: '#4CAF50', borderColor: '#4CAF50' }}
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body1">
              Wyniki wyszukiwania: {filteredExercises.length} ćwiczeń
            </Typography>
            <TextField
              placeholder="Szukaj ćwiczeń..."
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ width: { xs: '100%', sm: '300px' } }}
            />
          </Box>
          
          {filteredExercises.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 2 }}>
              <Typography>
                Nie znaleziono ćwiczeń dla wybranych filtrów. Spróbuj zmienić kryteria wyszukiwania.
              </Typography>
              <Button 
                variant="contained" 
                sx={{ mt: 2, backgroundColor: '#4CAF50' }}
                onClick={resetFilters}
              >
                Resetuj filtry
              </Button>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {filteredExercises.map((exercise) => (
                <Grid item xs={12} sm={6} md={4} key={exercise.id}>
                  <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => onExerciseSelect(exercise)}>
                      <CardMedia component="img" height="160" image={exercise.gifUrl} alt={exercise.name} />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6">{exercise.name}</Typography>
                        <Typography variant="body2">Partia ciała: {exercise.bodyPart}</Typography>
                        <Typography variant="body2">Sprzęt: {exercise.equipment}</Typography>
                        <Typography variant="body2">Cel: {exercise.target}</Typography>
                        <Button
                          variant="contained"
                          sx={{ 
                            marginTop: '10px', 
                            backgroundColor: '#4CAF50', 
                            color: 'white',
                            '&:hover': { backgroundColor: '#3b8a3e' }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onExerciseSelect(exercise);
                          }}
                        >
                          Wybierz
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ExerciseSelection;