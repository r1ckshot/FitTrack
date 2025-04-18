const express = require('express');
const MongoProgress = require('../models/mongo/progress.model');
const MySQLProgress = require('../models/mysql/progress.model');
const MongoUser = require('../models/mongo/user.model');
const MySQLUser = require('../models/mysql/user.model');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();

// Pobranie typu bazy danych z .env
const databaseType = process.env.DATABASE_TYPE || 'both';

// Dodaj nowe dane postępów
router.post('/progress', authenticateToken, async (req, res) => {
  const { weight, trainingTime, date } = req.body;

  try {
    console.log('Użytkownik:', req.user);
    console.log('Dane do zapisania:', { weight, trainingTime, date });

    let progressCreatedMongo = false;
    let progressCreatedMySQL = false;

    // MongoDB
    if (databaseType === 'mongo' || databaseType === 'both') {
      const progress = new MongoProgress({
        userId: req.user.id,
        weight,
        trainingTime,
        date,
      });
      await progress.save();

      // Aktualizacja wagi w profilu MongoDB
      await MongoUser.findByIdAndUpdate(req.user.id, { weight });

      progressCreatedMongo = true;
    }

    // MySQL
    if (databaseType === 'mysql' || databaseType === 'both') {
      const mysqlUser = await MySQLUser.findOne({ where: { username: req.user.username } });
      if (!mysqlUser) {
        return res.status(404).json({ error: 'Użytkownik nie istnieje w bazie MySQL' });
      }

      await MySQLProgress.create({
        userId: mysqlUser.id, // ID użytkownika w MySQL
        weight,
        trainingTime,
        date,
      });

      // Aktualizacja wagi w profilu MySQL
      await MySQLUser.update({ weight }, { where: { id: mysqlUser.id } });

      progressCreatedMySQL = true;
    }

    if (progressCreatedMongo || progressCreatedMySQL) {
      res.status(201).json({ message: 'Postępy zostały zapisane.' });
    } else {
      res.status(500).json({ error: 'Nie udało się zapisać postępów.' });
    }
  } catch (error) {
    console.error('Błąd zapisu postępów:', error);
    res.status(500).json({ error: 'Błąd zapisu postępów.' });
  }
});

// Pobierz wszystkie dane postępów
router.get('/progress', authenticateToken, async (req, res) => {
    try {
      let progress = [];
  
      // MongoDB
      if (databaseType === 'mongo' || databaseType === 'both') {
        const mongoProgress = await MongoProgress.find({ userId: req.user.id }).sort({ date: 1 }); // Sortowanie rosnące po dacie
        progress = progress.concat(mongoProgress);
      }
  
      // MySQL (tylko jeśli nie korzystamy wyłącznie z MongoDB)
      if (databaseType === 'mysql' && databaseType !== 'mongo') {
        const mysqlUser = await MySQLUser.findOne({ where: { username: req.user.username } });
        if (mysqlUser) {
          const mysqlProgress = await MySQLProgress.findAll({
            where: { userId: mysqlUser.id },
            order: [['date', 'ASC']], // Sortowanie rosnące po dacie
          });
          progress = progress.concat(mysqlProgress);
        }
      }
  
      // Zwróć dane posortowane
      res.status(200).json(progress);
    } catch (error) {
      console.error('Błąd pobierania postępów:', error);
      res.status(500).json({ error: 'Błąd pobierania postępów.' });
    }
  });

// Edytuj dane postępów
router.put('/progress/:id', authenticateToken, async (req, res) => {
  const { weight, trainingTime, date } = req.body;

  try {
    let progressUpdatedMongo = false;
    let progressUpdatedMySQL = false;

    // MongoDB
    if (databaseType === 'mongo' || databaseType === 'both') {
      const updatedProgress = await MongoProgress.findByIdAndUpdate(req.params.id, {
        weight,
        trainingTime,
        date,
      }, { new: true });

      if (updatedProgress) progressUpdatedMongo = true;

      // Znajdź odpowiadający rekord w MySQL na podstawie userId i ID MongoDB
      if (databaseType === 'both') {
        const mysqlUser = await MySQLUser.findOne({ where: { username: req.user.username } });
        if (mysqlUser) {
          const [updatedRows] = await MySQLProgress.update({
            weight,
            trainingTime,
            date,
          }, { where: { userId: mysqlUser.id } });

          if (updatedRows > 0) progressUpdatedMySQL = true;
        }
      }
    }

    // MySQL - tylko jeśli korzystamy wyłącznie z MySQL
    if (databaseType === 'mysql') {
      const [updatedRows] = await MySQLProgress.update({
        weight,
        trainingTime,
        date,
      }, { where: { id: req.params.id } });

      if (updatedRows > 0) progressUpdatedMySQL = true;
    }

    if (progressUpdatedMongo || progressUpdatedMySQL) {
      res.status(200).json({ message: 'Postępy zostały zaktualizowane.' });
    } else {
      res.status(404).json({ error: 'Nie znaleziono postępów do zaktualizowania.' });
    }
  } catch (error) {
    console.error('Błąd aktualizacji postępów:', error);
    res.status(500).json({ error: 'Błąd aktualizacji postępów.' });
  }
});

// Usuń dane postępów
router.delete('/progress/:id', authenticateToken, async (req, res) => {
  try {
    let progressDeletedMongo = false;
    let progressDeletedMySQL = false;

    // MongoDB
    if (databaseType === 'mongo' || databaseType === 'both') {
      const deletedProgress = await MongoProgress.findByIdAndDelete(req.params.id);
      if (deletedProgress) progressDeletedMongo = true;

      // Znajdź odpowiadający rekord w MySQL na podstawie userId i ID MongoDB
      if (databaseType === 'both') {
        const mysqlUser = await MySQLUser.findOne({ where: { username: req.user.username } });
        if (mysqlUser) {
          const deletedRows = await MySQLProgress.destroy({ where: { userId: mysqlUser.id } });
          if (deletedRows > 0) progressDeletedMySQL = true;
        }
      }
    }

    // MySQL - tylko jeśli korzystamy wyłącznie z MySQL
    if (databaseType === 'mysql') {
      const deletedRows = await MySQLProgress.destroy({ where: { id: req.params.id } });
      if (deletedRows > 0) progressDeletedMySQL = true;
    }

    if (progressDeletedMongo || progressDeletedMySQL) {
      res.status(200).json({ message: 'Postępy zostały usunięte.' });
    } else {
      res.status(404).json({ error: 'Nie znaleziono postępów do usunięcia.' });
    }
  } catch (error) {
    console.error('Błąd usuwania postępów:', error);
    res.status(500).json({ error: 'Błąd usuwania postępów.' });
  }
});

module.exports = router;