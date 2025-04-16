const express = require('express');
const MongoUser = require('../models/mongo/user.model'); // Model MongoDB
const MySQLUser = require('../models/mysql/user.model'); // Model MySQL
const { authenticateToken, authorizeRole } = require('../middlewares/auth.middleware');

const router = express.Router();

// MongoDB: Filtrowanie użytkowników według roli
router.get('/mongo/users', authenticateToken, async (req, res) => {
  try {
    const { role } = req.query; // Pobierz rolę z parametrów zapytania, np. ?role=trainer
    let filter = {};

    // Admin może przeglądać wszystkich lub filtrować według roli
    if (req.user.role === 'admin') {
      if (role) {
        filter.role = role; // Filtruj według roli, jeśli podano
      }
    } else if (req.user.role === 'trainer') {
      filter.role = 'client'; // Trener może widzieć tylko klientów
    } else if (req.user.role === 'client') {
      filter.role = 'trainer'; // Klient może widzieć tylko trenerów
    } else {
      return res.status(403).json({ error: 'Brak uprawnień do przeglądania użytkowników.' });
    }

    const users = await MongoUser.find(filter);
    res.status(200).json(users);
  } catch (error) {
    console.error('Błąd filtrowania użytkowników w MongoDB:', error);
    res.status(500).json({ error: 'Błąd filtrowania użytkowników.' });
  }
});

// MySQL: Filtrowanie użytkowników według roli
router.get('/mysql/users', authenticateToken, async (req, res) => {
  try {
    const { role } = req.query; // Pobierz rolę z parametrów zapytania, np. ?role=trainer
    let whereClause = {};

    // Admin może przeglądać wszystkich lub filtrować według roli
    if (req.user.role === 'admin') {
      if (role) {
        whereClause.role = role; // Filtruj według roli, jeśli podano
      }
    } else if (req.user.role === 'trainer') {
      whereClause.role = 'client'; // Trener może widzieć tylko klientów
    } else if (req.user.role === 'client') {
      whereClause.role = 'trainer'; // Klient może widzieć tylko trenerów
    } else {
      return res.status(403).json({ error: 'Brak uprawnień do przeglądania użytkowników.' });
    }

    const users = await MySQLUser.findAll({ where: whereClause });
    res.status(200).json(users);
  } catch (error) {
    console.error('Błąd filtrowania użytkowników w MySQL:', error);
    res.status(500).json({ error: 'Błąd filtrowania użytkowników.' });
  }
});

// MongoDB: Pobierz użytkownika po ID
router.get('/mongo/users/:id', authenticateToken, async (req, res) => {
  try {
    const user = await MongoUser.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony w MongoDB.' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania użytkownika z MongoDB.' });
  }
});

// MySQL: Pobierz użytkownika po ID
router.get('/mysql/users/:id', authenticateToken, async (req, res) => {
  try {
    const user = await MySQLUser.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony w MySQL.' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania użytkownika z MySQL.' });
  }
});

// MongoDB: Dodaj nowego użytkownika
router.post('/mongo/users', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const newUser = new MongoUser(req.body);
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(500).json({ error: 'Błąd dodawania użytkownika do MongoDB.' });
  }
});

// MySQL: Dodaj nowego użytkownika
router.post('/mysql/users', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const newUser = await MySQLUser.create(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Błąd dodawania użytkownika do MySQL.' });
  }
});

// MongoDB: Usuń użytkownika po ID
router.delete('/mongo/users/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const deletedUser = await MongoUser.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony w MongoDB.' });
    }
    res.status(200).json({ message: 'Użytkownik usunięty z MongoDB.' });
  } catch (error) {
    res.status(500).json({ error: 'Błąd usuwania użytkownika z MongoDB.' });
  }
});

// MySQL: Usuń użytkownika po ID
router.delete('/mysql/users/:id', authenticateToken, authorizeRole(['admin']), async (req, res) => {
  try {
    const deletedUser = await MySQLUser.destroy({ where: { id: req.params.id } });
    if (!deletedUser) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony w MySQL.' });
    }
    res.status(200).json({ message: 'Użytkownik usunięty z MySQL.' });
  } catch (error) {
    res.status(500).json({ error: 'Błąd usuwania użytkownika z MySQL.' });
  }
});

// MongoDB: Edytuj dane użytkownika
router.put('/mongo/users/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;

    // Upewnij się, że użytkownik edytuje swoje dane lub ma rolę admina
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień do edytowania tego użytkownika.' });
    }

    const updatedUser = await MongoUser.findByIdAndUpdate(userId, req.body, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony w MongoDB.' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Błąd edycji użytkownika w MongoDB:', error);
    res.status(500).json({ error: 'Błąd edycji użytkownika.' });
  }
});

// MySQL: Edytuj dane użytkownika
router.put('/mysql/users/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;

    // Upewnij się, że użytkownik edytuje swoje dane lub ma rolę admina
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Brak uprawnień do edytowania tego użytkownika.' });
    }

    const [updatedRowsCount] = await MySQLUser.update(req.body, { where: { id: userId } });
    if (updatedRowsCount === 0) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony w MySQL.' });
    }

    const updatedUser = await MySQLUser.findByPk(userId);
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Błąd edycji użytkownika w MySQL:', error);
    res.status(500).json({ error: 'Błąd edycji użytkownika.' });
  }
});

module.exports = router;