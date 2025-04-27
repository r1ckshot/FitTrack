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
  Slider,
  IconButton,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Input,
  FormHelperText
} from '@mui/material';
import { motion } from 'framer-motion';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import TuneIcon from '@mui/icons-material/Tune';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { getRecipesByNutrients, filterRecipes, clearRecipesCache } from '../services/dietService';

const MealSelection = ({ onMealSelect, onCancel, currentMeal }) => {
  // Podstawowe stany
  const [allMeals, setAllMeals] = useState([]);
  const [filteredMeals, setFilteredMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Stany filtrów
  const [filters, setFilters] = useState({
    minCalories: 0,
    maxCalories: 1000,
    minProtein: 0,
    maxProtein: 100,
    minCarbs: 0,
    maxCarbs: 100,
    minFat: 0,
    maxFat: 100
  });

  // Stan dla okna dialogowego własnego posiłku
  const [customMealDialogOpen, setCustomMealDialogOpen] = useState(false);
  const [customMeal, setCustomMeal] = useState({
    id: '',
    title: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    image: '',
    recipeUrl: '',
    isCustom: true
  });
  const [formErrors, setFormErrors] = useState({});

  // Funkcja do aktualizacji pojedynczego filtra
  const updateFilter = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Pobieranie wszystkich przepisów przy pierwszym załadowaniu
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const recipes = await getRecipesByNutrients({});
        setAllMeals(recipes);
        setFilteredMeals(recipes);
      } catch (error) {
        console.error('Błąd podczas pobierania przepisów:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Ustawienie filtrów dla edytowanego posiłku
  useEffect(() => {
    if (!loading && currentMeal) {
      // Sprawdzamy czy to własny posiłek
      if (currentMeal.isCustom || currentMeal.recipeId?.startsWith('custom-')) {
        // Jeśli to własny posiłek, otwieramy dialog edycji
        setCustomMeal({
          id: currentMeal.recipeId,
          title: currentMeal.title,
          calories: currentMeal.calories,
          protein: currentMeal.protein,
          carbs: currentMeal.carbs,
          fat: currentMeal.fat,
          image: currentMeal.image || '',
          recipeUrl: currentMeal.recipeUrl || '',
          isCustom: true
        });
        setTimeout(() => {
          setCustomMealDialogOpen(true);
        }, 100);
      } else {
        // Standardowa logika dla predefiniowanych posiłków
        setSearchTerm(currentMeal.title);
        updateFilter('minCalories', currentMeal.calories - 50);
        updateFilter('maxCalories', currentMeal.calories + 50);
      }
    }
  }, [loading, currentMeal]);

  // Zastosowanie filtrów
  useEffect(() => {
    if (allMeals.length > 0) {
      applyFilters();
    }
  }, [filters, searchTerm, allMeals]);

  // Funkcja filtrująca przepisy
  const applyFilters = () => {
    const currentFilters = { ...filters, searchTerm };
    const results = filterRecipes(allMeals, currentFilters);
    setFilteredMeals(results);
  };

  // Resetowanie filtrów
  const resetFilters = () => {
    setFilters({
      minCalories: 0,
      maxCalories: 1000,
      minProtein: 0,
      maxProtein: 100,
      minCarbs: 0,
      maxCarbs: 100,
      minFat: 0,
      maxFat: 100
    });
    setSearchTerm('');
    setFilteredMeals(allMeals);
  };

  // Resetowanie pojedynczego filtra
  const resetSingleFilter = (filterType) => {
    if (filterType === 'calories') {
      updateFilter('minCalories', 0);
      updateFilter('maxCalories', 1000);
    } else if (filterType === 'protein') {
      updateFilter('minProtein', 0);
      updateFilter('maxProtein', 100);
    } else if (filterType === 'carbs') {
      updateFilter('minCarbs', 0);
      updateFilter('maxCarbs', 100);
    } else if (filterType === 'fat') {
      updateFilter('minFat', 0);
      updateFilter('maxFat', 100);
    }
  };

  // Obsługa otwarcia dialogu własnego posiłku
  const handleOpenCustomMealDialog = () => {
    setCustomMeal({
      id: `custom-${Date.now()}`,
      title: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      image: '',
      recipeUrl: '',
      isCustom: true
    });
    setFormErrors({});
    setCustomMealDialogOpen(true);
  };

  // Obsługa zmian w formularzu własnego posiłku
  const handleCustomMealChange = (e) => {
    const { name, value } = e.target;
    setCustomMeal(prev => ({
      ...prev,
      [name]: value
    }));

    // Czyszczenie błędu dla tego pola jeśli istnieje
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Walidacja i zapis własnego posiłku
  const handleSaveCustomMeal = () => {
    // Walidacja wymaganych pól
    const errors = {};
    if (!customMeal.title.trim()) errors.title = 'Nazwa jest wymagana';

    // Walidacja wartości liczbowych
    const caloriesValue = parseFloat(customMeal.calories);
    if (isNaN(caloriesValue) || caloriesValue < 1) {
      errors.calories = 'Kalorie muszą być liczbą większą lub równą 1';
    }

    const proteinValue = parseFloat(customMeal.protein);
    if (isNaN(proteinValue) || proteinValue < 0) {
      errors.protein = 'Białko musi być liczbą większą lub równą 0';
    }

    const carbsValue = parseFloat(customMeal.carbs);
    if (isNaN(carbsValue) || carbsValue < 0) {
      errors.carbs = 'Węglowodany muszą być liczbą większą lub równą 0';
    }

    const fatValue = parseFloat(customMeal.fat);
    if (isNaN(fatValue) || fatValue < 0) {
      errors.fat = 'Tłuszcze muszą być liczbą większą lub równą 0';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Tworzenie obiektu posiłku w formacie oczekiwanym przez onMealSelect
    const meal = {
      id: customMeal.id,
      title: customMeal.title,
      calories: caloriesValue,
      protein: proteinValue,
      carbs: carbsValue,
      fat: fatValue,
      image: customMeal.image || '',
      recipeUrl: customMeal.recipeUrl || '',
      isCustom: true
    };

    onMealSelect(meal);
    setCustomMealDialogOpen(false);
  };

  // Wyświetlanie ładowania
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress sx={{ color: '#FF7043' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <Typography variant="h6" align="center" gutterBottom component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        Wybierz posiłek
      </Typography>

      {/* Przycisk dodawania własnego posiłku */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<AddCircleOutlineIcon />}
          onClick={handleOpenCustomMealDialog}
          sx={{
            color: '#FF7043',
            borderColor: '#FF7043',
            '&:hover': {
              borderColor: '#E64A19',
              backgroundColor: 'rgba(255,112,67,0.1)'
            }
          }}
        >
          Dodaj własny posiłek
        </Button>
      </Box>

      {/* Panel filtrowania */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Button
            startIcon={<TuneIcon />}
            onClick={() => setFiltersOpen(true)}
            sx={{ color: '#FF7043', borderColor: '#FF7043', mb: 1 }}
            variant="outlined"
          >
            Filtry
          </Button>
        </Box>

        <TextField
          placeholder="Szukaj posiłków..."
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
          sx={{ width: { xs: '60%', sm: '300px' } }}
        />
      </Box>

      {/* Wyświetlanie aktywnych filtrów */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {(filters.minCalories > 0 || filters.maxCalories < 1000) && (
          <Chip
            label={`Kalorie: ${filters.minCalories}-${filters.maxCalories}`}
            onDelete={() => resetSingleFilter('calories')}
            sx={{ backgroundColor: 'rgba(255,112,67,0.2)', color: '#333' }}
          />
        )}
        {(filters.minProtein > 0 || filters.maxProtein < 100) && (
          <Chip
            label={`Białko: ${filters.minProtein}-${filters.maxProtein} g`}
            onDelete={() => resetSingleFilter('protein')}
            sx={{ backgroundColor: 'rgba(255,112,67,0.2)', color: '#333' }}
          />
        )}
        {(filters.minCarbs > 0 || filters.maxCarbs < 100) && (
          <Chip
            label={`Węglowodany: ${filters.minCarbs}-${filters.maxCarbs} g`}
            onDelete={() => resetSingleFilter('carbs')}
            sx={{ backgroundColor: 'rgba(255,112,67,0.2)', color: '#333' }}
          />
        )}
        {(filters.minFat > 0 || filters.maxFat < 100) && (
          <Chip
            label={`Tłuszcze: ${filters.minFat}-${filters.maxFat} g`}
            onDelete={() => resetSingleFilter('fat')}
            sx={{ backgroundColor: 'rgba(255,112,67,0.2)', color: '#333' }}
          />
        )}
      </Box>

      {/* Wyniki wyszukiwania */}
      <Typography variant="body1" sx={{ mb: 2 }}>
        Wyniki wyszukiwania: {filteredMeals.length} posiłków
      </Typography>

      {/* Wyświetlanie przepisów */}
      {filteredMeals.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 2 }}>
          <Typography>
            Nie znaleziono posiłków dla wybranych filtrów. Spróbuj zmienić kryteria wyszukiwania.
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 2, backgroundColor: '#FF7043' }}
            onClick={resetFilters}
          >
            Resetuj filtry
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filteredMeals.map((meal) => (
            <Grid item xs={12} sm={6} md={4} key={meal.id}>
              <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                    }
                  }}
                  onClick={() => onMealSelect(meal)}
                >
                  <Box
                    sx={{
                      height: '160px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: '#f5f5f5',
                      overflow: 'hidden',
                    }}
                  >
                    <CardMedia
                      component="img"
                      image={meal.image || '/placeholder-food.jpg'}
                      alt={meal.title}
                      sx={{
                        maxHeight: '90%',
                        maxWidth: '90%',
                        objectFit: 'contain',
                        transition: 'transform 0.3s',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        },
                      }}
                    />
                  </Box>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" noWrap title={meal.title}>
                      {meal.title}
                    </Typography>
                    <Typography variant="body2">Kalorie: {meal.calories} kcal</Typography>
                    <Typography variant="body2">Białko: {meal.protein} g</Typography>
                    <Typography variant="body2">Węglowodany: {meal.carbs} g</Typography>
                    <Typography variant="body2">Tłuszcze: {meal.fat} g</Typography>
                    <Button
                      variant="contained"
                      sx={{
                        marginTop: '10px',
                        backgroundColor: '#FF7043',
                        color: 'white',
                        '&:hover': { backgroundColor: '#E64A19' },
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onMealSelect(meal);
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

      {/* Dialog filtrów */}
      <Dialog open={filtersOpen} onClose={() => setFiltersOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Filtry posiłków</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography id="calories-slider" gutterBottom>
              Kalorie: {filters.minCalories} - {filters.maxCalories} kcal
            </Typography>
            <Slider
              value={[filters.minCalories, filters.maxCalories]}
              onChange={(e, newValue) => {
                updateFilter('minCalories', newValue[0]);
                updateFilter('maxCalories', newValue[1]);
              }}
              min={0}
              max={1000}
              sx={{ color: '#FF7043' }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography id="protein-slider" gutterBottom>
              Białko: {filters.minProtein} - {filters.maxProtein} g
            </Typography>
            <Slider
              value={[filters.minProtein, filters.maxProtein]}
              onChange={(e, newValue) => {
                updateFilter('minProtein', newValue[0]);
                updateFilter('maxProtein', newValue[1]);
              }}
              min={0}
              max={100}
              sx={{ color: '#FF7043' }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography id="carbs-slider" gutterBottom>
              Węglowodany: {filters.minCarbs} - {filters.maxCarbs} g
            </Typography>
            <Slider
              value={[filters.minCarbs, filters.maxCarbs]}
              onChange={(e, newValue) => {
                updateFilter('minCarbs', newValue[0]);
                updateFilter('maxCarbs', newValue[1]);
              }}
              min={0}
              max={100}
              sx={{ color: '#FF7043' }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography id="fat-slider" gutterBottom>
              Tłuszcze: {filters.minFat} - {filters.maxFat} g
            </Typography>
            <Slider
              value={[filters.minFat, filters.maxFat]}
              onChange={(e, newValue) => {
                updateFilter('minFat', newValue[0]);
                updateFilter('maxFat', newValue[1]);
              }}
              min={0}
              max={100}
              sx={{ color: '#FF7043' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetFilters} sx={{ color: '#777' }}>
            Resetuj
          </Button>
          <Button
            onClick={() => setFiltersOpen(false)}
            variant="contained"
            sx={{ backgroundColor: '#FF7043', '&:hover': { backgroundColor: '#E64A19' } }}
          >
            Zastosuj
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog własnego posiłku */}
      <Dialog open={customMealDialogOpen} onClose={() => setCustomMealDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          {currentMeal && currentMeal.isCustom ? 'Edytuj własny posiłek' : 'Dodaj własny posiłek'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Nazwa posiłku"
              name="title"
              value={customMeal.title}
              onChange={handleCustomMealChange}
              error={!!formErrors.title}
              helperText={formErrors.title}
              required
            />

            <TextField
              fullWidth
              label="Kalorie (kcal)"
              name="calories"
              type="number"
              value={customMeal.calories}
              onChange={handleCustomMealChange}
              error={!!formErrors.calories}
              helperText={formErrors.calories}
              required
              inputProps={{ min: "1", step: "1" }}
            />

            <TextField
              fullWidth
              label="Białko (g)"
              name="protein"
              type="number"
              value={customMeal.protein}
              onChange={handleCustomMealChange}
              error={!!formErrors.protein}
              helperText={formErrors.protein}
              required
              inputProps={{ min: "0", step: "0.1" }}
            />

            <TextField
              fullWidth
              label="Węglowodany (g)"
              name="carbs"
              type="number"
              value={customMeal.carbs}
              onChange={handleCustomMealChange}
              error={!!formErrors.carbs}
              helperText={formErrors.carbs}
              required
              inputProps={{ min: "0", step: "0.1" }}
            />

            <TextField
              fullWidth
              label="Tłuszcze (g)"
              name="fat"
              type="number"
              value={customMeal.fat}
              onChange={handleCustomMealChange}
              error={!!formErrors.fat}
              helperText={formErrors.fat}
              required
              inputProps={{ min: "0", step: "0.1" }}
            />

            <TextField
              fullWidth
              label="URL do zdjęcia (opcjonalnie)"
              name="image"
              value={customMeal.image}
              onChange={handleCustomMealChange}
              placeholder="np. https://link-do-zdjecia.jpg"
            />
            
            <TextField
              fullWidth
              label="Link do przepisu (opcjonalnie)"
              name="recipeUrl"
              value={customMeal.recipeUrl}
              onChange={handleCustomMealChange}
              placeholder="np. https://przepisy.pl/moj-przepis"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setCustomMealDialogOpen(false)}
            color="inherit"
          >
            Anuluj
          </Button>
          <Button
            onClick={handleSaveCustomMeal}
            variant="contained"
            sx={{ backgroundColor: '#FF7043', '&:hover': { backgroundColor: '#E64A19' } }}
          >
            Zapisz
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MealSelection;