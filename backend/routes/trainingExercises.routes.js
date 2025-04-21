const express = require('express');
const MongoTrainingPlan = require('../models/mongo/TrainingPlan.model');
const MySQLModels = require('../models/mysql/TrainingPlan.model');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();
const { TrainingExercise: MySQLTrainingExercise, TrainingDay: MySQLTrainingDay } = MySQLModels;

// Pobranie typu bazy danych z .env
const databaseType = process.env.DATABASE_TYPE || 'both';

// Dodanie nowego ćwiczenia do dnia treningowego
router.post('/training-days/:dayId/exercises', authenticateToken, async (req, res) => {
  const { exerciseId, exerciseName, sets, reps, weight, restTime, order, gifUrl, bodyPart, equipment, target } = req.body;
  const { mongoDayId } = req.query; // Dodanie opcjonalnego ID MongoDB

  try {
    let createdExerciseMongo = null;
    let createdExerciseMySQL = null;
    let newExerciseMongoId = null;
    let newExerciseMySQLId = null;

    // MongoDB
    if ((databaseType === 'mongo' || databaseType === 'both') && (mongoDayId || /^[0-9a-fA-F]{24}$/.test(req.params.dayId))) {
      const mongoIdToUse = mongoDayId || req.params.dayId;
      const plan = await MongoTrainingPlan.findOne({ 'days._id': mongoIdToUse });
      if (!plan) return res.status(404).json({ error: 'Dzień treningowy nie został znaleziony w MongoDB.' });

      const day = plan.days.id(mongoIdToUse);
      if (day) {
        const newExercise = { exerciseId, exerciseName, sets, reps, weight, restTime, order, gifUrl, bodyPart, equipment, target };
        day.exercises.push(newExercise);
        await plan.save();
        
        // Znajdź dodane ćwiczenie
        newExerciseMongoId = day.exercises[day.exercises.length - 1]._id;
        createdExerciseMongo = day.exercises[day.exercises.length - 1];
      }
    }

    // MySQL
    if (databaseType === 'mysql' || databaseType === 'both') {
      const mysqlDayId = parseInt(req.params.dayId, 10);
      if (!isNaN(mysqlDayId)) {
        const day = await MySQLTrainingDay.findByPk(mysqlDayId);
        if (!day) return res.status(404).json({ error: 'Dzień treningowy nie został znaleziony w MySQL.' });

        createdExerciseMySQL = await MySQLTrainingExercise.create({
          dayId: mysqlDayId,
          exerciseId,
          exerciseName,
          sets,
          reps,
          weight,
          restTime,
          order,
          gifUrl,
          bodyPart,
          equipment,
          target,
        });

        newExerciseMySQLId = createdExerciseMySQL.id;
      }
    }

    if (createdExerciseMongo || createdExerciseMySQL) {
      const responseData = {
        message: 'Ćwiczenie zostało dodane.',
        exercise: {
          mongoId: newExerciseMongoId,
          mysqlId: newExerciseMySQLId,
          exerciseId,
          exerciseName,
          sets,
          reps,
          weight,
          restTime,
          order,
          gifUrl,
          bodyPart,
          equipment,
          target,
        }
      };
      
      res.status(201).json(responseData);
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
  const { exerciseId, exerciseName, sets, reps, weight, restTime, order, gifUrl, bodyPart, equipment, target, mongoId, mysqlId } = req.body;
  const exerciseParamId = req.params.id;

  try {
    let updatedExerciseMongo = null;
    let updatedExerciseMySQL = null;
    let updateSuccess = false;

    // MongoDB
    if ((databaseType === 'mongo' || databaseType === 'both') && (mongoId || /^[0-9a-fA-F]{24}$/.test(exerciseParamId))) {
      const mongoIdToUse = mongoId || exerciseParamId;
      const plan = await MongoTrainingPlan.findOne({ 'days.exercises._id': mongoIdToUse });
      if (plan) {
        let exerciseFound = false;

        // Znajdź ćwiczenie w zagnieżdżonych dniach
        for (const day of plan.days) {
          const exercise = day.exercises.id(mongoIdToUse);
          if (exercise) {
            if (exerciseId) exercise.exerciseId = exerciseId;
            if (exerciseName) exercise.exerciseName = exerciseName;
            if (sets !== undefined) exercise.sets = sets;
            if (reps !== undefined) exercise.reps = reps;
            if (weight !== undefined) exercise.weight = weight;
            if (restTime !== undefined) exercise.restTime = restTime;
            if (order !== undefined) exercise.order = order;
            if (gifUrl !== undefined) exercise.gifUrl = gifUrl;
            if (bodyPart !== undefined) exercise.bodyPart = bodyPart;
            if (equipment !== undefined) exercise.equipment = equipment;
            if (target !== undefined) exercise.target = target;

            exerciseFound = true;
            updatedExerciseMongo = exercise;
            break;
          }
        }

        if (exerciseFound) {
          await plan.save();
          updateSuccess = true;
        }
      }
    }

    // MySQL
    if ((databaseType === 'mysql' || databaseType === 'both') && (mysqlId || !isNaN(parseInt(exerciseParamId, 10)))) {
      const mysqlIdToUse = mysqlId || parseInt(exerciseParamId, 10);

      const updateData = {};
      if (exerciseId) updateData.exerciseId = exerciseId;
      if (exerciseName) updateData.exerciseName = exerciseName;
      if (sets !== undefined) updateData.sets = sets;
      if (reps !== undefined) updateData.reps = reps;
      if (weight !== undefined) updateData.weight = weight;
      if (restTime !== undefined) updateData.restTime = restTime;
      if (order !== undefined) updateData.order = order;
      if (gifUrl !== undefined) updateData.gifUrl = gifUrl;
      if (bodyPart !== undefined) updateData.bodyPart = bodyPart;
      if (equipment !== undefined) updateData.equipment = equipment;
      if (target !== undefined) updateData.target = target;

      const [updatedRows] = await MySQLTrainingExercise.update(updateData, { where: { id: mysqlIdToUse } });

      if (updatedRows > 0) {
        updatedExerciseMySQL = await MySQLTrainingExercise.findByPk(mysqlIdToUse);
        updateSuccess = true;
      }
    }

    if (updateSuccess) {
      const responseData = {
        message: 'Ćwiczenie zostało zaktualizowane.',
        exercise: {
          mongoId: updatedExerciseMongo ? updatedExerciseMongo._id : null,
          mysqlId: updatedExerciseMySQL ? updatedExerciseMySQL.id : null,
          exerciseId: updatedExerciseMongo?.exerciseId || updatedExerciseMySQL?.exerciseId,
          exerciseName: updatedExerciseMongo?.exerciseName || updatedExerciseMySQL?.exerciseName,
          sets: updatedExerciseMongo?.sets || updatedExerciseMySQL?.sets,
          reps: updatedExerciseMongo?.reps || updatedExerciseMySQL?.reps,
          weight: updatedExerciseMongo?.weight || updatedExerciseMySQL?.weight,
          restTime: updatedExerciseMongo?.restTime || updatedExerciseMySQL?.restTime,
          order: updatedExerciseMongo?.order || updatedExerciseMySQL?.order,
          gifUrl: updatedExerciseMongo?.gifUrl || updatedExerciseMySQL?.gifUrl,
          bodyPart: updatedExerciseMongo?.bodyPart || updatedExerciseMySQL?.bodyPart,
          equipment: updatedExerciseMongo?.equipment || updatedExerciseMySQL?.equipment,
          target: updatedExerciseMongo?.target || updatedExerciseMySQL?.target,
        }
      };

      res.status(200).json(responseData);
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
  const exerciseId = req.params.id;
  const { mongoId, mysqlId } = req.query; // Dodane query params dla jednoznacznej identyfikacji

  try {
    let deletedExerciseMongo = false;
    let deletedExerciseMySQL = false;

    // MongoDB
    if ((databaseType === 'mongo' || databaseType === 'both') && (mongoId || /^[0-9a-fA-F]{24}$/.test(exerciseId))) {
      const mongoIdToUse = mongoId || exerciseId;
      const plan = await MongoTrainingPlan.findOne({ 'days.exercises._id': mongoIdToUse });
      if (plan) {
        let exerciseRemoved = false;
        
        // Znajdź i usuń ćwiczenie w zagnieżdżonych dniach
        for (const day of plan.days) {
          const exercise = day.exercises.id(mongoIdToUse);
          if (exercise) {
            exercise.remove();
            exerciseRemoved = true;
            break;
          }
        }
        
        if (exerciseRemoved) {
          await plan.save();
          deletedExerciseMongo = true;
        }
      }
    }

    // MySQL
    if ((databaseType === 'mysql' || databaseType === 'both') && (mysqlId || !isNaN(parseInt(exerciseId, 10)))) {
      const mysqlIdToUse = mysqlId || parseInt(exerciseId, 10);
      const deletedRows = await MySQLTrainingExercise.destroy({ where: { id: mysqlIdToUse } });
      if (deletedRows > 0) deletedExerciseMySQL = true;
    }

    if (deletedExerciseMongo || deletedExerciseMySQL) {
      res.status(200).json({ 
        message: 'Ćwiczenie zostało usunięte.',
        deleted: {
          mongo: deletedExerciseMongo,
          mysql: deletedExerciseMySQL
        }
      });
    } else {
      res.status(404).json({ error: 'Nie znaleziono ćwiczenia do usunięcia.' });
    }
  } catch (error) {
    console.error('Błąd usuwania ćwiczenia:', error);
    res.status(500).json({ error: 'Błąd usuwania ćwiczenia.' });
  }
});

module.exports = router;