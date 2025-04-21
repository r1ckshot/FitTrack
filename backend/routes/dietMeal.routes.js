const express = require('express');
const MongoDietPlan = require('../models/mongo/DietPlan.model');
const MySQLModels = require('../models/mysql/DietPlan.model');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();
const { Meal: MySQLMeal, DietDay: MySQLDietDay } = MySQLModels;

// Pobranie typu bazy danych z .env
const databaseType = process.env.DATABASE_TYPE || 'both';

// Dodanie nowego posiłku do dnia diety
router.post('/diet-days/:dayId/meals', authenticateToken, async (req, res) => {
  const { recipeId, title, calories, protein, carbs, fat, image } = req.body;
  const { mongoDayId } = req.query; // Dodanie opcjonalnego ID MongoDB

  try {
    let createdMealMongo = null;
    let createdMealMySQL = null;
    let newMealMongoId = null;
    let newMealMySQLId = null;

    // MongoDB
    if ((databaseType === 'mongo' || databaseType === 'both') && (mongoDayId || /^[0-9a-fA-F]{24}$/.test(req.params.dayId))) {
      const mongoIdToUse = mongoDayId || req.params.dayId;
      const plan = await MongoDietPlan.findOne({ 'days._id': mongoIdToUse });
      if (!plan) return res.status(404).json({ error: 'Dzień diety nie został znaleziony w MongoDB.' });

      const day = plan.days.id(mongoIdToUse);
      if (day) {
        const newMeal = { recipeId, title, calories, protein, carbs, fat, image };
        day.meals.push(newMeal);
        await plan.save();

        // Znajdź dodany posiłek
        newMealMongoId = day.meals[day.meals.length - 1]._id;
        createdMealMongo = day.meals[day.meals.length - 1];
      }
    }

    // MySQL
    if (databaseType === 'mysql' || databaseType === 'both') {
      const mysqlDayId = parseInt(req.params.dayId, 10);
      if (!isNaN(mysqlDayId)) {
        const day = await MySQLDietDay.findByPk(mysqlDayId);
        if (!day) return res.status(404).json({ error: 'Dzień diety nie został znaleziony w MySQL.' });

        createdMealMySQL = await MySQLMeal.create({
          dayId: mysqlDayId,
          recipeId,
          title,
          calories,
          protein,
          carbs,
          fat,
          image,
        });

        newMealMySQLId = createdMealMySQL.id;
      }
    }

    if (createdMealMongo || createdMealMySQL) {
      const responseData = {
        message: 'Posiłek został dodany.',
        meal: {
          mongoId: newMealMongoId,
          mysqlId: newMealMySQLId,
          recipeId,
          title,
          calories,
          protein,
          carbs,
          fat,
          image,
        },
      };

      res.status(201).json(responseData);
    } else {
      res.status(500).json({ error: 'Nie udało się dodać posiłku.' });
    }
  } catch (error) {
    console.error('Błąd dodawania posiłku:', error);
    res.status(500).json({ error: 'Błąd dodawania posiłku.' });
  }
});

// Aktualizacja posiłku
router.put('/meals/:id', authenticateToken, async (req, res) => {
  const { recipeId, title, calories, protein, carbs, fat, image, mongoId, mysqlId } = req.body;
  const mealParamId = req.params.id;

  try {
    let updatedMealMongo = null;
    let updatedMealMySQL = null;
    let updateSuccess = false;

    // MongoDB
    if ((databaseType === 'mongo' || databaseType === 'both') && (mongoId || /^[0-9a-fA-F]{24}$/.test(mealParamId))) {
      const mongoIdToUse = mongoId || mealParamId;
      const plan = await MongoDietPlan.findOne({ 'days.meals._id': mongoIdToUse });
      if (plan) {
        let mealFound = false;

        // Znajdź posiłek w zagnieżdżonych dniach
        for (const day of plan.days) {
          const meal = day.meals.id(mongoIdToUse);
          if (meal) {
            if (recipeId) meal.recipeId = recipeId;
            if (title) meal.title = title;
            if (calories !== undefined) meal.calories = calories;
            if (protein !== undefined) meal.protein = protein;
            if (carbs !== undefined) meal.carbs = carbs;
            if (fat !== undefined) meal.fat = fat;
            if (image !== undefined) meal.image = image;

            mealFound = true;
            updatedMealMongo = meal;
            break;
          }
        }

        if (mealFound) {
          await plan.save();
          updateSuccess = true;
        }
      }
    }

    // MySQL
    if ((databaseType === 'mysql' || databaseType === 'both') && (mysqlId || !isNaN(parseInt(mealParamId, 10)))) {
      const mysqlIdToUse = mysqlId || parseInt(mealParamId, 10);

      const updateData = {};
      if (recipeId) updateData.recipeId = recipeId;
      if (title) updateData.title = title;
      if (calories !== undefined) updateData.calories = calories;
      if (protein !== undefined) updateData.protein = protein;
      if (carbs !== undefined) updateData.carbs = carbs;
      if (fat !== undefined) updateData.fat = fat;
      if (image !== undefined) updateData.image = image;

      const [updatedRows] = await MySQLMeal.update(updateData, { where: { id: mysqlIdToUse } });

      if (updatedRows > 0) {
        updatedMealMySQL = await MySQLMeal.findByPk(mysqlIdToUse);
        updateSuccess = true;
      }
    }

    if (updateSuccess) {
      const responseData = {
        message: 'Posiłek został zaktualizowany.',
        meal: {
          mongoId: updatedMealMongo ? updatedMealMongo._id : null,
          mysqlId: updatedMealMySQL ? updatedMealMySQL.id : null,
          recipeId: updatedMealMongo?.recipeId || updatedMealMySQL?.recipeId,
          title: updatedMealMongo?.title || updatedMealMySQL?.title,
          calories: updatedMealMongo?.calories || updatedMealMySQL?.calories,
          protein: updatedMealMongo?.protein || updatedMealMySQL?.protein,
          carbs: updatedMealMongo?.carbs || updatedMealMySQL?.carbs,
          fat: updatedMealMongo?.fat || updatedMealMySQL?.fat,
          image: updatedMealMongo?.image || updatedMealMySQL?.image,
        },
      };

      res.status(200).json(responseData);
    } else {
      res.status(404).json({ error: 'Nie znaleziono posiłku do aktualizacji.' });
    }
  } catch (error) {
    console.error('Błąd aktualizacji posiłku:', error);
    res.status(500).json({ error: 'Błąd aktualizacji posiłku.' });
  }
});

// Usuwanie posiłku
router.delete('/meals/:id', authenticateToken, async (req, res) => {
  const mealId = req.params.id;
  const { mongoId, mysqlId } = req.query; // Dodane query params dla jednoznacznej identyfikacji

  try {
    let deletedMealMongo = false;
    let deletedMealMySQL = false;

    // MongoDB
    if ((databaseType === 'mongo' || databaseType === 'both') && (mongoId || /^[0-9a-fA-F]{24}$/.test(mealId))) {
      const mongoIdToUse = mongoId || mealId;
      const plan = await MongoDietPlan.findOne({ 'days.meals._id': mongoIdToUse });
      if (plan) {
        let mealRemoved = false;

        // Znajdź i usuń posiłek w zagnieżdżonych dniach
        for (const day of plan.days) {
          const meal = day.meals.id(mongoIdToUse);
          if (meal) {
            meal.remove();
            mealRemoved = true;
            break;
          }
        }

        if (mealRemoved) {
          await plan.save();
          deletedMealMongo = true;
        }
      }
    }

    // MySQL
    if ((databaseType === 'mysql' || databaseType === 'both') && (mysqlId || !isNaN(parseInt(mealId, 10)))) {
      const mysqlIdToUse = mysqlId || parseInt(mealId, 10);
      const deletedRows = await MySQLMeal.destroy({ where: { id: mysqlIdToUse } });
      if (deletedRows > 0) deletedMealMySQL = true;
    }

    if (deletedMealMongo || deletedMealMySQL) {
      res.status(200).json({
        message: 'Posiłek został usunięty.',
        deleted: {
          mongo: deletedMealMongo,
          mysql: deletedMealMySQL,
        },
      });
    } else {
      res.status(404).json({ error: 'Nie znaleziono posiłku do usunięcia.' });
    }
  } catch (error) {
    console.error('Błąd usuwania posiłku:', error);
    res.status(500).json({ error: 'Błąd usuwania posiłku.' });
  }
});

module.exports = router;