import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, CircularProgress, Tabs, Tab, Divider, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import api from '../services/api';
import TrainingDayForm from './TrainingDayForm';
import { useSnackbar } from '../contexts/SnackbarContext'; // Zaimportowany kontekst Snackbar

const TrainingPlanForm = ({ plan, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    days: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [errors, setErrors] = useState({});
  const { showSnackbar } = useSnackbar(); // Użyj kontekstu do wyświetlania komunikatów

  // Load plan data if editing existing plan
  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || '',
        description: plan.description || '',
        days: plan.days || []
      });
    }
  }, [plan]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field if exists
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Nazwa planu jest wymagana';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Sprawdź, czy plan o podanej nazwie już istnieje
  const checkPlanNameExists = async () => {
    try {
      // Pobierz wszystkie plany treningowe
      const response = await api.get('/training-plans');
      const existingPlans = response.data;

      // Przygotuj znormalizowaną nazwę nowego planu (usuń zbędne spacje, przytnij)
      const normalizedNewName = formData.name.toLowerCase().trim().replace(/\s+/g, ' ');

      // Jeśli edytujemy istniejący plan, ignorujemy jego nazwę przy sprawdzaniu
      const planWithSameName = existingPlans.find(existingPlan => {
        // Znormalizuj również nazwę istniejącego planu
        const normalizedExistingName = existingPlan.name.toLowerCase().trim().replace(/\s+/g, ' ');

        // Sprawdź czy znormalizowane nazwy są takie same
        const sameNameCheck = normalizedExistingName === normalizedNewName;

        // Jeśli nie edytujemy planu, każda taka sama nazwa jest duplikatem
        if (!plan) {
          return sameNameCheck;
        }

        // Jeśli edytujemy plan, porównujemy ID z uwzględnieniem obu typów ID (_id dla MongoDB i id dla MySQL)
        const currentPlanId = plan._id || plan.id;
        const existingPlanId = existingPlan._id || existingPlan.id;

        // To jest duplikat tylko jeśli nazwa jest taka sama, ale ID jest inne
        return sameNameCheck && currentPlanId !== existingPlanId;
      });

      return !!planWithSameName; // Zwraca true jeśli znaleziono duplikat
    } catch (error) {
      showSnackbar('Błąd podczas sprawdzania nazwy planu', 'error');
      return false; // W razie błędu pozwalamy kontynuować
    }
  };

  // Przed wysłaniem planu waliduj wszystkie dane
  const validateDaysAndExercises = (days) => {
    for (const day of days) {
      if (!day.dayOfWeek || !day.name || typeof day.order !== "number") {
        return false; // Dzień nie jest kompletny
      }
      if (day.exercises && day.exercises.length > 0) {
        for (const exercise of day.exercises) {
          if (!exercise.exerciseId || !exercise.exerciseName || typeof exercise.sets !== "number" || typeof exercise.reps !== "number") {
            return false; // Ćwiczenie nie jest kompletne
          }
          // Upewnij się, że każde ćwiczenie ma order
          if (typeof exercise.order !== "number") {
            exercise.order = day.exercises.indexOf(exercise) + 1;
          }
        }
      }
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Sprawdź czy nazwa planu jest unikalna
    const nameExists = await checkPlanNameExists();
    if (nameExists) {
      showSnackbar('Plan treningowy o tej nazwie już istnieje', 'error');
      return;
    }

    // Utwórz kopię formData do modyfikacji
    const preparedFormData = JSON.parse(JSON.stringify(formData));

    // Dla każdego dnia, przygotuj ćwiczenia
    preparedFormData.days.forEach(day => {
      if (day.exercises && day.exercises.length > 0) {
        day.exercises = day.exercises.map((exercise, index) => {
          // Dodaj brakujące pola: bodyPart, equipment, target
          return {
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            sets: exercise.sets,
            reps: exercise.reps,
            weight: exercise.weight || 0,
            restTime: exercise.restTime || null,
            order: exercise.order || (index + 1),
            gifUrl: exercise.gifUrl,
            bodyPart: exercise.bodyPart || '', // Dodano
            equipment: exercise.equipment || '', // Dodano
            target: exercise.target || '' // Dodano
          };
        });
      }
    });

    if (!validateDaysAndExercises(preparedFormData.days)) {
      showSnackbar('Niepoprawne dane ćwiczeń. Sprawdź czy wszystkie wymagane pola są wypełnione.', 'error');
      setErrors(prev => ({ ...prev, general: "Niepoprawne dane ćwiczeń. Sprawdź czy wszystkie wymagane pola są wypełnione." }));
      return;
    }

    setSaving(true);
    try {
      // Create proper structure for submission that matches API expectations
      const planData = {
        name: preparedFormData.name,
        description: preparedFormData.description,
        isActive: plan?.isActive || false,
        days: preparedFormData.days.map(day => {
          // Remove temporary IDs that aren't needed by the backend
          const { _tempId, ...dayData } = day;
          return dayData;
        })
      };

      if (plan) {
        // Update existing plan
        await api.put(`/training-plans/${plan._id || plan.id}`, planData);
        showSnackbar('Plan treningowy został zaktualizowany', 'success');
      } else {
        // Create new plan
        await api.post('/training-plans', planData);
        showSnackbar('Plan treningowy został utworzony', 'success');
      }
      onClose(true); // Close with refresh flag
    } catch (error) {
      showSnackbar('Wystąpił błąd podczas zapisywania planu', 'error');
      setErrors(prev => ({ ...prev, general: "Wystąpił błąd podczas zapisywania planu." }));
    } finally {
      setSaving(false);
    }
  };

  // Add new day to plan
  const handleAddDay = () => {
    const newDays = [...formData.days];
    const daysOfWeek = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];

    // Find a day of the week that isn't used yet, or default to "Trening"
    let dayName = 'Trening';
    for (const day of daysOfWeek) {
      if (!newDays.some(d => d.dayOfWeek === day)) {
        dayName = day;
        break;
      }
    }

    const newDay = {
      dayOfWeek: dayName,
      name: `${dayName} - Trening`,
      order: newDays.length + 1,
      exercises: [],
      // Add temporary id for React key if it's a new day (will be replaced with real id on save)
      _tempId: Date.now()
    };

    newDays.push(newDay);
    setFormData(prev => ({ ...prev, days: newDays }));

    // Switch to the new day tab
    setTabValue(newDays.length - 1);
  };

  // Handle day update
  const handleDayUpdate = (updatedDay, index) => {
    const newDays = [...formData.days];
    newDays[index] = updatedDay;
    setFormData(prev => ({ ...prev, days: newDays }));
  };

  // Handle day removal
  const handleDayRemove = (index) => {
    const newDays = formData.days.filter((_, i) => i !== index);
    // Update order of remaining days
    newDays.forEach((day, i) => {
      day.order = i + 1;
    });

    setFormData(prev => ({ ...prev, days: newDays }));

    // Adjust tab value if necessary
    if (tabValue >= newDays.length) {
      setTabValue(Math.max(0, newDays.length - 1));
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
      <TextField
        margin="normal"
        required
        fullWidth
        id="name"
        label="Nazwa planu treningowego"
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={!!errors.name}
        helperText={errors.name}
        sx={{ mb: 2 }}
      />

      <TextField
        margin="normal"
        fullWidth
        id="description"
        label="Opis planu treningowego"
        name="description"
        value={formData.description}
        onChange={handleChange}
        multiline
        rows={2}
        sx={{ mb: 3 }}
      />

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Dni treningowe</Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddDay}
          sx={{
            color: '#4CAF50',
            borderColor: '#4CAF50',
            '&:hover': {
              borderColor: '#3b8a3e',
              backgroundColor: 'rgba(76,175,80,0.1)'
            }
          }}
        >
          Dodaj dzień
        </Button>
      </Box>

      {formData.days.length > 0 ? (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              variant="scrollable"
              scrollButtons="auto"
            >
              {formData.days.map((day, index) => (
                <Tab
                  key={day._id || day._tempId || index}
                  label={day.name || `Dzień ${index + 1}`}
                />
              ))}
            </Tabs>
          </Box>

          {formData.days.map((day, index) => (
            <Box
              key={day._id || day._tempId || index}
              role="tabpanel"
              hidden={tabValue !== index}
              sx={{ mb: 3 }}
            >
              {tabValue === index && (
                <TrainingDayForm
                  day={day}
                  onUpdate={(updatedDay) => handleDayUpdate(updatedDay, index)}
                  onRemove={() => handleDayRemove(index)}
                />
              )}
            </Box>
          ))}
        </>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4, backgroundColor: '#f9f9f9', borderRadius: 1 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Dodaj dni treningowe do swojego planu
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddDay}
            sx={{
              mt: 1,
              backgroundColor: '#4CAF50',
              '&:hover': {
                backgroundColor: '#3b8a3e',
              }
            }}
          >
            Dodaj pierwszy dzień
          </Button>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => onClose()}
          disabled={saving}
        >
          Anuluj
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          sx={{
            backgroundColor: '#4CAF50',
            '&:hover': {
              backgroundColor: '#3b8a3e',
            }
          }}
        >
          {saving ? 'Zapisywanie...' : 'Zapisz plan'}
        </Button>
      </Box>
    </Box>
  );
};

export default TrainingPlanForm;