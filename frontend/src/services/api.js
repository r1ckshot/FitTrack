import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api', // URL backendu
  headers: {
    'Content-Type': 'application/json',
  },
});

// Przechwytuj błędy i loguj je (opcjonalnie)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Błąd API:', error.response || error.message);
    return Promise.reject(error);
  }
);

export default api;