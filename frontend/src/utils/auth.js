import { clearRecipesCache } from '../services/dietService';
import { clearExercisesCache } from '../services/exerciseService';

export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    clearRecipesCache();
    clearExercisesCache();
    return false;
  }

  try {
    // Sprawdzamy, czy token nie wygasł
    const payload = JSON.parse(atob(token.split('.')[1])); // Dekodowanie payloadu JWT
    const expirationTime = payload.exp * 1000; // Konwersja na milisekundy

    if (Date.now() >= expirationTime) {
      // Najpierw czyścimy cache przy wylogowaniu
      clearRecipesCache();
      clearExercisesCache();
      // Dopiero potem usuwamy token
      localStorage.removeItem('token');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Błąd dekodowania tokena:', error);
    // Najpierw czyścimy cache
    clearRecipesCache();
    clearExercisesCache();
    // Dopiero potem usuwamy token
    localStorage.removeItem('token');
    return false;
  }
};