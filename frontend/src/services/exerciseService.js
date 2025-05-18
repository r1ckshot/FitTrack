import axios from 'axios';

// Cache dla przechowywania danych w pamięci
let exercisesCache = null;

// Nazwa klucza dla localStorage
const EXERCISES_CACHE_KEY = 'exercisedb_cache';
// Czas życia cache w milisekundach (1 godzina)
const CACHE_TTL = 60 * 60 * 1000;

const apiClient = axios.create({
  baseURL: `https://${process.env.REACT_APP_EXERCISEDB_HOST}`,
  headers: {
    'x-rapidapi-key': process.env.REACT_APP_EXERCISEDB_API_KEY,
    'x-rapidapi-host': process.env.REACT_APP_EXERCISEDB_HOST,
  },
});

// Funkcja pobierająca dane z localStorage
const getFromLocalStorage = () => {
  try {
    const cachedData = localStorage.getItem(EXERCISES_CACHE_KEY);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      // Sprawdzenie czy cache nie wygasł
      if (Date.now() - timestamp < CACHE_TTL) {
        return data;
      }
    }
  } catch (error) {
    console.error('Błąd podczas odczytu z localStorage:', error);
  }
  return null;
};

// Funkcja zapisująca dane do localStorage
const saveToLocalStorage = (data) => {
  try {
    const cacheObject = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(EXERCISES_CACHE_KEY, JSON.stringify(cacheObject));
  } catch (error) {
    console.error('Błąd podczas zapisu do localStorage:', error);
  }
};

// Główna funkcja pobierająca wszystkie ćwiczenia
export const getAllExercises = async (limit = 0) => {
  try {
    // Sprawdzamy czy mamy dane w pamięci
    if (!exercisesCache) {
      // Próbujemy załadować z localStorage
      exercisesCache = getFromLocalStorage();
    }
    
    // Jeśli mamy dane w cache, zwracamy je
    if (exercisesCache) {
      return exercisesCache;
    }
    
    // Jeśli nie mamy danych w cache, pobieramy z API
    const response = await apiClient.get(`/exercises?limit=${limit}`);
    exercisesCache = response.data;
    
    // Zapisujemy dane do localStorage dla przyszłych odświeżeń strony
    saveToLocalStorage(response.data);
    
    return response.data;
  } catch (error) {
    console.error('Błąd podczas pobierania ćwiczeń:', error);
    
    // Dodajemy więcej szczegółów do logów dla łatwiejszego debugowania
    if (error.response) {
      console.error('Odpowiedź serwera:', error.response.status, error.response.data);
    }
    
    // Zwracamy pustą tablicę w przypadku błędu
    return [];
  }
};

// Funkcje wyciągające unikalne wartości z pobranych danych
export const getBodyParts = async () => {
  const exercises = await getAllExercises();
  const bodyParts = [...new Set(exercises.map(exercise => exercise.bodyPart))];
  return bodyParts;
};

export const getEquipmentList = async () => {
  const exercises = await getAllExercises();
  const equipment = [...new Set(exercises.map(exercise => exercise.equipment))];
  return equipment;
};

export const getTargetList = async () => {
  const exercises = await getAllExercises();
  const targets = [...new Set(exercises.map(exercise => exercise.target))];
  return targets;
};

// Funkcje filtrujące korzystające z danych w pamięci
export const getExercisesByBodyPart = async (bodyPart) => {
  const exercises = await getAllExercises();
  return exercises.filter(exercise => exercise.bodyPart === bodyPart);
};

export const getExercisesByEquipment = async (equipment) => {
  const exercises = await getAllExercises();
  return exercises.filter(exercise => exercise.equipment === equipment);
};

export const getExercisesByTarget = async (target) => {
  const exercises = await getAllExercises();
  return exercises.filter(exercise => exercise.target === target);
};

export const getExerciseById = async (id) => {
  const exercises = await getAllExercises();
  return exercises.find(exercise => exercise.id === id);
};

export const getExercisesByName = async (name) => {
  const exercises = await getAllExercises();
  return exercises.filter(exercise => 
    exercise.name.toLowerCase().includes(name.toLowerCase())
  );
};

// Funkcja czyszcząca cache - rozszerzona o czyszczenie localStorage
export const clearExercisesCache = () => {
  exercisesCache = null;
  try {
    localStorage.removeItem(EXERCISES_CACHE_KEY);
  } catch (error) {
    console.error('Błąd podczas czyszczenia localStorage:', error);
  }
};