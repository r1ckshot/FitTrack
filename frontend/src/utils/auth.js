export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    // Sprawdzamy, czy token nie wygasł
    const payload = JSON.parse(atob(token.split('.')[1])); // Dekodowanie payloadu JWT
    const expirationTime = payload.exp * 1000; // Konwersja na milisekundy
    
    if (Date.now() >= expirationTime) {
      localStorage.removeItem('token'); // Usuwamy wygasły token
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Błąd dekodowania tokena:', error);
    localStorage.removeItem('token'); // Usuwamy nieprawidłowy token
    return false;
  }
};