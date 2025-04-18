import axios from 'axios';

const apiClient = axios.create({
  baseURL: `https://${process.env.REACT_APP_EXERCISEDB_HOST}`,
  headers: {
    'x-rapidapi-key': process.env.REACT_APP_EXERCISEDB_API_KEY,
    'x-rapidapi-host': process.env.REACT_APP_EXERCISEDB_HOST,
  },
});

// Pobierz listę partii ciała
export const getBodyParts = async () => {
  const response = await apiClient.get('/exercises/bodyPartList');
  return response.data;
};

// Pobierz ćwiczenia według partii ciała
export const getExercisesByBodyPart = async (bodyPart) => {
  const response = await apiClient.get(`/exercises/bodyPart/${bodyPart}`);
  return response.data;
};

// Pobierz listę sprzętu
export const getEquipmentList = async () => {
  const response = await apiClient.get('/exercises/equipmentList');
  return response.data;
};

// Pobierz ćwiczenia według sprzętu
export const getExercisesByEquipment = async (equipment) => {
  const response = await apiClient.get(`/exercises/equipment/${equipment}`);
  return response.data;
};

// Pobierz listę celów
export const getTargetList = async () => {
  const response = await apiClient.get('/exercises/targetList');
  return response.data;
};

// Pobierz ćwiczenia według celu
export const getExercisesByTarget = async (target) => {
  const response = await apiClient.get(`/exercises/target/${target}`);
  return response.data;
};

// Pobierz szczegóły ćwiczenia według ID
export const getExerciseById = async (id) => {
  const response = await apiClient.get(`/exercises/exercise/${id}`);
  return response.data;
};

// Pobierz ćwiczenia według nazwy
export const getExercisesByName = async (name) => {
  const response = await apiClient.get(`/exercises/name/${name}`);
  return response.data;
};

// Pobierz wszystkie ćwiczenia
export const getAllExercises = async () => {
  const response = await apiClient.get('/exercises');
  return response.data;
};