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

    // Walidacja danych wejściowych
    if (!name) {
      return res.status(400).json({ error: "Nazwa planu treningowego jest wymagana." });
    }
    if (days && days.length > 0) {
      for (const day of days) {
        if (!day.dayOfWeek || !day.name || typeof day.order !== "number") {
          return res.status(400).json({ error: "Każdy dzień musi zawierać 'dayOfWeek', 'name' i 'order'." });
        }
        if (day.exercises && day.exercises.length > 0) {
          for (const exercise of day.exercises) {
            if (!exercise.exerciseId || !exercise.exerciseName || typeof exercise.order !== "number") {
              return res.status(400).json({ error: "Każde ćwiczenie musi zawierać 'exerciseId', 'exerciseName' i 'order'." });
            }
          }
        }
      }
    }

    // MongoDB
    if (databaseType === 'mongo' || databaseType === 'both') {
      const trainingPlan = new MongoTrainingPlan({
        userId: req.user.id, // Zakładam, że user.id to ObjectId w MongoDB
        name,
        description,
        days: days || [], // Include days if provided
      });
      createdPlanMongo = await trainingPlan.save();
    }

    // MySQL
    if (databaseType === 'mysql' || databaseType === 'both') {
      try {
        // Pierwsze utworzenie planu
        createdPlanMySQL = await MySQLTrainingPlan.create({
          userId: parseInt(req.user.id, 10), // Konwersja userId na INTEGER dla MySQL
          name,
          description,
          dateCreated: new Date(),
          dateUpdated: new Date(),
        });

        // Utworzenie dni i ćwiczeń, jeśli są obecne
        if (days && days.length > 0 && createdPlanMySQL) {
          for (const day of days) {
            const createdDay = await TrainingDay.create({
              planId: createdPlanMySQL.id,
              dayOfWeek: day.dayOfWeek,
              name: day.name,
              order: day.order,
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
                  order: exercise.order,
                  gifUrl: exercise.gifUrl,
                });
              }
            }
          }
        }
      } catch (mysqlError) {
        console.error("Błąd zapisu w MySQL:", mysqlError);
        // Rollback MongoDB jeśli zapis w MySQL się nie powiódł
        if (createdPlanMongo) {
          await MongoTrainingPlan.findByIdAndDelete(createdPlanMongo._id);
        }
        throw mysqlError; // Rzucenie błędu dalej
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
      const mysqlPlans = await MySQLTrainingPlan.findAll({ where: { userId: parseInt(req.user.id, 10) } });
      plans = plans.concat(mysqlPlans);
    }

    // Zwracanie planów (priorytet MongoDB, jeśli `both`)
    res.status(200).json(databaseType === 'both' ? plans.filter(p => p._id) : plans);
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
      // Sprawdzenie, czy id jest ObjectId dla MongoDB
      if (/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
        updatedMongo = await MongoTrainingPlan.findByIdAndUpdate(
          req.params.id,
          { name, description, isActive, days, dateUpdated: new Date() },
          { new: true }
        );
      }
    }

    // MySQL
    if (databaseType === 'mysql' || databaseType === 'both') {
      const mysqlId = parseInt(req.params.id, 10); // Konwertuj id na liczbę całkowitą
      if (!isNaN(mysqlId)) {
        await MySQLTrainingPlan.update(
          { name, description, isActive, dateUpdated: new Date() },
          { where: { id: mysqlId } }
        );

        if (days) {
          await TrainingDay.destroy({ where: { planId: mysqlId } });
          for (const day of days) {
            const createdDay = await TrainingDay.create({
              planId: mysqlId,
              dayOfWeek: day.dayOfWeek,
              name: day.name,
              order: day.order,
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
                  order: exercise.order,
                  gifUrl: exercise.gifUrl,
                });
              }
            }
          }
        }

        updatedMySQL = await MySQLTrainingPlan.findByPk(mysqlId, {
          include: [{ model: TrainingDay, include: [TrainingExercise] }],
        });
      }
    }

    if (updatedMongo || updatedMySQL) {
      res.status(200).json({
        message: 'Plan treningowy został zaktualizowany.',
        plan: updatedMongo || updatedMySQL,
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