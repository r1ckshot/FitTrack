const express = require('express');
const MongoTrainingPlan = require('../models/mongo/TrainingPlan.model');
const MySQLModels = require('../models/mysql/TrainingPlan.model');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();
const { TrainingPlan: MySQLTrainingPlan, TrainingDay, TrainingExercise } = MySQLModels;

// Pobranie typu bazy danych z .env
const databaseType = process.env.DATABASE_TYPE || 'both';

// Funkcja pomocnicza do poprawnego mapowania ID użytkownika
function getMySQLUserId(user) {
  if (user.mysqlId) return user.mysqlId;
  if (user.sqlId) return user.sqlId;
  if (user.numericId) return user.numericId;
  return 1; // Domyślne ID
}

// Tworzenie nowego planu treningowego
router.post('/training-plans', authenticateToken, async (req, res) => {
  const { name, description, days, isActive = true } = req.body;

  try {
    let createdPlanMongo = null;
    let createdPlanMySQL = null;
    let mysqlPlanId = null;

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

    // Poprawne ID użytkownika dla MySQL
    const mysqlUserId = getMySQLUserId(req.user);

    // MongoDB - transakcja
    if (databaseType === 'mongo' || databaseType === 'both') {
      const trainingPlan = new MongoTrainingPlan({
        userId: req.user.id,
        name,
        description,
        days: days || [],
        isActive: isActive,
        dateCreated: new Date(),
        dateUpdated: new Date()
      });
      createdPlanMongo = await trainingPlan.save();
    }

    // MySQL - transakcja
    if (databaseType === 'mysql' || databaseType === 'both') {
      try {
        // Tworzenie planu
        createdPlanMySQL = await MySQLTrainingPlan.create({
          userId: mysqlUserId,
          name,
          description,
          isActive: isActive,
          dateCreated: new Date(),
          dateUpdated: new Date(),
        });

        mysqlPlanId = createdPlanMySQL.id;

        // Tworzenie dni i ćwiczeń
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
                  sets: exercise.sets || 0,
                  reps: exercise.reps || 0,
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
        if (createdPlanMongo && databaseType === 'both') {
          await MongoTrainingPlan.findByIdAndDelete(createdPlanMongo._id);
          createdPlanMongo = null;
        }
        throw mysqlError;
      }
    }

    // Odpowiedź
    if (databaseType === 'both' && createdPlanMongo) {
      // Wzbogacamy dane z MongoDB o ID z MySQL
      const responseData = {
        ...createdPlanMongo.toObject(),
        mysqlId: mysqlPlanId
      };
      
      res.status(201).json({
        message: 'Plan treningowy został utworzony w obu bazach danych.',
        plan: responseData
      });
    } else if (createdPlanMongo || createdPlanMySQL) {
      res.status(201).json({
        message: 'Plan treningowy został utworzony.',
        plan: createdPlanMongo || createdPlanMySQL,
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
    const mysqlUserId = getMySQLUserId(req.user);

    if (databaseType === 'both') {
      const mongoPlans = await MongoTrainingPlan.find({ userId: req.user.id });
      const mysqlPlans = await MySQLTrainingPlan.findAll({ 
        where: { userId: mysqlUserId },
        include: [{ model: TrainingDay, include: [TrainingExercise] }]
      });

      const enrichedPlans = mongoPlans.map(mongoPlan => {
        const matchingMySQLPlan = mysqlPlans.find(mysqlPlan => mysqlPlan.name === mongoPlan.name);
        return {
          ...mongoPlan.toObject(),
          mysqlId: matchingMySQLPlan ? matchingMySQLPlan.id : null,
        };
      });

      return res.status(200).json(enrichedPlans);
    } else if (databaseType === 'mongo') {
      const plans = await MongoTrainingPlan.find({ userId: req.user.id });
      return res.status(200).json(plans);
    } else if (databaseType === 'mysql') {
      const plans = await MySQLTrainingPlan.findAll({ 
        where: { userId: mysqlUserId },
        include: [{ model: TrainingDay, include: [TrainingExercise] }]
      });
      return res.status(200).json(plans);
    }

    res.status(200).json([]);
  } catch (error) {
    console.error('Błąd pobierania planów treningowych:', error);
    res.status(500).json({ error: 'Błąd pobierania planów treningowych.' });
  }
});

// Pobieranie szczegółów konkretnego planu
router.get('/training-plans/:id', authenticateToken, async (req, res) => {
  try {
    const planId = req.params.id;

    if (databaseType === 'both') {
      if (/^[0-9a-fA-F]{24}$/.test(planId)) {
        const mongoPlan = await MongoTrainingPlan.findById(planId);
        if (mongoPlan) {
          const mysqlPlans = await MySQLTrainingPlan.findAll({
            where: { name: mongoPlan.name },
            include: [{ model: TrainingDay, include: [TrainingExercise] }],
          });

          const mysqlPlan = mysqlPlans.length > 0 ? mysqlPlans[0] : null;
          return res.status(200).json({
            ...mongoPlan.toObject(),
            mysqlId: mysqlPlan ? mysqlPlan.id : null,
          });
        }
      }
    }

    res.status(404).json({ error: 'Plan treningowy nie został znaleziony.' });
  } catch (error) {
    console.error('Błąd pobierania planu treningowego:', error);
    res.status(500).json({ error: 'Błąd pobierania planu treningowego.' });
  }
});

// Aktualizacja planu treningowego
router.put('/training-plans/:id', authenticateToken, async (req, res) => {
  const { name, description, isActive, days } = req.body;
  const planId = req.params.id;

  try {
    let updatedMongo = null;
    let updatedMySQL = null;
    let mongoId = null;
    let mysqlId = null;

    // Identyfikacja ID dla obu baz
    if (/^[0-9a-fA-F]{24}$/.test(planId)) {
      mongoId = planId;
      // Próba znalezienia odpowiadającego rekordu w MySQL
      const mongoPlan = await MongoTrainingPlan.findById(mongoId);
      if (mongoPlan) {
        const mysqlPlans = await MySQLTrainingPlan.findAll({
          where: { name: mongoPlan.name }
        });
        if (mysqlPlans && mysqlPlans.length > 0) {
          mysqlId = mysqlPlans[0].id;
        }
      }
    } else {
      mysqlId = parseInt(planId, 10);
      if (!isNaN(mysqlId)) {
        // Próba znalezienia odpowiadającego rekordu w MongoDB
        const mysqlPlan = await MySQLTrainingPlan.findByPk(mysqlId);
        if (mysqlPlan) {
          const mongoPlans = await MongoTrainingPlan.find({ name: mysqlPlan.name });
          if (mongoPlans && mongoPlans.length > 0) {
            mongoId = mongoPlans[0]._id;
          }
        }
      }
    }

    // MongoDB - aktualizacja planu
    if ((databaseType === 'mongo' || databaseType === 'both') && mongoId) {
      updatedMongo = await MongoTrainingPlan.findByIdAndUpdate(
        mongoId,
        { name, description, isActive, days, dateUpdated: new Date() },
        { new: true }
      );
    }

    // MySQL - aktualizacja planu i powiązanych danych
    if ((databaseType === 'mysql' || databaseType === 'both') && mysqlId) {
      // 1. Aktualizacja głównego rekordu planu
      await MySQLTrainingPlan.update(
        { name, description, isActive, dateUpdated: new Date() },
        { where: { id: mysqlId } }
      );
      
      // 2. Jeśli przekazano dni, aktualizuj strukturę dni i ćwiczeń
      if (days && Array.isArray(days)) {
        // Usuń istniejące dni i ćwiczenia (kaskadowo)
        await TrainingDay.destroy({ where: { planId: mysqlId } });
        
        // Dodaj zaktualizowane dni i ćwiczenia
        for (const day of days) {
          const createdDay = await TrainingDay.create({
            planId: mysqlId,
            dayOfWeek: day.dayOfWeek,
            name: day.name,
            order: day.order
          });

          if (day.exercises && Array.isArray(day.exercises)) {
            for (const exercise of day.exercises) {
              await TrainingExercise.create({
                dayId: createdDay.id,
                exerciseId: exercise.exerciseId,
                exerciseName: exercise.exerciseName,
                sets: exercise.sets || 0,
                reps: exercise.reps || 0,
                weight: exercise.weight,
                restTime: exercise.restTime,
                order: exercise.order,
                gifUrl: exercise.gifUrl
              });
            }
          }
        }
      }
      
      // Pobierz zaktualizowany rekord z MySQL
      updatedMySQL = await MySQLTrainingPlan.findByPk(mysqlId, {
        include: [{ model: TrainingDay, include: [TrainingExercise] }],
      });
    }

    // Obsługa odpowiedzi
    if (databaseType === 'both') {
      if (updatedMongo) {
        // Wzbogać dane MongoDB o ID MySQL
        const responseData = {
          ...updatedMongo.toObject(),
          mysqlId: mysqlId
        };
        return res.status(200).json({
          message: 'Plan treningowy został zaktualizowany w obu bazach danych.',
          plan: responseData
        });
      } else if (updatedMySQL) {
        // Jeśli z jakiegoś powodu nie udało się zaktualizować MongoDB
        return res.status(200).json({
          message: 'Plan treningowy został zaktualizowany tylko w MySQL.',
          plan: updatedMySQL
        });
      }
    } else if (updatedMongo || updatedMySQL) {
      return res.status(200).json({
        message: 'Plan treningowy został zaktualizowany.',
        plan: updatedMongo || updatedMySQL,
      });
    }
    
    // Jeśli nie udało się zaktualizować żadnego rekordu
    res.status(404).json({ error: 'Nie znaleziono planu treningowego do aktualizacji.' });
  } catch (error) {
    console.error('Błąd aktualizacji planu treningowego:', error);
    res.status(500).json({ error: 'Błąd aktualizacji planu treningowego.' });
  }
});

// Usuwanie planu treningowego
router.delete('/training-plans/:id', authenticateToken, async (req, res) => {
  const planId = req.params.id;

  try {
    let isMongoDeleted = false;
    let isMySQLDeleted = false;
    let mongoId = null;
    let mysqlId = null;

    // Identyfikacja ID dla obu baz
    if (/^[0-9a-fA-F]{24}$/.test(planId)) {
      mongoId = planId;
      // Próba znalezienia odpowiadającego rekordu w MySQL
      const mongoPlan = await MongoTrainingPlan.findById(mongoId);
      if (mongoPlan) {
        const mysqlPlans = await MySQLTrainingPlan.findAll({
          where: { name: mongoPlan.name }
        });
        if (mysqlPlans && mysqlPlans.length > 0) {
          mysqlId = mysqlPlans[0].id;
        }
      }
    } else {
      mysqlId = parseInt(planId, 10);
      if (!isNaN(mysqlId)) {
        // Próba znalezienia odpowiadającego rekordu w MongoDB
        const mysqlPlan = await MySQLTrainingPlan.findByPk(mysqlId);
        if (mysqlPlan) {
          const mongoPlans = await MongoTrainingPlan.find({ name: mysqlPlan.name });
          if (mongoPlans && mongoPlans.length > 0) {
            mongoId = mongoPlans[0]._id;
          }
        }
      }
    }

    // MongoDB - usunięcie planu
    if ((databaseType === 'mongo' || databaseType === 'both') && mongoId) {
      const deletedPlan = await MongoTrainingPlan.findByIdAndDelete(mongoId);
      isMongoDeleted = !!deletedPlan;
    }

    // MySQL - usunięcie planu (kaskadowo usunie też dni i ćwiczenia)
    if ((databaseType === 'mysql' || databaseType === 'both') && mysqlId) {
      const deletedRows = await MySQLTrainingPlan.destroy({ where: { id: mysqlId } });
      isMySQLDeleted = deletedRows > 0;
    }

    // Obsługa odpowiedzi
    if (databaseType === 'both') {
      if (isMongoDeleted && isMySQLDeleted) {
        return res.status(200).json({ 
          message: 'Plan treningowy został usunięty z obu baz danych.' 
        });
      } else if (isMongoDeleted) {
        return res.status(200).json({ 
          message: 'Plan treningowy został usunięty tylko z MongoDB.' 
        });
      } else if (isMySQLDeleted) {
        return res.status(200).json({ 
          message: 'Plan treningowy został usunięty tylko z MySQL.' 
        });
      }
    } else if (isMongoDeleted || isMySQLDeleted) {
      return res.status(200).json({ 
        message: 'Plan treningowy został usunięty.' 
      });
    }

    // Jeśli nie udało się usunąć żadnego rekordu
    res.status(404).json({ error: 'Nie znaleziono planu treningowego do usunięcia.' });
  } catch (error) {
    console.error('Błąd usuwania planu treningowego:', error);
    res.status(500).json({ error: 'Błąd usuwania planu treningowego.' });
  }
});

module.exports = router;