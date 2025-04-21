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

// Bezpieczna operacja MongoDB - ignoruje błędy połączenia gdy baza jest niedostępna
async function safeMongoOperation(operation, fallback = null) {
  if (databaseType !== 'mongo' && databaseType !== 'both') return fallback;
  
  try {
    return await operation();
  } catch (error) {
    console.log('MongoDB operation failed:', error.message);
    return fallback;
  }
}

// Bezpieczna operacja MySQL - ignoruje błędy połączenia gdy baza jest niedostępna
async function safeMySQLOperation(operation, fallback = null) {
  if (databaseType !== 'mysql' && databaseType !== 'both') return fallback;
  
  try {
    return await operation();
  } catch (error) {
    console.log('MySQL operation failed:', error.message);
    return fallback;
  }
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

    // MongoDB - operacja
    if (databaseType === 'mongo' || databaseType === 'both') {
      createdPlanMongo = await safeMongoOperation(async () => {
        const trainingPlan = new MongoTrainingPlan({
          userId: req.user.id,
          name,
          description,
          days: days || [],
          isActive: isActive,
          dateCreated: new Date(),
          dateUpdated: new Date()
        });
        return await trainingPlan.save();
      });
    }

    // MySQL - operacja
    if (databaseType === 'mysql' || databaseType === 'both') {
      createdPlanMySQL = await safeMySQLOperation(async () => {
        // Tworzenie planu
        const plan = await MySQLTrainingPlan.create({
          userId: mysqlUserId,
          name,
          description,
          isActive: isActive,
          dateCreated: new Date(),
          dateUpdated: new Date(),
        });

        mysqlPlanId = plan.id;

        // Tworzenie dni i ćwiczeń
        if (days && days.length > 0) {
          for (const day of days) {
            const createdDay = await TrainingDay.create({
              planId: plan.id,
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
                  bodyPart: exercise.bodyPart,
                  equipment: exercise.equipment,
                  target: exercise.target,
                });
              }
            }
          }
        }

        // Pobieranie utworzonego planu z relacjami
        return await MySQLTrainingPlan.findByPk(plan.id, {
          include: [{ model: TrainingDay, include: [TrainingExercise] }]
        });
      });
    }

    // Odpowiedź
    if (databaseType === 'both' && createdPlanMongo && createdPlanMySQL) {
      // Wzbogacamy dane z MongoDB o ID z MySQL
      const responseData = {
        ...createdPlanMongo.toObject(),
        mysqlId: mysqlPlanId
      };
      
      res.status(201).json({
        message: 'Plan treningowy został utworzony w obu bazach danych.',
        plan: responseData
      });
    } else if (createdPlanMongo) {
      res.status(201).json({
        message: 'Plan treningowy został utworzony w MongoDB.',
        plan: createdPlanMongo,
      });
    } else if (createdPlanMySQL) {
      res.status(201).json({
        message: 'Plan treningowy został utworzony w MySQL.',
        plan: createdPlanMySQL,
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
    let mongoPlans = [];
    let mysqlPlans = [];

    // Pobierz dane z MongoDB
    if (databaseType === 'mongo' || databaseType === 'both') {
      mongoPlans = await safeMongoOperation(async () => {
        return await MongoTrainingPlan.find({ userId: req.user.id });
      }, []);
    }

    // Pobierz dane z MySQL
    if (databaseType === 'mysql' || databaseType === 'both') {
      const rawMysqlPlans = await safeMySQLOperation(async () => {
        return await MySQLTrainingPlan.findAll({ 
          where: { userId: mysqlUserId },
          include: [{ model: TrainingDay, include: [TrainingExercise] }]
        });
      }, []);
      
      // Normalizacja danych z MySQL
      mysqlPlans = rawMysqlPlans.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        isActive: plan.isActive,
        dateCreated: plan.dateCreated,
        dateUpdated: plan.dateUpdated,
        // Przekształć powiązane dni treningowe na format zgodny z MongoDB
        days: plan.TrainingDays ? plan.TrainingDays.map(day => ({
          _id: day.id,
          id: day.id,
          dayOfWeek: day.dayOfWeek,
          name: day.name, 
          order: day.order,
          // Przekształć również ćwiczenia
          exercises: day.TrainingExercises ? day.TrainingExercises.map(exercise => ({
            _id: exercise.id,
            id: exercise.id,
            exerciseId: exercise.exerciseId,
            exerciseName: exercise.exerciseName,
            sets: exercise.sets,
            reps: exercise.reps,
            weight: exercise.weight,
            restTime: exercise.restTime,
            order: exercise.order,
            gifUrl: exercise.gifUrl,
            bodyPart: exercise.bodyPart,
            equipment: exercise.equipment,
            target: exercise.target
          })) : []
        })) : []
      }));
    }

    if (databaseType === 'both' && mongoPlans.length > 0 && mysqlPlans.length > 0) {
      // Próba połączenia danych z obu baz
      const enrichedPlans = mongoPlans.map(mongoPlan => {
        const matchingMySQLPlan = mysqlPlans.find(mysqlPlan => mysqlPlan.name === mongoPlan.name);
        return {
          ...mongoPlan.toObject(),
          mysqlId: matchingMySQLPlan ? matchingMySQLPlan.id : null,
        };
      });
      return res.status(200).json(enrichedPlans);
    } else if (mongoPlans.length > 0) {
      return res.status(200).json(mongoPlans);
    } else if (mysqlPlans.length > 0) {
      return res.status(200).json(mysqlPlans);
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
    let mongoPlan = null;
    let mysqlPlan = null;

    // Sprawdź, czy planId to ObjectId (MongoDB)
    if (/^[0-9a-fA-F]{24}$/.test(planId) && (databaseType === 'mongo' || databaseType === 'both')) {
      mongoPlan = await safeMongoOperation(async () => {
        return await MongoTrainingPlan.findById(planId);
      });

      if (mongoPlan && databaseType === 'both') {
        // Próba znalezienia odpowiadającego planu w MySQL
        const matchingMysqlPlans = await safeMySQLOperation(async () => {
          return await MySQLTrainingPlan.findAll({
            where: { name: mongoPlan.name },
            include: [{ model: TrainingDay, include: [TrainingExercise] }],
          });
        }, []);

        const mysqlPlan = matchingMysqlPlans && matchingMysqlPlans.length > 0 ? matchingMysqlPlans[0] : null;
        
        return res.status(200).json({
          ...mongoPlan.toObject(),
          mysqlId: mysqlPlan ? mysqlPlan.id : null,
        });
      } else if (mongoPlan) {
        return res.status(200).json(mongoPlan);
      }
    } 
    // Sprawdź, czy planId to liczba (MySQL)
    else if (!isNaN(parseInt(planId, 10)) && (databaseType === 'mysql' || databaseType === 'both')) {
      mysqlPlan = await safeMySQLOperation(async () => {
        return await MySQLTrainingPlan.findByPk(parseInt(planId, 10), {
          include: [{ model: TrainingDay, include: [TrainingExercise] }]
        });
      });

      if (mysqlPlan) {
        // Utwórz zunifikowaną strukturę danych zgodną z oczekiwaniami frontendu
        const normalizedPlan = {
          id: mysqlPlan.id,
          name: mysqlPlan.name,
          description: mysqlPlan.description,
          isActive: mysqlPlan.isActive,
          dateCreated: mysqlPlan.dateCreated,
          dateUpdated: mysqlPlan.dateUpdated,
          // Przekształć powiązane dni treningowe na format zgodny z MongoDB
          days: mysqlPlan.TrainingDays ? mysqlPlan.TrainingDays.map(day => ({
            _id: day.id,  // ID dnia z MySQL
            id: day.id,   // Alternatywne ID
            dayOfWeek: day.dayOfWeek,
            name: day.name, 
            order: day.order,
            // Przekształć również ćwiczenia
            exercises: day.TrainingExercises ? day.TrainingExercises.map(exercise => ({
              _id: exercise.id,  // ID ćwiczenia z MySQL
              id: exercise.id,   // Alternatywne ID
              exerciseId: exercise.exerciseId,
              exerciseName: exercise.exerciseName,
              sets: exercise.sets,
              reps: exercise.reps,
              weight: exercise.weight,
              restTime: exercise.restTime,
              order: exercise.order,
              gifUrl: exercise.gifUrl,
              bodyPart: exercise.bodyPart,
              equipment: exercise.equipment,
              target: exercise.target
            })) : []
          })) : []
        };
        
        return res.status(200).json(normalizedPlan);
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

    // Określ odpowiednie ID dla obu baz
    if (/^[0-9a-fA-F]{24}$/.test(planId)) {
      // Plan ID to MongoDB ObjectID
      mongoId = planId;

      // Tylko jeśli używamy obu baz danych, spróbuj znaleźć odpowiadający rekord w MySQL
      if (databaseType === 'both') {
        const mongoPlan = await safeMongoOperation(async () => {
          return await MongoTrainingPlan.findById(mongoId);
        });

        if (mongoPlan) {
          const mysqlPlans = await safeMySQLOperation(async () => {
            return await MySQLTrainingPlan.findAll({ where: { name: mongoPlan.name } });
          }, []);

          if (mysqlPlans && mysqlPlans.length > 0) {
            mysqlId = mysqlPlans[0].id;
          }
        }
      }
    } else {
      // Plan ID to prawdopodobnie MySQL ID
      mysqlId = parseInt(planId, 10);

      // Tylko jeśli używamy obu baz danych, spróbuj znaleźć odpowiadający rekord w MongoDB
      if (databaseType === 'both' && !isNaN(mysqlId)) {
        const mysqlPlan = await safeMySQLOperation(async () => {
          return await MySQLTrainingPlan.findByPk(mysqlId);
        });

        if (mysqlPlan) {
          const mongoPlans = await safeMongoOperation(async () => {
            return await MongoTrainingPlan.find({ name: mysqlPlan.name });
          }, []);

          if (mongoPlans && mongoPlans.length > 0) {
            mongoId = mongoPlans[0]._id;
          }
        }
      }
    }

    // MongoDB - aktualizacja planu jeśli dostępny
    if ((databaseType === 'mongo' || databaseType === 'both') && mongoId) {
      updatedMongo = await safeMongoOperation(async () => {
        return await MongoTrainingPlan.findByIdAndUpdate(
          mongoId,
          { name, description, isActive, days, dateUpdated: new Date() },
          { new: true }
        );
      });
    }

    // MySQL - aktualizacja planu i powiązanych danych jeśli dostępny
    if ((databaseType === 'mysql' || databaseType === 'both') && mysqlId && !isNaN(mysqlId)) {
      updatedMySQL = await safeMySQLOperation(async () => {
        // 1. Aktualizacja głównego rekordu planu
        await MySQLTrainingPlan.update(
          { name, description, isActive, dateUpdated: new Date() },
          { where: { id: mysqlId } }
        );

        // 2. Aktualizacja dni i ćwiczeń zamiast ich usuwania
        if (days && Array.isArray(days)) {
          for (const day of days) {
            let existingDay = await TrainingDay.findOne({
              where: { planId: mysqlId, order: day.order },
            });

            if (existingDay) {
              // Aktualizacja istniejącego dnia
              await TrainingDay.update(
                { dayOfWeek: day.dayOfWeek, name: day.name },
                { where: { id: existingDay.id } }
              );
            } else {
              // Dodanie nowego dnia, jeśli nie istnieje
              existingDay = await TrainingDay.create({
                planId: mysqlId,
                dayOfWeek: day.dayOfWeek,
                name: day.name,
                order: day.order,
              });
            }

            // Obsługa ćwiczeń dla dnia
            if (day.exercises && Array.isArray(day.exercises)) {
              for (const exercise of day.exercises) {
                let existingExercise = await TrainingExercise.findOne({
                  where: { dayId: existingDay.id, order: exercise.order },
                });

                if (existingExercise) {
                  // Aktualizacja istniejącego ćwiczenia
                  await TrainingExercise.update(
                    {
                      exerciseId: exercise.exerciseId,
                      exerciseName: exercise.exerciseName,
                      sets: exercise.sets,
                      reps: exercise.reps,
                      weight: exercise.weight,
                      restTime: exercise.restTime,
                      gifUrl: exercise.gifUrl,
                      bodyPart: exercise.bodyPart,
                      equipment: exercise.equipment,
                      target: exercise.target,
                    },
                    { where: { id: existingExercise.id } }
                  );
                } else {
                  // Dodanie nowego ćwiczenia, jeśli nie istnieje
                  await TrainingExercise.create({
                    dayId: existingDay.id,
                    exerciseId: exercise.exerciseId,
                    exerciseName: exercise.exerciseName,
                    sets: exercise.sets,
                    reps: exercise.reps,
                    weight: exercise.weight,
                    restTime: exercise.restTime,
                    order: exercise.order,
                    gifUrl: exercise.gifUrl,
                    bodyPart: exercise.bodyPart,
                    equipment: exercise.equipment,
                    target: exercise.target,
                  });
                }
              }
            }
          }
        }

        // Pobierz zaktualizowany rekord z MySQL
        return await MySQLTrainingPlan.findByPk(mysqlId, {
          include: [{ model: TrainingDay, include: [TrainingExercise] }],
        });
      });
    }

    // Obsługa odpowiedzi
    if (databaseType === 'both' && updatedMongo && updatedMySQL) {
      const responseData = {
        ...updatedMongo.toObject(),
        mysqlId: mysqlId,
      };
      return res.status(200).json({
        message: 'Plan treningowy został zaktualizowany w obu bazach danych.',
        plan: responseData,
      });
    } else if (updatedMongo) {
      return res.status(200).json({
        message: 'Plan treningowy został zaktualizowany w MongoDB.',
        plan: updatedMongo,
      });
    } else if (updatedMySQL) {
      return res.status(200).json({
        message: 'Plan treningowy został zaktualizowany w MySQL.',
        plan: updatedMySQL,
      });
    }

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

    // Identyfikacja ID dla odpowiednich baz
    if (/^[0-9a-fA-F]{24}$/.test(planId)) {
      // MongoDB ObjectID
      mongoId = planId;
      
      // Spróbuj znaleźć odpowiadający rekord w MySQL tylko jeśli używamy obu baz
      if (databaseType === 'both') {
        const mongoPlan = await safeMongoOperation(async () => {
          return await MongoTrainingPlan.findById(mongoId);
        });
        
        if (mongoPlan) {
          const mysqlPlans = await safeMySQLOperation(async () => {
            return await MySQLTrainingPlan.findAll({ where: { name: mongoPlan.name } });
          }, []);
          
          if (mysqlPlans && mysqlPlans.length > 0) {
            mysqlId = mysqlPlans[0].id;
          }
        }
      }
    } else {
      // MySQL ID
      mysqlId = parseInt(planId, 10);
      
      // Spróbuj znaleźć odpowiadający rekord w MongoDB tylko jeśli używamy obu baz
      if (databaseType === 'both' && !isNaN(mysqlId)) {
        const mysqlPlan = await safeMySQLOperation(async () => {
          return await MySQLTrainingPlan.findByPk(mysqlId);
        });
        
        if (mysqlPlan) {
          const mongoPlans = await safeMongoOperation(async () => {
            return await MongoTrainingPlan.find({ name: mysqlPlan.name });
          }, []);
          
          if (mongoPlans && mongoPlans.length > 0) {
            mongoId = mongoPlans[0]._id;
          }
        }
      }
    }

    // MongoDB - usunięcie planu
    if ((databaseType === 'mongo' || databaseType === 'both') && mongoId) {
      const deletedPlan = await safeMongoOperation(async () => {
        return await MongoTrainingPlan.findByIdAndDelete(mongoId);
      });
      isMongoDeleted = !!deletedPlan;
    }

    // MySQL - usunięcie planu (kaskadowo usunie też dni i ćwiczenia)
    if ((databaseType === 'mysql' || databaseType === 'both') && mysqlId && !isNaN(mysqlId)) {
      const deletedRows = await safeMySQLOperation(async () => {
        return await MySQLTrainingPlan.destroy({ where: { id: mysqlId } });
      }, 0);
      isMySQLDeleted = deletedRows > 0;
    }

    // Obsługa odpowiedzi
    if (databaseType === 'both' && isMongoDeleted && isMySQLDeleted) {
      return res.status(200).json({ 
        message: 'Plan treningowy został usunięty z obu baz danych.' 
      });
    } else if (isMongoDeleted) {
      return res.status(200).json({ 
        message: 'Plan treningowy został usunięty z MongoDB.' 
      });
    } else if (isMySQLDeleted) {
      return res.status(200).json({ 
        message: 'Plan treningowy został usunięty z MySQL.' 
      });
    } else {
      // Jeśli nie udało się usunąć żadnego rekordu
      res.status(404).json({ error: 'Nie znaleziono planu treningowego do usunięcia.' });
    }
  } catch (error) {
    console.error('Błąd usuwania planu treningowego:', error);
    res.status(500).json({ error: 'Błąd usuwania planu treningowego.' });
  }
});

module.exports = router;