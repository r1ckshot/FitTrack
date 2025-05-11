import { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, CircularProgress, Tabs, Tab, Divider } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import api from '../../services/api';
import DietDayForm from './DietDayForm';
import { useSnackbar } from '../../contexts/SnackbarContext';

const DietPlanForm = ({ plan, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    days: [],
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [errors, setErrors] = useState({});
  const { showSnackbar } = useSnackbar(); // Dodano hook do Snackbara

  // Load plan data if editing existing plan
  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name || '',
        description: plan.description || '',
        days: plan.days || [],
      });
    }
  }, [plan]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

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
      const response = await api.get('/diet-plans');
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

  const validateDaysAndMeals = (days) => {
    for (const day of days) {
      if (!day.dayOfWeek || !day.name || typeof day.order !== 'number') {
        console.log('Nieprawidłowe dane dnia:', day);
        return false;
      }
      if (day.meals?.length > 0) {
        for (const meal of day.meals) {
          if (!meal.recipeId || !meal.title || 
              (typeof meal.calories !== 'number' && isNaN(parseFloat(meal.calories)))) {
            console.log('Nieprawidłowe dane posiłku:', meal);
            return false;
          }
        }
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Dodano sprawdzenie unikalności nazwy
    const nameExists = await checkPlanNameExists();
    if (nameExists) {
      showSnackbar('Plan dietetyczny o tej nazwie już istnieje', 'error');
      return;
    }

    const preparedFormData = JSON.parse(JSON.stringify(formData));

    if (!validateDaysAndMeals(preparedFormData.days)) {
      showSnackbar('Niekompletne dane dni lub posiłków! Sprawdź wymagane pola', 'error');
      return;
    }

    setSaving(true);
    try {
      const planData = {
        name: preparedFormData.name,
        description: preparedFormData.description,
        isActive: plan?.isActive || false,
        days: preparedFormData.days.map((day) => {
          const { _tempId, ...dayData } = day;
          return dayData;
        }),
      };

      if (plan) {
        await api.put(`/diet-plans/${plan._id || plan.id}`, planData);
        showSnackbar('Plan dietetyczny został zaktualizowany', 'success');
      } else {
        await api.post('/diet-plans', planData);
        showSnackbar('Plan dietetyczny został utworzony', 'success');
      }
      onClose(true);
    } catch (error) {
      showSnackbar('Wystąpił błąd podczas zapisywania planu', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Add new day to plan
  const handleAddDay = () => {
    const newDays = [...formData.days];
    const daysOfWeek = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];

    let dayName = 'Dzień Dietetyczny';
    for (const day of daysOfWeek) {
      if (!newDays.some((d) => d.dayOfWeek === day)) {
        dayName = day;
        break;
      }
    }

    const newDay = {
      dayOfWeek: dayName,
      name: `${dayName} - Dieta`,
      order: newDays.length + 1,
      meals: [],
      _tempId: Date.now(),
    };

    newDays.push(newDay);
    setFormData((prev) => ({ ...prev, days: newDays }));
    setTabValue(newDays.length - 1);
  };

  // Handle day update
  const handleDayUpdate = (updatedDay, index) => {
    const newDays = [...formData.days];
    newDays[index] = updatedDay;
    setFormData((prev) => ({ ...prev, days: newDays }));
  };

  // Handle day removal
  const handleDayRemove = (index) => {
    const newDays = formData.days.filter((_, i) => i !== index);
    newDays.forEach((day, i) => {
      day.order = i + 1;
    });

    setFormData((prev) => ({ ...prev, days: newDays }));

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
        label="Nazwa planu dietetycznego"
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
        label="Opis planu dietetycznego"
        name="description"
        value={formData.description}
        onChange={handleChange}
        multiline
        rows={2}
        sx={{ mb: 3 }}
      />

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Dni dietetyczne</Typography>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddDay}
          sx={{
            color: '#FF7043',
            borderColor: '#FF7043',
            '&:hover': {
              borderColor: '#E64A19',
              backgroundColor: 'rgba(255,112,67,0.1)',
            },
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
                <Tab key={day._id || day._tempId || index} label={day.name || `Dzień ${index + 1}`} />
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
                <DietDayForm
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
            Dodaj dni dietetyczne do swojego planu
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddDay}
            sx={{
              mt: 1,
              backgroundColor: '#FF7043',
              '&:hover': {
                backgroundColor: '#E64A19',
              },
            }}
          >
            Dodaj pierwszy dzień
          </Button>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, gap: 2 }}>
        <Button variant="outlined" onClick={() => onClose()} disabled={saving}>
          Anuluj
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          sx={{
            backgroundColor: '#FF7043',
            '&:hover': {
              backgroundColor: '#E64A19',
            },
          }}
        >
          {saving ? 'Zapisywanie...' : 'Zapisz plan'}
        </Button>
      </Box>
    </Box>
  );
};

export default DietPlanForm;