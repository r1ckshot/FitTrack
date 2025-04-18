import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api', // URL backendu
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dodaj token JWT do każdego żądania
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Pobierz token z LocalStorage
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`; // Dodaj nagłówek Authorization
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Przechwytuj błędy i loguj je (opcjonalnie)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Błąd API:', error.response || error.message);
    return Promise.reject(error);
  }
);

export default api;