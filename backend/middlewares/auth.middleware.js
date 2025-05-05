const jwt = require('jsonwebtoken');

// Middleware do weryfikacji tokena
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Pobiera token z nagłówka Authorization
  
  if (!token) {
    return res.status(401).json({ error: 'Brak tokena. Dostęp zabroniony.' });
  }
  
  try {
    const secret = process.env.JWT_SECRET || 'supersecretkey';
    const decoded = jwt.verify(token, secret); // Weryfikacja tokena
    req.user = decoded; // Przypisanie danych użytkownika do req
    next(); // Przejście do następnego middleware lub trasy
  } catch (error) {
    console.error('Błąd weryfikacji tokena:', error);
    return res.status(403).json({ error: 'Nieprawidłowy token.' });
  }
};

module.exports = { authenticateToken };