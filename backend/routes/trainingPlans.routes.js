const express = require('express');
const MongoTrainingPlan = require('../models/mongo/TrainingPlan.model');
const MySQLModels = require('../models/mysql/TrainingPlan.model');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { sequelize } = require('../config/mysql.config'); // Import sequelize instance

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
// Teraz z obsługą transakcji
async function safeMySQLOperation(operation, fallback = null) {
  if (databaseType !== 'mysql' && databaseType !== 'both') return fallback;

  let transaction;

  try {
    // Rozpocznij transakcję
    transaction = await sequelize.transaction();

    // Wykonaj operację w kontekście transakcji
    const result = await operation(transaction);

    // Zatwierdź transakcję
    await transaction.commit();

    return result;
  } catch (error) {
    // Wycofaj transakcję w przypadku błędu
    if (transaction) await transaction.rollback();
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

    // MySQL - operacja z transakcją
    if (databaseType === 'mysql' || databaseType === 'both') {
      createdPlanMySQL = await safeMySQLOperation(async (transaction) => {
        // Tworzenie planu
        const plan = await MySQLTrainingPlan.create({
          userId: mysqlUserId,
          name,
          description,
          isActive: isActive,
          dateCreated: new Date(),
          dateUpdated: new Date(),
        }, { transaction });

        mysqlPlanId = plan.id;

        // Tworzenie dni i ćwiczeń
        if (days && days.length > 0) {
          for (const day of days) {
            const createdDay = await TrainingDay.create({
              planId: plan.id,
              dayOfWeek: day.dayOfWeek,
              name: day.name,
              order: day.order,
            }, { transaction });

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
                }, { transaction });
              }
            }
          }
        }

        // Pobieranie utworzonego planu z relacjami
        return await MySQLTrainingPlan.findByPk(plan.id, {
          include: [{ model: TrainingDay, include: [TrainingExercise] }],
          transaction
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

    // Pobierz dane z MySQL (read operations also benefit from transactions)
    if (databaseType === 'mysql' || databaseType === 'both') {
      const rawMysqlPlans = await safeMySQLOperation(async (transaction) => {
        return await MySQLTrainingPlan.findAll({
          where: { userId: mysqlUserId },
          include: [{
            model: TrainingDay,
            include: [TrainingExercise]
          }],
          order: [
            [TrainingDay, 'order', 'ASC'],
            [TrainingDay, TrainingExercise, 'order', 'ASC']
          ],
          transaction
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
        const matchingMysqlPlans = await safeMySQLOperation(async (transaction) => {
          return await MySQLTrainingPlan.findAll({
            where: { name: mongoPlan.name },
            include: [{ model: TrainingDay, include: [TrainingExercise] }],
            transaction
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
      mysqlPlan = await safeMySQLOperation(async (transaction) => {
        return await MySQLTrainingPlan.findByPk(parseInt(planId, 10), {
          include: [{ model: TrainingDay, include: [TrainingExercise] }],
          transaction
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
          const mysqlPlans = await safeMySQLOperation(async (transaction) => {
            return await MySQLTrainingPlan.findAll({
              where: { name: mongoPlan.name },
              transaction
            });
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
        const mysqlPlan = await safeMySQLOperation(async (transaction) => {
          return await MySQLTrainingPlan.findByPk(mysqlId, { transaction });
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
      updatedMySQL = await safeMySQLOperation(async (transaction) => {
        // 1. Aktualizacja głównego rekordu planu
        await MySQLTrainingPlan.update(
          { name, description, isActive, dateUpdated: new Date() },
          {
            where: { id: mysqlId },
            transaction
          }
        );

        // 2. Pobierz wszystkie istniejące dni treningowe dla tego planu
        const existingDays = await TrainingDay.findAll({
          where: { planId: mysqlId },
          include: [TrainingExercise],
          transaction
        });

        // Tablica do śledzenia dni, które zostaną zachowane
        const updatedDayIds = [];

        // 3. Aktualizacja lub utworzenie dni treningowych
        if (days && Array.isArray(days)) {
          for (const day of days) {
            let existingDay = existingDays.find(d => d.order === day.order);

            if (existingDay) {
              // Aktualizacja istniejącego dnia
              await TrainingDay.update(
                { dayOfWeek: day.dayOfWeek, name: day.name },
                {
                  where: { id: existingDay.id },
                  transaction
                }
              );
              updatedDayIds.push(existingDay.id);
            } else {
              // Dodanie nowego dnia, jeśli nie istnieje
              const newDay = await TrainingDay.create({
                planId: mysqlId,
                dayOfWeek: day.dayOfWeek,
                name: day.name,
                order: day.order,
              }, { transaction });
              updatedDayIds.push(newDay.id);
              existingDay = newDay;
            }

            // Tablica do śledzenia ćwiczeń, które zostaną zachowane
            const updatedExerciseIds = [];

            // Pobierz wszystkie istniejące ćwiczenia dla tego dnia
            const existingExercises = existingDay.TrainingExercises || [];

            // Obsługa ćwiczeń dla dnia
            if (day.exercises && Array.isArray(day.exercises)) {
              for (const exercise of day.exercises) {
                let existingExercise = exercise.id
                  ? existingExercises.find(e => e.id === exercise.id)
                  : existingExercises.find(e => e.order === exercise.order);

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
                      order: exercise.order,
                      gifUrl: exercise.gifUrl,
                      bodyPart: exercise.bodyPart,
                      equipment: exercise.equipment,
                      target: exercise.target,
                    },
                    {
                      where: { id: existingExercise.id },
                      transaction
                    }
                  );
                  updatedExerciseIds.push(existingExercise.id);
                } else {
                  // Dodanie nowego ćwiczenia, jeśli nie istnieje
                  const newExercise = await TrainingExercise.create({
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
                  }, { transaction });
                  updatedExerciseIds.push(newExercise.id);
                }
              }
            }

            // Usuń ćwiczenia, których nie ma w zaktualizowanym planie
            for (const existingExercise of existingExercises) {
              if (!updatedExerciseIds.includes(existingExercise.id)) {
                await TrainingExercise.destroy({
                  where: { id: existingExercise.id },
                  transaction
                });
              }
            }
          }
        }

        // 4. Usuń dni, których nie ma w zaktualizowanym planie
        for (const existingDay of existingDays) {
          if (!updatedDayIds.includes(existingDay.id)) {
            // Najpierw usuń wszystkie ćwiczenia dla tego dnia
            await TrainingExercise.destroy({
              where: { dayId: existingDay.id },
              transaction
            });
            // Następnie usuń sam dzień treningowy
            await TrainingDay.destroy({
              where: { id: existingDay.id },
              transaction
            });
          }
        }

        // Pobierz zaktualizowany rekord z MySQL
        return await MySQLTrainingPlan.findByPk(mysqlId, {
          include: [{ model: TrainingDay, include: [TrainingExercise] }],
          transaction
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

    if (/^[0-9a-fA-F]{24}$/.test(planId)) {
      mongoId = planId;

      if (databaseType === 'both') {
        const mongoPlan = await safeMongoOperation(async () => {
          return await MongoTrainingPlan.findById(mongoId);
        });

        if (mongoPlan) {
          const mysqlPlans = await safeMySQLOperation(async (transaction) => {
            return await MySQLTrainingPlan.findAll({
              where: { name: mongoPlan.name },
              transaction
            });
          }, []);

          if (mysqlPlans && mysqlPlans.length > 0) {
            mysqlId = mysqlPlans[0].id;
          }
        }
      }
    } else {
      mysqlId = parseInt(planId, 10);

      if (databaseType === 'both' && !isNaN(mysqlId)) {
        const mysqlPlan = await safeMySQLOperation(async (transaction) => {
          return await MySQLTrainingPlan.findByPk(mysqlId, { transaction });
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

    if ((databaseType === 'mongo' || databaseType === 'both') && mongoId) {
      const deletedPlan = await safeMongoOperation(async () => {
        return await MongoTrainingPlan.findByIdAndDelete(mongoId);
      });
      isMongoDeleted = !!deletedPlan;
    }

    if ((databaseType === 'mysql' || databaseType === 'both') && mysqlId && !isNaN(mysqlId)) {
      const deletedRows = await safeMySQLOperation(async (transaction) => {
        // W MySQL trzeba dodatkowo usunąć powiązane ćwiczenia i dni
        // Znajdź wszystkie dni dla tego planu
        const days = await TrainingDay.findAll({
          where: { planId: mysqlId },
          transaction
        });

        // Usuń wszystkie ćwiczenia
        for (const day of days) {
          await TrainingExercise.destroy({
            where: { dayId: day.id },
            transaction
          });
        }

        // Usuń wszystkie dni
        await TrainingDay.destroy({
          where: { planId: mysqlId },
          transaction
        });

        // Usuń plan treningu
        return await MySQLTrainingPlan.destroy({
          where: { id: mysqlId },
          transaction
        });
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