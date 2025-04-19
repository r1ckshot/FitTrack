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
  // Sprawdź, czy user.mysqlId istnieje (zalecane rozwiązanie)
  if (user.mysqlId) {
    return user.mysqlId;
  }
  
  // Alternatywnie, użyj zdefiniowanego ID SQL jeśli istnieje
  if (user.sqlId) {
    return user.sqlId;
  }
  
  // Jako ostateczność, sprawdź czy istnieje numeryczne ID
  if (user.numericId) {
    return user.numericId;
  }
  
  // Jeśli żadne specyficzne pole nie istnieje, używamy ID 1 jako wartości domyślnej
  return 1;
}

// Tworzenie nowego planu treningowego
router.post('/training-plans', authenticateToken, async (req, res) => {
  const { name, description, days, isActive = true } = req.body; // Domyślna wartość isActive = true

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

    // Poprawne ID użytkownika dla MySQL
    const mysqlUserId = getMySQLUserId(req.user);

    // MongoDB
    if (databaseType === 'mongo' || databaseType === 'both') {
      const trainingPlan = new MongoTrainingPlan({
        userId: req.user.id, // ID dla MongoDB
        name,
        description,
        days: days || [],
        isActive: isActive, // Dodajemy flagę aktywności
      });
      createdPlanMongo = await trainingPlan.save();
    }

    // MySQL
    if (databaseType === 'mysql' || databaseType === 'both') {
      try {
        // Pierwsze utworzenie planu z poprawnym ID i flagą isActive
        createdPlanMySQL = await MySQLTrainingPlan.create({
          userId: mysqlUserId,
          name,
          description,
          isActive: isActive, // Dodajemy flagę aktywności
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

    // W odpowiedzi zwracamy dane tylko z MongoDB, jeśli działamy w trybie "both"
    if (databaseType === 'both' && createdPlanMongo) {
      res.status(201).json({
        message: 'Plan treningowy został utworzony.',
        plan: createdPlanMongo
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
      // Pobierz plany z MongoDB
      const mongoPlans = await MongoTrainingPlan.find({ userId: req.user.id });
      
      // Pobierz plany z MySQL
      const mysqlPlans = await MySQLTrainingPlan.findAll({ 
        where: { userId: mysqlUserId },
        include: [{ model: TrainingDay, include: [TrainingExercise] }]
      });

      // Wzbogacanie danych z MongoDB o identyfikatory z MySQL
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
    
    // Jeśli nie znaleziono planów, zwracamy pustą tablicę
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
      let mongoPlan = null;
      let mysqlPlan = null;
      let mysqlId = null;
      
      // Sprawdź czy to ObjectId dla MongoDB
      if (/^[0-9a-fA-F]{24}$/.test(planId)) {
        mongoPlan = await MongoTrainingPlan.findById(planId);
        if (mongoPlan) {
          // Spróbuj znaleźć odpowiadający rekord w MySQL
          const plans = await MySQLTrainingPlan.findAll({
            where: { name: mongoPlan.name },
            include: [{ model: TrainingDay, include: [TrainingExercise] }],
          });
          
          // Wybierz pierwszy pasujący rekord
          if (plans && plans.length > 0) {
            mysqlPlan = plans[0];
            mysqlId = mysqlPlan.id;
          }
          
          // Zwróć dane z MongoDB wzbogacone o ID z MySQL
          return res.status(200).json({
            ...mongoPlan.toObject(),
            mysqlId: mysqlId
          });
        }
      } else {
        // Jeśli to nie ObjectId, to spróbuj jako MySQL ID
        const mysqlId = parseInt(planId, 10);
        if (!isNaN(mysqlId)) {
          mysqlPlan = await MySQLTrainingPlan.findByPk(mysqlId, {
            include: [{ model: TrainingDay, include: [TrainingExercise] }],
          });
          
          if (mysqlPlan) {
            // Znajdź odpowiadający rekord w MongoDB
            const mongoPlans = await MongoTrainingPlan.find({ name: mysqlPlan.name });
            if (mongoPlans && mongoPlans.length > 0) {
              mongoPlan = mongoPlans[0];
              return res.status(200).json({
                ...mongoPlan.toObject(),
                mysqlId: mysqlId
              });
            }
          }
        }
      }
    } else if (databaseType === 'mongo') {
      // Tylko MongoDB
      if (/^[0-9a-fA-F]{24}$/.test(planId)) {
        const mongoPlan = await MongoTrainingPlan.findById(planId);
        if (mongoPlan) {
          return res.status(200).json(mongoPlan);
        }
      }
    } else if (databaseType === 'mysql') {
      // Tylko MySQL
      const mysqlId = parseInt(planId, 10);
      if (!isNaN(mysqlId)) {
        const mysqlPlan = await MySQLTrainingPlan.findByPk(mysqlId, {
          include: [{ model: TrainingDay, include: [TrainingExercise] }],
        });
        if (mysqlPlan) {
          return res.status(200).json(mysqlPlan);
        }
      }
    }

    // Jeśli nie znaleziono planu, zwracamy błąd 404
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

    // MongoDB
    if (databaseType === 'mongo' || databaseType === 'both') {
      if (/^[0-9a-fA-F]{24}$/.test(planId)) {
        updatedMongo = await MongoTrainingPlan.findByIdAndUpdate(
          planId,
          { name, description, isActive, days, dateUpdated: new Date() },
          { new: true }
        );
      }
    }

    // MySQL
    if (databaseType === 'mysql' || databaseType === 'both') {
      const mysqlId = parseInt(planId, 10); // Sprawdzenie, czy to ID MySQL
      if (!isNaN(mysqlId)) {
        const [updatedRows] = await MySQLTrainingPlan.update(
          { name, description, isActive, dateUpdated: new Date() },
          { where: { id: mysqlId } }
        );
        if (updatedRows > 0) {
          updatedMySQL = await MySQLTrainingPlan.findByPk(mysqlId, {
            include: [{ model: TrainingDay, include: [TrainingExercise] }],
          });
        }
      }
    }

    // Synchronizacja odpowiedzi
    if (databaseType === 'both' && updatedMongo) {
      res.status(200).json({
        message: 'Plan treningowy został zaktualizowany.',
        plan: updatedMongo, // Zwracamy dane tylko z MongoDB
      });
    } else if (updatedMongo || updatedMySQL) {
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

router.delete('/training-plans/:id', authenticateToken, async (req, res) => {
  const planId = req.params.id;

  try {
    let isMongoDeleted = false;
    let isMySQLDeleted = false;

    // MongoDB
    if (databaseType === 'mongo' || databaseType === 'both') {
      if (/^[0-9a-fA-F]{24}$/.test(planId)) {
        const deletedPlan = await MongoTrainingPlan.findByIdAndDelete(planId);
        isMongoDeleted = !!deletedPlan;
      }
    }

    // MySQL
    if (databaseType === 'mysql' || databaseType === 'both') {
      const mysqlId = parseInt(planId, 10);
      if (!isNaN(mysqlId)) {
        const deletedRows = await MySQLTrainingPlan.destroy({ where: { id: mysqlId } });
        isMySQLDeleted = deletedRows > 0;
      }
    }

    if (isMongoDeleted || isMySQLDeleted) {
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