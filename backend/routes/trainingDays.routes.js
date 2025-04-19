const express = require('express');
const MongoTrainingPlan = require('../models/mongo/TrainingPlan.model');
const MySQLModels = require('../models/mysql/TrainingPlan.model');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();
const { TrainingDay: MySQLTrainingDay, TrainingExercise } = MySQLModels;

// Pobranie typu bazy danych z .env
const databaseType = process.env.DATABASE_TYPE || 'both';

// Dodanie nowego dnia do planu
router.post('/training-plans/:planId/days', authenticateToken, async (req, res) => {
  const { dayOfWeek, name, order } = req.body;

  try {
    let createdDayMongo = null;
    let createdDayMySQL = null;

    // MongoDB
    if (databaseType === 'mongo' || databaseType === 'both') {
      const plan = await MongoTrainingPlan.findById(req.params.planId);
      if (!plan) return res.status(404).json({ error: 'Plan treningowy nie został znaleziony.' });

      const newDay = {
        dayOfWeek,
        name,
        order,
        exercises: [],
      };
      plan.days.push(newDay);
      createdDayMongo = await plan.save();
    }

    // MySQL
    if (databaseType === 'mysql' || databaseType === 'both') {
      createdDayMySQL = await MySQLTrainingDay.create({
        planId: req.params.planId,
        dayOfWeek,
        name,
        order,
      });
    }

    if (createdDayMongo || createdDayMySQL) {
      res.status(201).json({
        message: 'Dzień treningowy został dodany.',
        day: databaseType === 'both' ? { mongo: createdDayMongo, mysql: createdDayMySQL } : createdDayMongo || createdDayMySQL,
      });
    } else {
      res.status(500).json({ error: 'Nie udało się dodać dnia treningowego.' });
    }
  } catch (error) {
    console.error('Błąd dodawania dnia treningowego:', error);
    res.status(500).json({ error: 'Błąd dodawania dnia treningowego.' });
  }
});

// Aktualizacja dnia treningowego
router.put('/training-days/:id', authenticateToken, async (req, res) => {
  const { dayOfWeek, name, order } = req.body;

  try {
    let updatedDayMongo = null;
    let updatedDayMySQL = null;

    // MongoDB
    if (databaseType === 'mongo' || databaseType === 'both') {
      const plan = await MongoTrainingPlan.findOne({ 'days._id': req.params.id });
      if (!plan) return res.status(404).json({ error: 'Dzień treningowy nie został znaleziony.' });

      const day = plan.days.id(req.params.id);
      if (day) {
        day.dayOfWeek = dayOfWeek;
        day.name = name;
        day.order = order;
        updatedDayMongo = await plan.save();
      }
    }

    // MySQL
    if (databaseType === 'mysql' || databaseType === 'both') {
      updatedDayMySQL = await MySQLTrainingDay.update(
        { dayOfWeek, name, order },
        { where: { id: req.params.id } }
      );
    }

    if (updatedDayMongo || updatedDayMySQL) {
      res.status(200).json({ message: 'Dzień treningowy został zaktualizowany.' });
    } else {
      res.status(404).json({ error: 'Nie znaleziono dnia treningowego do aktualizacji.' });
    }
  } catch (error) {
    console.error('Błąd aktualizacji dnia treningowego:', error);
    res.status(500).json({ error: 'Błąd aktualizacji dnia treningowego.' });
  }
});

// Usuwanie dnia treningowego
router.delete('/training-days/:id', authenticateToken, async (req, res) => {
  try {
    let deletedDayMongo = false;
    let deletedDayMySQL = false;

    // MongoDB
    if (databaseType === 'mongo' || databaseType === 'both') {
      const plan = await MongoTrainingPlan.findOne({ 'days._id': req.params.id });
      if (!plan) return res.status(404).json({ error: 'Dzień treningowy nie został znaleziony.' });

      plan.days.id(req.params.id).remove();
      await plan.save();
      deletedDayMongo = true;
    }

    // MySQL
    if (databaseType === 'mysql' || databaseType === 'both') {
      const deletedRows = await MySQLTrainingDay.destroy({ where: { id: req.params.id } });
      if (deletedRows > 0) deletedDayMySQL = true;
    }

    if (deletedDayMongo || deletedDayMySQL) {
      res.status(200).json({ message: 'Dzień treningowy został usunięty.' });
    } else {
      res.status(404).json({ error: 'Nie znaleziono dnia treningowego do usunięcia.' });
    }
  } catch (error) {
    console.error('Błąd usuwania dnia treningowego:', error);
    res.status(500).json({ error: 'Błąd usuwania dnia treningowego.' });
  }
});

module.exports = router;