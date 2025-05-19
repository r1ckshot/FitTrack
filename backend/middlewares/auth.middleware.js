const jwt = require('jsonwebtoken');
const MongoUser = require('../models/mongo/user.model');
const MySQLUser = require('../models/mysql/user.model');

// Middleware do weryfikacji tokena
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Pobiera token z nagłówka Authorization
  
  if (!token) {
    return res.status(401).json({ error: 'Brak tokena. Dostęp zabroniony.' });
  }
  
  try {
    const secret = process.env.JWT_SECRET || 'supersecretkey';
    const decoded = jwt.verify(token, secret); // Weryfikacja tokena
    
    // Pobierz aktualny obiekt użytkownika z bazy danych
    let user = null;
    const databaseType = process.env.DATABASE_TYPE || 'both';
    
    // Sprawdź w MongoDB
    if (databaseType === 'mongo' || databaseType === 'both') {
      try {
        user = await MongoUser.findOne({ username: decoded.username });
      } catch (mongoError) {
        console.error('Błąd pobierania użytkownika z MongoDB:', mongoError);
      }
    }
    
    // Jeśli nie znaleziono w MongoDB, sprawdź w MySQL
    if (!user && (databaseType === 'mysql' || databaseType === 'both')) {
      try {
        user = await MySQLUser.findOne({ where: { username: decoded.username } });
      } catch (mysqlError) {
        console.error('Błąd pobierania użytkownika z MySQL:', mysqlError);
      }
    }
    
    // Jeśli użytkownik nie istnieje w żadnej bazie danych
    if (!user) {
      return res.status(403).json({ error: 'Nieprawidłowy token - użytkownik nie istnieje.' });
    }
    
    // Przypisanie danych użytkownika do req
    req.user = {
      ...decoded,
      mysqlId: user.id, 
      mongoDB: user._id ? user._id.toString() : null, // ID z MongoDB jeśli istnieje
      currentUser: user // pełen obiekt użytkownika
    };
    
    next(); // Przejście do następnego middleware lub trasy
  } catch (error) {
    console.error('Błąd weryfikacji tokena:', error);
    return res.status(403).json({ error: 'Nieprawidłowy token.' });
  }
};

module.exports = { authenticateToken };