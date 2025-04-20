const express = require('express');
const MongoTrainingPlan = require('../models/mongo/TrainingPlan.model');
const MySQLModels = require('../models/mysql/TrainingPlan.model');
const { authenticateToken } = require('../middlewares/auth.middleware');

const router = express.Router();
const { TrainingDay: MySQLTrainingDay, TrainingPlan: MySQLTrainingPlan, TrainingExercise } = MySQLModels;

// Pobranie typu bazy danych z .env
const databaseType = process.env.DATABASE_TYPE || 'both';

// Dodanie nowego dnia do planu
router.post('/training-plans/:planId/days', authenticateToken, async (req, res) => {
  const { dayOfWeek, name, order } = req.body;

  try {
    let createdDayMongo = null;
    let createdDayMySQL = null;
    let newDayMongoId = null;
    let newDayMySQLId = null;

    // MongoDB
    if (databaseType === 'mongo' || databaseType === 'both') {
      const plan = await MongoTrainingPlan.findById(req.params.planId);
      if (!plan) return res.status(404).json({ error: 'Plan treningowy nie został znaleziony.' });

      const newDay = {
        dayOfWeek,
        name,
        order,
        exercises: [],
      };
      plan.days.push(newDay);
      await plan.save();
      // Pobierz ID utworzonego dnia
      newDayMongoId = plan.days[plan.days.length - 1]._id;
      createdDayMongo = plan.days[plan.days.length - 1];
    }

    // MySQL
    if (databaseType === 'mysql' || databaseType === 'both') {
      createdDayMySQL = await MySQLTrainingDay.create({
        planId: req.params.planId,
        dayOfWeek,
        name,
        order,
      });
      newDayMySQLId = createdDayMySQL.id;
    }

    if (createdDayMongo || createdDayMySQL) {
      const responseData = {
        message: 'Dzień treningowy został dodany.',
        day: {
          mongoId: newDayMongoId,
          mysqlId: newDayMySQLId,
          dayOfWeek,
          name,
          order,
          exercises: []
        }
      };
      
      res.status(201).json(responseData);
    } else {
      res.status(500).json({ error: 'Nie udało się dodać dnia treningowego.' });
    }
  } catch (error) {
    console.error('Błąd dodawania dnia treningowego:', error);
    res.status(500).json({ error: 'Błąd dodawania dnia treningowego.' });
  }
});

// Aktualizacja dnia treningowego
router.put('/training-days/:id', authenticateToken, async (req, res) => {
  const { dayOfWeek, name, order, mongoId, mysqlId } = req.body;
  const dayId = req.params.id;

  try {
    let updatedDayMongo = null;
    let updatedDayMySQL = null;
    let updateSuccess = false;

    // MongoDB
    if ((databaseType === 'mongo' || databaseType === 'both') && (mongoId || /^[0-9a-fA-F]{24}$/.test(dayId))) {
      const mongoIdToUse = mongoId || dayId; // Użyj podanego mongoId lub dayId
      const plan = await MongoTrainingPlan.findOne({ 'days._id': mongoIdToUse });
      if (plan) {
        const day = plan.days.id(mongoIdToUse);
        if (day) {
          day.dayOfWeek = dayOfWeek;
          day.name = name;
          day.order = order;
          await plan.save();
          updatedDayMongo = day;
          updateSuccess = true;
        }
      }
    }

    // MySQL
    if ((databaseType === 'mysql' || databaseType === 'both') && (mysqlId || !isNaN(parseInt(dayId, 10)))) {
      const mysqlIdToUse = mysqlId || parseInt(dayId, 10);
      const [updatedRows] = await MySQLTrainingDay.update(
        { dayOfWeek, name, order },
        { where: { id: mysqlIdToUse } }
      );
      
      if (updatedRows > 0) {
        updatedDayMySQL = await MySQLTrainingDay.findByPk(mysqlIdToUse);
        updateSuccess = true;
      }
    }

    if (updateSuccess) {
      const responseData = {
        message: 'Dzień treningowy został zaktualizowany.',
        day: {
          mongoId: updatedDayMongo ? updatedDayMongo._id : null,
          mysqlId: updatedDayMySQL ? updatedDayMySQL.id : null,
          dayOfWeek,
          name,
          order
        }
      };
      
      res.status(200).json(responseData);
    } else {
      res.status(404).json({ error: 'Nie znaleziono dnia treningowego do aktualizacji.' });
    }
  } catch (error) {
    console.error('Błąd aktualizacji dnia treningowego:', error);
    res.status(500).json({ error: 'Błąd aktualizacji dnia treningowego.' });
  }
});

// Usuwanie dnia treningowego
router.delete('/training-days/:id', authenticateToken, async (req, res) => {
  const dayId = req.params.id;
  const { mongoId, mysqlId } = req.query; // Dodane query params dla jednoznacznej identyfikacji

  try {
    let deletedDayMongo = false;
    let deletedDayMySQL = false;

    // MongoDB
    if ((databaseType === 'mongo' || databaseType === 'both') && (mongoId || /^[0-9a-fA-F]{24}$/.test(dayId))) {
      const mongoIdToUse = mongoId || dayId;
      const plan = await MongoTrainingPlan.findOne({ 'days._id': mongoIdToUse });
      if (plan) {
        const dayToRemove = plan.days.id(mongoIdToUse);
        if (dayToRemove) {
          dayToRemove.remove();
          await plan.save();
          deletedDayMongo = true;
        }
      }
    }

    // MySQL
    if ((databaseType === 'mysql' || databaseType === 'both') && (mysqlId || !isNaN(parseInt(dayId, 10)))) {
      const mysqlIdToUse = mysqlId || parseInt(dayId, 10);
      const deletedRows = await MySQLTrainingDay.destroy({ where: { id: mysqlIdToUse } });
      if (deletedRows > 0) deletedDayMySQL = true;
    }

    if (deletedDayMongo || deletedDayMySQL) {
      res.status(200).json({ 
        message: 'Dzień treningowy został usunięty.',
        deleted: {
          mongo: deletedDayMongo,
          mysql: deletedDayMySQL
        }
      });
    } else {
      res.status(404).json({ error: 'Nie znaleziono dnia treningowego do usunięcia.' });
    }
  } catch (error) {
    console.error('Błąd usuwania dnia treningowego:', error);
    res.status(500).json({ error: 'Błąd usuwania dnia treningowego.' });
  }
});

module.exports = router;