import axios from 'axios';

// Cache dla przechowywania danych, aby uniknąć wielokrotnego pobierania
let recipesCache = null;

const apiClient = axios.create({
  baseURL: 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com',
  headers: {
    'x-rapidapi-key': process.env.REACT_APP_SPOONACULAR_API_KEY,
    'x-rapidapi-host': process.env.REACT_APP_SPOONACULAR_HOST,
  },
});

// Funkcja do usuwania jednostek i konwersji na liczby
const parseNutrientValue = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    return parseFloat(value.replace(/[^\d.-]/g, ''));
  }
  return 0;
};

// Funkcja normalizująca dane przepisu
const normalizeRecipe = (recipe) => {
  return {
    ...recipe,
    calories: parseFloat(recipe.calories || 0),
    protein: parseNutrientValue(recipe.protein || '0g'),
    carbs: parseNutrientValue(recipe.carbs || '0g'),
    fat: parseNutrientValue(recipe.fat || '0g'),
  };
};

// Główna funkcja pobierająca przepisy
export const getRecipesByNutrients = async (params = {}) => {
  try {
    // Jeśli cache istnieje i nie ma specyficznych parametrów, używamy cache
    if (recipesCache && Object.keys(params).length === 0) {
      return recipesCache;
    }

    const response = await apiClient.get('/recipes/findByNutrients', {
      params: {
        minProtein: params.minProtein || 0,
        maxProtein: params.maxProtein || 100,
        minCarbs: params.minCarbs || 0,
        maxCarbs: params.maxCarbs || 100,
        minFat: params.minFat || 0,
        maxFat: params.maxFat || 100,
        minCalories: params.minCalories || 0,
        maxCalories: params.maxCalories || 1000,
        number: 25, // Zwiększona liczba przepisów
      },
    });

    // Normalizacja danych
    const normalizedData = response.data.map(normalizeRecipe);
    
    // Aktualizacja cache tylko dla podstawowego zapytania
    if (Object.keys(params).length === 0) {
      recipesCache = normalizedData;
    }
    
    return normalizedData;
  } catch (error) {
    console.error('Błąd podczas pobierania przepisów:', error);
    // Zwróć cache jeśli istnieje lub pustą tablicę
    return recipesCache || [];
  }
};

// Funkcja do filtrowania przepisów lokalnie 
export const filterRecipes = (recipes, filters) => {
  if (!recipes || recipes.length === 0) return [];
  
  return recipes.filter(recipe => {
    // Sprawdzamy czy przepis spełnia wszystkie kryteria
    if (filters.minCalories && recipe.calories < filters.minCalories) return false;
    if (filters.maxCalories && recipe.calories > filters.maxCalories) return false;
    if (filters.minProtein && recipe.protein < filters.minProtein) return false;
    if (filters.maxProtein && recipe.protein > filters.maxProtein) return false;
    if (filters.minCarbs && recipe.carbs < filters.minCarbs) return false;
    if (filters.maxCarbs && recipe.carbs > filters.maxCarbs) return false;
    if (filters.minFat && recipe.fat < filters.minFat) return false;
    if (filters.maxFat && recipe.fat > filters.maxFat) return false;
    
    // Filtrowanie po wyszukiwanym terminie
    if (filters.searchTerm && !recipe.title.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });
};

// Funkcja wyszukiwania przepisu po ID
export const getRecipeById = async (id) => {
  const recipes = await getRecipesByNutrients({});
  return recipes.find(recipe => recipe.id === parseInt(id, 10));
};

// Funkcja czyszcząca cache
export const clearRecipesCache = () => {
  recipesCache = null;
};