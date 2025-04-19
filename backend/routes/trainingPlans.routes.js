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
  const { name, description, days } = req.body;

  try {
    let createdPlanMongo = null;
    let createdPlanMySQL = null;

    // MongoDB
    if (databaseType === 'mongo' || databaseType === 'both') {
      const trainingPlan = new MongoTrainingPlan({
        userId: req.user.id,
        name,
        description,
        days: days || [], // Include days if provided
      });
      createdPlanMongo = await trainingPlan.save();
    }

    // MySQL
    if (databaseType === 'mysql' || databaseType === 'both') {
      // First create the plan
      createdPlanMySQL = await MySQLTrainingPlan.create({
        userId: req.user.id,
        name,
        description,
        dateCreated: new Date(),
        dateUpdated: new Date(),
      });
      
      // Then create days and exercises if present
      if (days && days.length > 0 && createdPlanMySQL) {
        for (const day of days) {
          const createdDay = await TrainingDay.create({
            planId: createdPlanMySQL.id,
            dayOfWeek: day.dayOfWeek,
            name: day.name,
            order: day.order
          });
          
          if (day.exercises && day.exercises.length > 0) {
            for (const exercise of day.exercises) {
              await TrainingExercise.create({
                dayId: createdDay.id,
                exerciseId: exercise.exerciseId,
                exerciseName: exercise.exerciseName,
                sets: exercise.sets,
                reps: exercise.reps,
                weight: exercise.weight,
                restTime: exercise.restTime,
                order: exercise.order
              });
            }
          }
        }
        
        // Fetch the complete plan with days and exercises
        createdPlanMySQL = await MySQLTrainingPlan.findByPk(createdPlanMySQL.id, {
          include: [{ model: TrainingDay, include: [TrainingExercise] }],
        });
      }
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
  const { name, description, isActive, days } = req.body;

  try {
    let updatedMongo = null;
    let updatedMySQL = null;

    // MongoDB
    if (databaseType === 'mongo' || databaseType === 'both') {
      updatedMongo = await MongoTrainingPlan.findByIdAndUpdate(
        req.params.id,
        { name, description, isActive, days, dateUpdated: new Date() },
        { new: true }
      );
    }

    // MySQL - more complex as we need to handle relationships
    if (databaseType === 'mysql' || databaseType === 'both') {
      // First update the basic plan info
      await MySQLTrainingPlan.update(
        { name, description, isActive, dateUpdated: new Date() },
        { where: { id: req.params.id } }
      );
      
      // For MySQL, handle days and exercises updates
      if (days) {
        // Get existing days to compare/update
        const existingDays = await TrainingDay.findAll({
          where: { planId: req.params.id },
          include: [TrainingExercise]
        });
        
        // Efficient way to handle days: delete all and recreate
        // For a production app, you might want a more sophisticated comparison
        await TrainingDay.destroy({ where: { planId: req.params.id } });
        
        // Create new days and exercises
        for (const day of days) {
          const createdDay = await TrainingDay.create({
            planId: req.params.id,
            dayOfWeek: day.dayOfWeek,
            name: day.name,
            order: day.order
          });
          
          if (day.exercises && day.exercises.length > 0) {
            for (const exercise of day.exercises) {
              await TrainingExercise.create({
                dayId: createdDay.id,
                exerciseId: exercise.exerciseId,
                exerciseName: exercise.exerciseName,
                sets: exercise.sets,
                reps: exercise.reps,
                weight: exercise.weight,
                restTime: exercise.restTime,
                order: exercise.order
              });
            }
          }
        }
      }
      
      // Fetch the updated plan
      updatedMySQL = await MySQLTrainingPlan.findByPk(req.params.id, {
        include: [{ model: TrainingDay, include: [TrainingExercise] }],
      });
    }

    if (updatedMongo || updatedMySQL) {
      res.status(200).json({ 
        message: 'Plan treningowy został zaktualizowany.',
        plan: updatedMongo || updatedMySQL
      });
    } else {
      res.status(404).json({ error: 'Nie znaleziono planu treningowego do aktualizacji.' });
    }
  } catch (error) {
    console.error('Błąd aktualizacji planu treningowego:', error);
    res.status(500).json({ error: 'Błąd aktualizacji planu treningowego.' });
  }
});

module.exports = router;