export const getUserRole = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1])); // Dekodowanie payloadu JWT
    console.log('Decoded payload:', payload); // Debug: logujemy payload
    return payload.role; // Zwracamy rolę użytkownika
  } catch (error) {
    console.error('Błąd dekodowania tokena:', error);
    return null;
  }
};