const express = require('express');
const MongoTrainingPlan = require('../models/mongo/TrainingPlan.model');
const MySQLModels = require('../models/mysql/TrainingPlan.model');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();
const { TrainingPlan: MySQLTrainingPlan, TrainingDay, TrainingExercise } = MySQLModels;

// Pobranie typu bazy danych z .env
const databaseType = process.env.DATABASE_TYPE || 'both';

// Tworzenie nowego planu treningowego
router.post('/training-plans', authenticateToken, async (req, res) => {
  const { name, description } = req.body;

  try {
    let createdPlanMongo = null;
    let createdPlanMySQL = null;

    // MongoDB
    if (databaseType === 'mongo' || databaseType === 'both') {
      const trainingPlan = new MongoTrainingPlan({
        userId: req.user.id,
        name,
        description,
      });
      createdPlanMongo = await trainingPlan.save();
    }

    // MySQL
    if (databaseType === 'mysql' || databaseType === 'both') {
      createdPlanMySQL = await MySQLTrainingPlan.create({
        userId: req.user.id,
        name,
        description,
        dateCreated: new Date(),
        dateUpdated: new Date(),
      });
    }

    if (createdPlanMongo || createdPlanMySQL) {
      res.status(201).json({
        message: 'Plan treningowy został utworzony.',
        plan: databaseType === 'both' ? { mongo: createdPlanMongo, mysql: createdPlanMySQL } : createdPlanMongo || createdPlanMySQL,
      });
    } else {
      res.status(500).json({ error: 'Nie udało się utworzyć planu treningowego.' });
    }
  } catch (error) {
    console.error('Błąd tworzenia planu treningowego:', error);
    res.status(500).json({ error: 'Błąd tworzenia planu treningowego.' });
  }
});

// Pobieranie wszystkich planów użytkownika
router.get('/training-plans', authenticateToken, async (req, res) => {
  try {
    let plans = [];

    // MongoDB
    if (databaseType === 'mongo' || databaseType === 'both') {
      const mongoPlans = await MongoTrainingPlan.find({ userId: req.user.id });
      plans = plans.concat(mongoPlans);
    }

    // MySQL
    if (databaseType === 'mysql' || databaseType === 'both') {
      const mysqlPlans = await MySQLTrainingPlan.findAll({ where: { userId: req.user.id } });
      plans = plans.concat(mysqlPlans);
    }

    res.status(200).json(plans);
  } catch (error) {
    console.error('Błąd pobierania planów treningowych:', error);
    res.status(500).json({ error: 'Błąd pobierania planów treningowych.' });
  }
});

// Pobieranie szczegółów konkretnego planu
router.get('/training-plans/:id', authenticateToken, async (req, res) => {
  try {
    let plan = null;

    // MongoDB
    if (databaseType === 'mongo' || databaseType === 'both') {
      plan = await MongoTrainingPlan.findById(req.params.id);
    }

    // MySQL
    if (!plan && (databaseType === 'mysql' || databaseType === 'both')) {
      plan = await MySQLTrainingPlan.findByPk(req.params.id, {
        include: [{ model: TrainingDay, include: [TrainingExercise] }],
      });
    }

    if (plan) {
      res.status(200).json(plan);
    } else {
      res.status(404).json({ error: 'Plan treningowy nie został znaleziony.' });
    }
  } catch (error) {
    console.error('Błąd pobierania planu treningowego:', error);
    res.status(500).json({ error: 'Błąd pobierania planu treningowego.' });
  }
});

// Aktualizacja planu treningowego
router.put('/training-plans/:id', authenticateToken, async (req, res) => {
  const { name, description, isActive } = req.body;

  try {
    let updatedMongo = null;
    let updatedMySQL = null;

    // MongoDB
    if (databaseType === 'mongo' || databaseType === 'both') {
      updatedMongo = await MongoTrainingPlan.findByIdAndUpdate(
        req.params.id,
        { name, description, isActive, dateUpdated: new Date() },
        { new: true }
      );
    }

    // MySQL
    if (databaseType === 'mysql' || databaseType === 'both') {
      updatedMySQL = await MySQLTrainingPlan.update(
        { name, description, isActive, dateUpdated: new Date() },
        { where: { id: req.params.id } }
      );
    }

    if (updatedMongo || updatedMySQL) {
      res.status(200).json({ message: 'Plan treningowy został zaktualizowany.' });
    } else {
      res.status(404).json({ error: 'Nie znaleziono planu treningowego do aktualizacji.' });
    }
  } catch (error) {
    console.error('Błąd aktualizacji planu treningowego:', error);
    res.status(500).json({ error: 'Błąd aktualizacji planu treningowego.' });
  }
});

// Usuwanie planu treningowego
router.delete('/training-plans/:id', authenticateToken, async (req, res) => {
  try {
    let deletedMongo = false;
    let deletedMySQL = false;

    // MongoDB
    if (databaseType === 'mongo' || databaseType === 'both') {
      const deletedPlan = await MongoTrainingPlan.findByIdAndDelete(req.params.id);
      if (deletedPlan) deletedMongo = true;
    }

    // MySQL
    if (databaseType === 'mysql' || databaseType === 'both') {
      const deletedRows = await MySQLTrainingPlan.destroy({ where: { id: req.params.id } });
      if (deletedRows > 0) deletedMySQL = true;
    }

    if (deletedMongo || deletedMySQL) {
      res.status(200).json({ message: 'Plan treningowy został usunięty.' });
    } else {
      res.status(404).json({ error: 'Nie znaleziono planu treningowego do usunięcia.' });
    }
  } catch (error) {
    console.error('Błąd usuwania planu treningowego:', error);
    res.status(500).json({ error: 'Błąd usuwania planu treningowego.' });
  }
});

module.exports = router;