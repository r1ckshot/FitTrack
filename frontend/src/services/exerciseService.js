import axios from 'axios';

// Cache dla przechowywania danych, aby uniknąć wielokrotnego pobierania
let exercisesCache = null;

const apiClient = axios.create({
  baseURL: `https://${process.env.REACT_APP_EXERCISEDB_HOST}`,
  headers: {
    'x-rapidapi-key': process.env.REACT_APP_EXERCISEDB_API_KEY,
    'x-rapidapi-host': process.env.REACT_APP_EXERCISEDB_HOST,
  },
});

// Główna funkcja pobierająca wszystkie ćwiczenia
export const getAllExercises = async (limit = 0) => {
  if (exercisesCache) {
    return exercisesCache;
  }
  
  const response = await apiClient.get(`/exercises?limit=${limit}`);
  exercisesCache = response.data;
  return response.data;
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

// Funkcja czyszcząca cache - przydatna przy wylogowaniu lub resetowaniu stanu
export const clearExercisesCache = () => {
  exercisesCache = null;
};