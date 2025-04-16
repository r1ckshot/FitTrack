const express = require('express');
const MongoUser = require('../models/mongo/user.model'); // Model MongoDB
const MySQLUser = require('../models/mysql/user.model'); // Model MySQL

const router = express.Router();

// MongoDB: Pobierz wszystkich użytkowników
router.get('/mongo/users', async (req, res) => {
  try {
    const users = await MongoUser.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania użytkowników z MongoDB.' });
  }
});

// MySQL: Pobierz wszystkich użytkowników
router.get('/mysql/users', async (req, res) => {
  try {
    const users = await MySQLUser.findAll();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Błąd pobierania użytkowników z MySQL.' });
  }
});

// MongoDB: Pobierz użytkownika po ID
router.get('/mongo/users/:id', async (req, res) => {
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
router.get('/mysql/users/:id', async (req, res) => {
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
router.post('/mongo/users', async (req, res) => {
  try {
    const newUser = new MongoUser(req.body);
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    res.status(500).json({ error: 'Błąd dodawania użytkownika do MongoDB.' });
  }
});

// MySQL: Dodaj nowego użytkownika
router.post('/mysql/users', async (req, res) => {
  try {
    const newUser = await MySQLUser.create(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Błąd dodawania użytkownika do MySQL.' });
  }
});

// MongoDB: Usuń użytkownika po ID
router.delete('/mongo/users/:id', async (req, res) => {
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
router.delete('/mysql/users/:id', async (req, res) => {
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

module.exports = router;