const express = require('express');
const MongoDietPlan = require('../models/mongo/DietPlan.model');
const MySQLModels = require('../models/mysql/DietPlan.model');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();
const { DietPlan: MySQLDietPlan, DietDay, Meal } = MySQLModels;

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

// Tworzenie nowego planu diety
router.post('/diet-plans', authenticateToken, async (req, res) => {
  const { name, description, days, isActive = true } = req.body;

  try {
    let createdPlanMongo = null;
    let createdPlanMySQL = null;
    let mysqlPlanId = null;

    // Walidacja danych wejściowych
    if (!name) {
      return res.status(400).json({ error: 'Nazwa planu diety jest wymagana.' });
    }
    if (days && days.length > 0) {
      for (const day of days) {
        if (!day.dayOfWeek || !day.name || typeof day.order !== 'number') {
          return res.status(400).json({ error: "Każdy dzień musi zawierać 'dayOfWeek', 'name' i 'order'." });
        }
        if (day.meals && day.meals.length > 0) {
          for (const meal of day.meals) {
            if (!meal.recipeId || !meal.title || typeof meal.calories !== 'number') {
              return res.status(400).json({ error: "Każdy posiłek musi zawierać 'recipeId', 'title' i 'calories'." });
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
        const dietPlan = new MongoDietPlan({
          userId: req.user.id,
          name,
          description,
          days: days || [],
          isActive: isActive,
          dateCreated: new Date(),
          dateUpdated: new Date(),
        });
        return await dietPlan.save();
      });
    }

    // MySQL - operacja
    if (databaseType === 'mysql' || databaseType === 'both') {
      createdPlanMySQL = await safeMySQLOperation(async () => {
        const plan = await MySQLDietPlan.create({
          userId: mysqlUserId,
          name,
          description,
          isActive: isActive,
          dateCreated: new Date(),
          dateUpdated: new Date(),
        });

        mysqlPlanId = plan.id;

        // Tworzenie dni i posiłków
        if (days && days.length > 0) {
          for (const day of days) {
            const createdDay = await DietDay.create({
              planId: plan.id,
              dayOfWeek: day.dayOfWeek,
              name: day.name,
              order: day.order,
            });

            if (day.meals && day.meals.length > 0) {
              for (const meal of day.meals) {
                await Meal.create({
                  dayId: createdDay.id,
                  recipeId: meal.recipeId,
                  title: meal.title,
                  calories: meal.calories,
                  protein: meal.protein,
                  carbs: meal.carbs,
                  fat: meal.fat,
                  image: meal.image,
                });
              }
            }
          }
        }

        return await MySQLDietPlan.findByPk(plan.id, {
          include: [{ model: DietDay, include: [Meal] }],
        });
      });
    }

    // Odpowiedź
    if (databaseType === 'both' && createdPlanMongo && createdPlanMySQL) {
      const responseData = {
        ...createdPlanMongo.toObject(),
        mysqlId: mysqlPlanId,
      };
      res.status(201).json({
        message: 'Plan diety został utworzony w obu bazach danych.',
        plan: responseData,
      });
    } else if (createdPlanMongo) {
      res.status(201).json({
        message: 'Plan diety został utworzony w MongoDB.',
        plan: createdPlanMongo,
      });
    } else if (createdPlanMySQL) {
      res.status(201).json({
        message: 'Plan diety został utworzony w MySQL.',
        plan: createdPlanMySQL,
      });
    } else {
      res.status(500).json({ error: 'Nie udało się utworzyć planu diety.' });
    }
  } catch (error) {
    console.error('Błąd tworzenia planu diety:', error);
    res.status(500).json({ error: 'Błąd tworzenia planu diety.' });
  }
});

// Pobieranie wszystkich planów użytkownika
router.get('/diet-plans', authenticateToken, async (req, res) => {
  try {
    const mysqlUserId = getMySQLUserId(req.user);
    let mongoPlans = [];
    let mysqlPlans = [];

    // Pobierz dane z MongoDB
    if (databaseType === 'mongo' || databaseType === 'both') {
      mongoPlans = await safeMongoOperation(async () => {
        return await MongoDietPlan.find({ userId: req.user.id });
      }, []);
    }

    // Pobierz dane z MySQL
    if (databaseType === 'mysql' || databaseType === 'both') {
      const rawMysqlPlans = await safeMySQLOperation(async () => {
        return await MySQLDietPlan.findAll({
          where: { userId: mysqlUserId },
          include: [{ model: DietDay, include: [Meal] }],
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
        days: plan.DietDays
          ? plan.DietDays.map(day => ({
              _id: day.id,
              id: day.id,
              dayOfWeek: day.dayOfWeek,
              name: day.name,
              order: day.order,
              meals: day.Meals
                ? day.Meals.map(meal => ({
                    _id: meal.id,
                    id: meal.id,
                    recipeId: meal.recipeId,
                    title: meal.title,
                    calories: meal.calories,
                    protein: meal.protein,
                    carbs: meal.carbs,
                    fat: meal.fat,
                    image: meal.image,
                  }))
                : [],
            }))
          : [],
      }));
    }

    if (databaseType === 'both' && mongoPlans.length > 0 && mysqlPlans.length > 0) {
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
    console.error('Błąd pobierania planów diety:', error);
    res.status(500).json({ error: 'Błąd pobierania planów diety.' });
  }
});

// Pobieranie szczegółów konkretnego planu diety
router.get('/diet-plans/:id', authenticateToken, async (req, res) => {
  try {
    const planId = req.params.id;
    let mongoPlan = null;
    let mysqlPlan = null;

    // Sprawdź, czy planId to ObjectId (MongoDB)
    if (/^[0-9a-fA-F]{24}$/.test(planId) && (databaseType === 'mongo' || databaseType === 'both')) {
      mongoPlan = await safeMongoOperation(async () => {
        return await MongoDietPlan.findById(planId);
      });

      if (mongoPlan && databaseType === 'both') {
        // Próba znalezienia odpowiadającego planu w MySQL
        const matchingMysqlPlans = await safeMySQLOperation(async () => {
          return await MySQLDietPlan.findAll({
            where: { name: mongoPlan.name },
            include: [{ model: DietDay, include: [Meal] }],
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
        return await MySQLDietPlan.findByPk(parseInt(planId, 10), {
          include: [{ model: DietDay, include: [Meal] }],
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
          days: mysqlPlan.DietDays
            ? mysqlPlan.DietDays.map(day => ({
                _id: day.id,
                id: day.id,
                dayOfWeek: day.dayOfWeek,
                name: day.name,
                order: day.order,
                meals: day.Meals
                  ? day.Meals.map(meal => ({
                      _id: meal.id,
                      id: meal.id,
                      recipeId: meal.recipeId,
                      title: meal.title,
                      calories: meal.calories,
                      protein: meal.protein,
                      carbs: meal.carbs,
                      fat: meal.fat,
                      image: meal.image,
                    }))
                  : [],
              }))
            : [],
        };

        return res.status(200).json(normalizedPlan);
      }
    }

    res.status(404).json({ error: 'Plan diety nie został znaleziony.' });
  } catch (error) {
    console.error('Błąd pobierania planu diety:', error);
    res.status(500).json({ error: 'Błąd pobierania planu diety.' });
  }
});

// Aktualizacja planu diety
router.put('/diet-plans/:id', authenticateToken, async (req, res) => {
  const { name, description, isActive, days } = req.body;
  const planId = req.params.id;

  try {
    let updatedMongo = null;
    let updatedMySQL = null;
    let mongoId = null;
    let mysqlId = null;

    // Określ odpowiednie ID dla obu baz
    if (/^[0-9a-fA-F]{24}$/.test(planId)) {
      mongoId = planId;

      if (databaseType === 'both') {
        const mongoPlan = await safeMongoOperation(async () => {
          return await MongoDietPlan.findById(mongoId);
        });

        if (mongoPlan) {
          const mysqlPlans = await safeMySQLOperation(async () => {
            return await MySQLDietPlan.findAll({ where: { name: mongoPlan.name } });
          }, []);

          if (mysqlPlans && mysqlPlans.length > 0) {
            mysqlId = mysqlPlans[0].id;
          }
        }
      }
    } else {
      mysqlId = parseInt(planId, 10);

      if (databaseType === 'both' && !isNaN(mysqlId)) {
        const mysqlPlan = await safeMySQLOperation(async () => {
          return await MySQLDietPlan.findByPk(mysqlId);
        });

        if (mysqlPlan) {
          const mongoPlans = await safeMongoOperation(async () => {
            return await MongoDietPlan.find({ name: mysqlPlan.name });
          }, []);

          if (mongoPlans && mongoPlans.length > 0) {
            mongoId = mongoPlans[0]._id;
          }
        }
      }
    }

    if ((databaseType === 'mongo' || databaseType === 'both') && mongoId) {
      updatedMongo = await safeMongoOperation(async () => {
        return await MongoDietPlan.findByIdAndUpdate(
          mongoId,
          { name, description, isActive, days, dateUpdated: new Date() },
          { new: true }
        );
      });
    }

    if ((databaseType === 'mysql' || databaseType === 'both') && mysqlId && !isNaN(mysqlId)) {
      updatedMySQL = await safeMySQLOperation(async () => {
        await MySQLDietPlan.update(
          { name, description, isActive, dateUpdated: new Date() },
          { where: { id: mysqlId } }
        );

        if (days && Array.isArray(days)) {
          for (const day of days) {
            let existingDay = await DietDay.findOne({
              where: { planId: mysqlId, order: day.order },
            });

            if (existingDay) {
              await DietDay.update(
                { dayOfWeek: day.dayOfWeek, name: day.name },
                { where: { id: existingDay.id } }
              );
            } else {
              existingDay = await DietDay.create({
                planId: mysqlId,
                dayOfWeek: day.dayOfWeek,
                name: day.name,
                order: day.order,
              });
            }

            if (day.meals && Array.isArray(day.meals)) {
              for (const meal of day.meals) {
                let existingMeal = await Meal.findOne({
                  where: { dayId: existingDay.id, recipeId: meal.recipeId },
                });

                if (existingMeal) {
                  await Meal.update(
                    {
                      title: meal.title,
                      calories: meal.calories,
                      protein: meal.protein,
                      carbs: meal.carbs,
                      fat: meal.fat,
                      image: meal.image,
                    },
                    { where: { id: existingMeal.id } }
                  );
                } else {
                  await Meal.create({
                    dayId: existingDay.id,
                    recipeId: meal.recipeId,
                    title: meal.title,
                    calories: meal.calories,
                    protein: meal.protein,
                    carbs: meal.carbs,
                    fat: meal.fat,
                    image: meal.image,
                  });
                }
              }
            }
          }
        }

        return await MySQLDietPlan.findByPk(mysqlId, {
          include: [{ model: DietDay, include: [Meal] }],
        });
      });
    }

    if (databaseType === 'both' && updatedMongo && updatedMySQL) {
      const responseData = {
        ...updatedMongo.toObject(),
        mysqlId,
      };
      return res.status(200).json({
        message: 'Plan diety został zaktualizowany w obu bazach danych.',
        plan: responseData,
      });
    } else if (updatedMongo) {
      return res.status(200).json({
        message: 'Plan diety został zaktualizowany w MongoDB.',
        plan: updatedMongo,
      });
    } else if (updatedMySQL) {
      return res.status(200).json({
        message: 'Plan diety został zaktualizowany w MySQL.',
        plan: updatedMySQL,
      });
    }

    res.status(404).json({ error: 'Nie znaleziono planu diety do aktualizacji.' });
  } catch (error) {
    console.error('Błąd aktualizacji planu diety:', error);
    res.status(500).json({ error: 'Błąd aktualizacji planu diety.' });
  }
});

// Usuwanie planu diety
router.delete('/diet-plans/:id', authenticateToken, async (req, res) => {
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
          return await MongoDietPlan.findById(mongoId);
        });

        if (mongoPlan) {
          const mysqlPlans = await safeMySQLOperation(async () => {
            return await MySQLDietPlan.findAll({ where: { name: mongoPlan.name } });
          }, []);

          if (mysqlPlans && mysqlPlans.length > 0) {
            mysqlId = mysqlPlans[0].id;
          }
        }
      }
    } else {
      mysqlId = parseInt(planId, 10);

      if (databaseType === 'both' && !isNaN(mysqlId)) {
        const mysqlPlan = await safeMySQLOperation(async () => {
          return await MySQLDietPlan.findByPk(mysqlId);
        });

        if (mysqlPlan) {
          const mongoPlans = await safeMongoOperation(async () => {
            return await MongoDietPlan.find({ name: mysqlPlan.name });
          }, []);

          if (mongoPlans && mongoPlans.length > 0) {
            mongoId = mongoPlans[0]._id;
          }
        }
      }
    }

    if ((databaseType === 'mongo' || databaseType === 'both') && mongoId) {
      const deletedPlan = await safeMongoOperation(async () => {
        return await MongoDietPlan.findByIdAndDelete(mongoId);
      });
      isMongoDeleted = !!deletedPlan;
    }

    if ((databaseType === 'mysql' || databaseType === 'both') && mysqlId && !isNaN(mysqlId)) {
      const deletedRows = await safeMySQLOperation(async () => {
        return await MySQLDietPlan.destroy({ where: { id: mysqlId } });
      }, 0);
      isMySQLDeleted = deletedRows > 0;
    }

    if (databaseType === 'both' && isMongoDeleted && isMySQLDeleted) {
      return res.status(200).json({
        message: 'Plan diety został usunięty z obu baz danych.',
      });
    } else if (isMongoDeleted) {
      return res.status(200).json({
        message: 'Plan diety został usunięty z MongoDB.',
      });
    } else if (isMySQLDeleted) {
      return res.status(200).json({
        message: 'Plan diety został usunięty z MySQL.',
      });
    } else {
      res.status(404).json({ error: 'Nie znaleziono planu diety do usunięcia.' });
    }
  } catch (error) {
    console.error('Błąd usuwania planu diety:', error);
    res.status(500).json({ error: 'Błąd usuwania planu diety.' });
  }
});

module.exports = router;