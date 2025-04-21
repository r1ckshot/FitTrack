import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, CircularProgress, Tabs, Tab, Divider, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import api from '../services/api';
import DietDayForm from './DietDayForm';

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

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field if exists
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
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

  // Validate days and meals
  const validateDaysAndMeals = (days) => {
    for (const day of days) {
      if (!day.dayOfWeek || !day.name || typeof day.order !== 'number') {
        return false; // Dzień nie jest kompletny
      }
      if (day.meals && day.meals.length > 0) {
        for (const meal of day.meals) {
          if (!meal.recipeId || !meal.title || typeof meal.calories !== 'number') {
            return false; // Posiłek nie jest kompletny
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

    const preparedFormData = JSON.parse(JSON.stringify(formData));

    if (!validateDaysAndMeals(preparedFormData.days)) {
      console.error('Niekompletne dane dni dietetycznych lub posiłków.');
      setErrors((prev) => ({
        ...prev,
        general: 'Niepoprawne dane posiłków. Sprawdź, czy wszystkie wymagane pola są wypełnione.',
      }));
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
        // Update existing plan
        await api.put(`/diet-plans/${plan._id || plan.id}`, planData);
      } else {
        // Create new plan
        await api.post('/diet-plans', planData);
      }
      onClose(true); // Close with refresh flag
    } catch (error) {
      console.error('Błąd podczas zapisywania planu dietetycznego:', error);
      setErrors((prev) => ({
        ...prev,
        general: 'Wystąpił błąd podczas zapisywania planu.',
      }));
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