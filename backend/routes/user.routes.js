const express = require('express');
const MongoUser = require('../models/mongo/user.model'); // Model MongoDB
const MySQLUser = require('../models/mysql/user.model'); // Model MySQL
const { authenticateToken, authorizeRole } = require('../middlewares/auth.middleware');

const router = express.Router();

// Pobranie typu bazy danych z .env
const databaseType = process.env.DATABASE_TYPE || 'both';

// Filtrowanie użytkowników według roli
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const { role } = req.query; // Pobierz rolę z parametrów zapytania, np. ?role=trainer
    let users = [];

    // MongoDB: Pobierz użytkowników
    if (databaseType === 'mongo' || databaseType === 'both') {
      let filter = {};
      if (req.user.role === 'admin' && role) {
        filter.role = role;
      } else if (req.user.role === 'trainer') {
        filter.role = 'client';
      } else if (req.user.role === 'client') {
        filter.role = 'trainer';
      }
      const mongoUsers = await MongoUser.find(filter);
      users = users.concat(mongoUsers);
    }

    // MySQL: Pobierz użytkowników
    if (databaseType === 'mysql' || databaseType === 'both') {
      let whereClause = {};
      if (req.user.role === 'admin' && role) {
        whereClause.role = role;
      } else if (req.user.role === 'trainer') {
        whereClause.role = 'client';
      } else if (req.user.role === 'client') {
        whereClause.role = 'trainer';
      }
      const mysqlUsers = await MySQLUser.findAll({ where: whereClause });
      users = users.concat(mysqlUsers);
    }

    res.status(200).json(users);
  } catch (error) {
    console.error('Błąd filtrowania użytkowników:', error);
    res.status(500).json({ error: 'Błąd filtrowania użytkowników.' });
  }
});

// Pobierz użytkownika po ID
router.get('/users/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    let user = null;

    // MongoDB: Pobierz użytkownika
    if (databaseType === 'mongo' || databaseType === 'both') {
      user = await MongoUser.findById(userId);
    }

    // MySQL: Pobierz użytkownika
    if ((databaseType === 'mysql' || databaseType === 'both') && !user) {
      user = await MySQLUser.findByPk(userId);
    }

    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony.' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Błąd pobierania użytkownika:', error);
    res.status(500).json({ error: 'Błąd pobierania użytkownika.' });
  }
});

// Dodaj nowego użytkownika
router.post('/users', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    let userCreated = false;

    // MongoDB: Dodaj użytkownika
    if (databaseType === 'mongo' || databaseType === 'both') {
      const newUser = new MongoUser(req.body);
      await newUser.save();
      userCreated = true;
    }

    // MySQL: Dodaj użytkownika
    if (databaseType === 'mysql' || databaseType === 'both') {
      await MySQLUser.create(req.body);
      userCreated = true;
    }

    if (userCreated) {
      res.status(201).json({ message: 'Użytkownik dodany pomyślnie.' });
    } else {
      res.status(500).json({ error: 'Nie udało się dodać użytkownika.' });
    }
  } catch (error) {
    console.error('Błąd dodawania użytkownika:', error);
    res.status(500).json({ error: 'Błąd dodawania użytkownika.' });
  }
});

// Usuń użytkownika po ID
router.delete('/users/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const userId = req.params.id;
    let userDeleted = false;

    // MongoDB: Usuń użytkownika
    if (databaseType === 'mongo' || databaseType === 'both') {
      const deletedUser = await MongoUser.findByIdAndDelete(userId);
      if (deletedUser) userDeleted = true;
    }

    // MySQL: Usuń użytkownika
    if (databaseType === 'mysql' || databaseType === 'both') {
      const deletedUser = await MySQLUser.destroy({ where: { id: userId } });
      if (deletedUser) userDeleted = true;
    }

    if (userDeleted) {
      res.status(200).json({ message: 'Użytkownik usunięty pomyślnie.' });
    } else {
      res.status(404).json({ error: 'Użytkownik nie znaleziony.' });
    }
  } catch (error) {
    console.error('Błąd usuwania użytkownika:', error);
    res.status(500).json({ error: 'Błąd usuwania użytkownika.' });
  }
});

// Edytuj dane użytkownika
router.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    let userUpdated = false;

    // MongoDB: Edytuj dane użytkownika
    if (databaseType === 'mongo' || databaseType === 'both') {
      const updatedUser = await MongoUser.findByIdAndUpdate(userId, req.body, { new: true });
      if (updatedUser) userUpdated = true;
    }

    // MySQL: Edytuj dane użytkownika
    if (databaseType === 'mysql' || databaseType === 'both') {
      const [updatedRowsCount] = await MySQLUser.update(req.body, { where: { id: userId } });
      if (updatedRowsCount > 0) userUpdated = true;
    }

    if (userUpdated) {
      res.status(200).json({ message: 'Dane użytkownika zaktualizowane pomyślnie.' });
    } else {
      res.status(404).json({ error: 'Użytkownik nie znaleziony.' });
    }
  } catch (error) {
    console.error('Błąd edycji użytkownika:', error);
    res.status(500).json({ error: 'Błąd edycji użytkownika.' });
  }
});

module.exports = router;