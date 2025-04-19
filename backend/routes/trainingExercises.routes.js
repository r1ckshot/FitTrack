const express = require('express');
const MongoTrainingPlan = require('../models/mongo/TrainingPlan.model');
const MySQLModels = require('../models/mysql/TrainingPlan.model');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();
const { TrainingExercise: MySQLTrainingExercise } = MySQLModels;

// Pobranie typu bazy danych z .env
const databaseType = process.env.DATABASE_TYPE || 'both';

// Dodanie nowego ćwiczenia do dnia treningowego
router.post('/training-days/:dayId/exercises', authenticateToken, async (req, res) => {
  const { exerciseId, exerciseName, sets, reps, weight, restTime, order, gifUrl } = req.body;

  try {
    let createdExerciseMongo = null;
    let createdExerciseMySQL = null;

    // MongoDB
    if (databaseType === 'mongo' || databaseType === 'both') {
      const plan = await MongoTrainingPlan.findOne({ 'days._id': req.params.dayId });
      if (!plan) return res.status(404).json({ error: 'Dzień treningowy nie został znaleziony.' });

      const day = plan.days.id(req.params.dayId);
      if (day) {
        const newExercise = { exerciseId, exerciseName, sets, reps, weight, restTime, order, gifUrl };
        day.exercises.push(newExercise);
        createdExerciseMongo = await plan.save();
      }
    }

    // MySQL
    if (databaseType === 'mysql' || databaseType === 'both') {
      createdExerciseMySQL = await MySQLTrainingExercise.create({
        dayId: req.params.dayId,
        exerciseId,
        exerciseName,
        sets,
        reps,
        weight,
        restTime,
        order,
        gifUrl, // Dodanie obsługi gifUrl
      });
    }

    if (createdExerciseMongo || createdExerciseMySQL) {
      res.status(201).json({ message: 'Ćwiczenie zostało dodane.', exercise: createdExerciseMongo || createdExerciseMySQL });
    } else {
      res.status(500).json({ error: 'Nie udało się dodać ćwiczenia.' });
    }
  } catch (error) {
    console.error('Błąd dodawania ćwiczenia:', error);
    res.status(500).json({ error: 'Błąd dodawania ćwiczenia.' });
  }
});

// Aktualizacja ćwiczenia
router.put('/training-exercises/:id', authenticateToken, async (req, res) => {
  const { sets, reps, weight, restTime, order, gifUrl } = req.body;

  try {
    let updatedExerciseMongo = null;
    let updatedExerciseMySQL = null;

    // MongoDB
    if (databaseType === 'mongo' || databaseType === 'both') {
      const plan = await MongoTrainingPlan.findOne({ 'days.exercises._id': req.params.id });
      if (!plan) return res.status(404).json({ error: 'Ćwiczenie nie zostało znalezione.' });

      const exercise = plan.days.reduce((acc, day) => acc || day.exercises.id(req.params.id), null);
      if (exercise) {
        exercise.sets = sets;
        exercise.reps = reps;
        exercise.weight = weight;
        exercise.restTime = restTime;
        exercise.order = order;
        exercise.gifUrl = gifUrl; // Aktualizacja gifUrl
        updatedExerciseMongo = await plan.save();
      }
    }

    // MySQL
    if (databaseType === 'mysql' || databaseType === 'both') {
      updatedExerciseMySQL = await MySQLTrainingExercise.update(
        { sets, reps, weight, restTime, order, gifUrl }, // Dodanie gifUrl
        { where: { id: req.params.id } }
      );
    }

    if (updatedExerciseMongo || updatedExerciseMySQL) {
      res.status(200).json({ message: 'Ćwiczenie zostało zaktualizowane.' });
    } else {
      res.status(404).json({ error: 'Nie znaleziono ćwiczenia do aktualizacji.' });
    }
  } catch (error) {
    console.error('Błąd aktualizacji ćwiczenia:', error);
    res.status(500).json({ error: 'Błąd aktualizacji ćwiczenia.' });
  }
});

// Usuwanie ćwiczenia
router.delete('/training-exercises/:id', authenticateToken, async (req, res) => {
  try {
    let deletedExerciseMongo = false;
    let deletedExerciseMySQL = false;

    // MongoDB
    if (databaseType === 'mongo' || databaseType === 'both') {
      const plan = await MongoTrainingPlan.findOne({ 'days.exercises._id': req.params.id });
      if (!plan) return res.status(404).json({ error: 'Ćwiczenie nie zostało znalezione.' });

      const day = plan.days.find((d) => d.exercises.id(req.params.id));
      if (day) {
        day.exercises.id(req.params.id).remove();
        await plan.save();
        deletedExerciseMongo = true;
      }
    }

    // MySQL
    if (databaseType === 'mysql' || databaseType === 'both') {
      const deletedRows = await MySQLTrainingExercise.destroy({ where: { id: req.params.id } });
      if (deletedRows > 0) deletedExerciseMySQL = true;
    }

    if (deletedExerciseMongo || deletedExerciseMySQL) {
      res.status(200).json({ message: 'Ćwiczenie zostało usunięte.' });
    } else {
      res.status(404).json({ error: 'Nie znaleziono ćwiczenia do usunięcia.' });
    }
  } catch (error) {
    console.error('Błąd usuwania ćwiczenia:', error);
    res.status(500).json({ error: 'Błąd usuwania ćwiczenia.' });
  }
});

module.exports = router;