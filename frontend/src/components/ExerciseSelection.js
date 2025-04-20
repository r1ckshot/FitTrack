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
  getAllExercises,
  getBodyParts,
  getEquipmentList,
  getTargetList
} from '../services/exerciseService';

const ExerciseSelection = ({ onExerciseSelect, onCancel, currentExercise }) => {
  const [step, setStep] = useState(1); // User's current step in the process
  const [allExercises, setAllExercises] = useState([]); // Store all exercises
  const [bodyParts, setBodyParts] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [targets, setTargets] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Selection states
  const [selectedBodyPart, setSelectedBodyPart] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedTarget, setSelectedTarget] = useState('');

  // Fetch all data initially in one request
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all exercises in one request
        const exercisesData = await getAllExercises();
        setAllExercises(exercisesData);

        // Extract unique values for filters
        const bodyPartsData = await getBodyParts();
        setBodyParts(bodyPartsData);

        const equipmentData = await getEquipmentList();
        setEquipment(equipmentData);

        const targetsData = await getTargetList();
        setTargets(targetsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Ustawienie filtrów na podstawie edytowanego ćwiczenia
  useEffect(() => {
    if (!loading && currentExercise) {
      setSelectedBodyPart(currentExercise.bodyPart);
      setSelectedEquipment(currentExercise.equipment);
      setSelectedTarget(currentExercise.target);
      setStep(4);
    }
  }, [loading, currentExercise]);

  // Apply filters when selections or search terms change
  useEffect(() => {
    if (allExercises.length > 0 && (step === 4 || searchTerm)) {
      applyFilters();
    }
  }, [searchTerm, step, selectedBodyPart, selectedEquipment, selectedTarget]);

  // Function to apply all current filters to the exercises
  const applyFilters = () => {
    let results = [...allExercises];

    // Apply bodyPart filter if selected
    if (selectedBodyPart) {
      results = results.filter(ex => ex.bodyPart === selectedBodyPart);
    }

    // Apply equipment filter if selected
    if (selectedEquipment) {
      results = results.filter(ex => ex.equipment === selectedEquipment);
    }

    // Apply target filter if selected
    if (selectedTarget) {
      results = results.filter(ex => ex.target === selectedTarget);
    }

    // Apply search term filter
    if (searchTerm) {
      results = results.filter(ex =>
        ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.bodyPart.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.equipment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ex.target.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExercises(results);
  };

  // Function to handle body part selection
  const handleBodyPartSelect = (bodyPart) => {
    setSelectedBodyPart(bodyPart);
    setStep(2);
  };

  // Function to handle equipment selection
  const handleEquipmentSelect = (equipment) => {
    setSelectedEquipment(equipment);
    setStep(3);
  };

  // Function to handle target selection
  const handleTargetSelect = (target) => {
    setSelectedTarget(target);
    setStep(4);
  };

  // Function to skip equipment selection
  const skipEquipment = () => {
    setSelectedEquipment('');
    setStep(3);
  };

  // Function to skip target selection
  const skipTarget = () => {
    setSelectedTarget('');
    setStep(4);
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
            {/* Filter equipment options based on selected body part */}
            {equipment
              .filter(item => {
                // Only show equipment that has exercises for the selected body part
                return allExercises.some(ex =>
                  ex.bodyPart === selectedBodyPart && ex.equipment === item
                );
              })
              .map((item) => (
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
              ))
            }
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
            {/* Filter target options based on selected body part and equipment */}
            {targets
              .filter(target => {
                // Only show targets that have exercises for the selected filters
                return allExercises.some(ex =>
                  ex.bodyPart === selectedBodyPart &&
                  (selectedEquipment ? ex.equipment === selectedEquipment : true) &&
                  ex.target === target
                );
              })
              .map((target) => (
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
              ))
            }
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
                      <Box sx={{
                        height: '160px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#f5f5f5',
                        overflow: 'hidden'
                      }}>
                        <CardMedia
                          component="img"
                          image={exercise.gifUrl}
                          alt={exercise.name}
                          sx={{
                            maxHeight: '90%',
                            maxWidth: '90%',
                            objectFit: 'contain',
                            transition: 'transform 0.3s',
                            '&:hover': {
                              transform: 'scale(1.05)'
                            }
                          }}
                        />
                      </Box>
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