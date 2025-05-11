import { useState, useEffect } from 'react';
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
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import {
  getAllExercises,
  getBodyParts,
  getEquipmentList,
  getTargetList
} from '../../services/exerciseService';

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

  // Custom exercise dialog state
  const [customExerciseDialogOpen, setCustomExerciseDialogOpen] = useState(false);
  const [customExercise, setCustomExercise] = useState({
    id: '',
    name: '',
    bodyPart: '',
    target: '',
    equipment: '',
    gifUrl: '',
    isCustom: true
  });
  const [formErrors, setFormErrors] = useState({});

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
      // Sprawdź, czy to własne ćwiczenie na podstawie flagi isCustom lub exerciseId
      if (currentExercise.isCustom || currentExercise.exerciseId?.startsWith('custom-')) {
        // Jeśli to własne ćwiczenie, otwórz dialog edycji
        setCustomExercise({
          id: currentExercise.exerciseId,
          name: currentExercise.exerciseName,
          bodyPart: currentExercise.bodyPart || '',
          target: currentExercise.target || '',
          equipment: currentExercise.equipment || '',
          gifUrl: currentExercise.gifUrl || '',
          isCustom: true
        });
        // Dodaj setTimeout, aby zapewnić poprawne renderowanie dialogu
        setTimeout(() => {
          setCustomExerciseDialogOpen(true);
        }, 100);
      } else {
        // Standardowa logika dla predefiniowanych ćwiczeń
        setSelectedBodyPart(currentExercise.bodyPart);
        setSelectedEquipment(currentExercise.equipment);
        setSelectedTarget(currentExercise.target);
        setStep(4);
      }
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

  // Open custom exercise dialog
  const handleOpenCustomExerciseDialog = () => {
    setCustomExercise({
      id: `custom-${Date.now()}`,
      name: '',
      bodyPart: '',
      target: '',
      equipment: '',
      gifUrl: '',
      isCustom: true
    });
    setFormErrors({});
    setCustomExerciseDialogOpen(true);
  };

  // Handle changes in custom exercise form
  const handleCustomExerciseChange = (e) => {
    const { name, value } = e.target;
    setCustomExercise(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate and save custom exercise
  const handleSaveCustomExercise = () => {
    // Validate required fields
    const errors = {};
    if (!customExercise.name.trim()) errors.name = 'Nazwa jest wymagana';
    if (!customExercise.bodyPart) errors.bodyPart = 'Partia ciała jest wymagana';
    if (!customExercise.target) errors.target = 'Cel treningowy jest wymagany';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Create exercise object in the format expected by onExerciseSelect
    const exercise = {
      id: customExercise.id,
      name: customExercise.name,
      bodyPart: customExercise.bodyPart,
      target: customExercise.target,
      equipment: customExercise.equipment || 'brak sprzętu',
      gifUrl: customExercise.gifUrl || '',
      isCustom: true
    };

    onExerciseSelect(exercise);
    setCustomExerciseDialogOpen(false);
  };

  // Loading indicator
  if (loading && step === 1) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress sx={{ color: '#42A5F5' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <Typography variant="h6" align="center" gutterBottom component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        Wybierz ćwiczenie
      </Typography>

      {/* Custom Exercise Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<AddCircleOutlineIcon />}
          onClick={handleOpenCustomExerciseDialog}
          sx={{
            color: '#42A5F5',
            borderColor: '#42A5F5',
            '&:hover': {
              borderColor: '#0b7dda',
              backgroundColor: 'rgba(76,175,80,0.1)'
            }
          }}
        >
          Dodaj własne ćwiczenie
        </Button>
      </Box>

      {/* Current selections display */}
      {(selectedBodyPart || selectedEquipment || selectedTarget) && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {selectedBodyPart && (
            <Chip
              label={`Partia ciała: ${selectedBodyPart}`}
              onDelete={resetFilters}
              sx={{ backgroundColor: 'rgba(76,92, 175,0.5)', color: '#333' }}
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
              sx={{ backgroundColor: 'rgba(76, 92, 175, 0.5)', color: '#333' }}
            />
          )}
          {selectedTarget && (
            <Chip
              label={`Cel: ${selectedTarget}`}
              onDelete={() => {
                setSelectedTarget('');
                setStep(3);
              }}
              sx={{ backgroundColor: 'rgba(76,92, 175,0.5)', color: '#333' }}
            />
          )}
        </Box>
      )}

      {/* Back button for steps 2-4 */}
      {step > 1 && (
        <IconButton
          onClick={goBack}
          sx={{ backgroundColor: 'rgba(76,92, 175,0.3)', color: '#42A5F5', mb: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
      )}

      {/* Loading indicator for subsequent steps */}
      {loading && step > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress sx={{ color: '#42A5F5' }} />
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
                    backgroundColor: 'rgba(76,92, 175,0.8)',
                    color: 'white',
                    width: '100%',
                    '&:hover': { backgroundColor: 'rgba(76,92, 175,0.9)' }
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
                      backgroundColor: 'rgba(76,92, 175,0.8)',
                      color: 'white',
                      width: '100%',
                      '&:hover': { backgroundColor: 'rgba(76,92, 175,0.9)' }
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
                sx={{ color: '#42A5F5', borderColor: '#42A5F5' }}
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
                      backgroundColor: 'rgba(76, 92, 175, 0.8)',
                      color: 'white',
                      width: '100%',
                      '&:hover': { backgroundColor: 'rgba(76,92,175,0.9)' }
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
                sx={{ color: '#42A5F5', borderColor: '#42A5F5' }}
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
                sx={{ mt: 2, backgroundColor: '#42A5F5' }}
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
                            backgroundColor: '#42A5F5',
                            color: 'white',
                            '&:hover': { backgroundColor: '#0b7dda' }
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

      {/* Custom Exercise Dialog */}
      <Dialog open={customExerciseDialogOpen} onClose={() => setCustomExerciseDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          {currentExercise && currentExercise.isCustom ? 'Edytuj własne ćwiczenie' : 'Dodaj własne ćwiczenie'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Nazwa ćwiczenia"
              name="name"
              value={customExercise.name}
              onChange={handleCustomExerciseChange}
              error={!!formErrors.name}
              helperText={formErrors.name}
              required
            />

            <FormControl fullWidth required error={!!formErrors.bodyPart}>
              <InputLabel id="bodyPart-label">Partia ciała</InputLabel>
              <Select
                labelId="bodyPart-label"
                name="bodyPart"
                value={customExercise.bodyPart}
                label="Partia ciała"
                onChange={handleCustomExerciseChange}
              >
                {bodyParts.map(part => (
                  <MenuItem key={part} value={part}>{part}</MenuItem>
                ))}
              </Select>
              {formErrors.bodyPart && <FormHelperText>{formErrors.bodyPart}</FormHelperText>}
            </FormControl>

            <FormControl fullWidth required error={!!formErrors.target}>
              <InputLabel id="target-label">Cel treningowy</InputLabel>
              <Select
                labelId="target-label"
                name="target"
                value={customExercise.target}
                label="Cel treningowy"
                onChange={handleCustomExerciseChange}
              >
                {targets.filter(target => !customExercise.bodyPart ||
                  allExercises.some(ex => ex.bodyPart === customExercise.bodyPart && ex.target === target))
                  .map(target => (
                    <MenuItem key={target} value={target}>{target}</MenuItem>
                  ))}
              </Select>
              {formErrors.target && <FormHelperText>{formErrors.target}</FormHelperText>}
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="equipment-label">Sprzęt (opcjonalnie)</InputLabel>
              <Select
                labelId="equipment-label"
                name="equipment"
                value={customExercise.equipment}
                label="Sprzęt (opcjonalnie)"
                onChange={handleCustomExerciseChange}
              >
                <MenuItem value="">Brak sprzętu</MenuItem>
                {equipment.map(item => (
                  <MenuItem key={item} value={item}>{item}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="URL do animacji (opcjonalnie)"
              name="gifUrl"
              value={customExercise.gifUrl}
              onChange={handleCustomExerciseChange}
              placeholder="np. https://link-do-animacji.gif"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCustomExerciseDialogOpen(false)}
            color="inherit"
          >
            Anuluj
          </Button>
          <Button
            onClick={handleSaveCustomExercise}
            variant="contained"
            sx={{ backgroundColor: '#42A5F5', '&:hover': { backgroundColor: '#0b7dda' } }}
          >
            Zapisz
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExerciseSelection;