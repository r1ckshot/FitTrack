const fs = require('fs');
const path = require('path');

// Modele
const MongoTrainingPlan = require('../models/mongo/TrainingPlan.model');
const MongoDietPlan = require('../models/mongo/DietPlan.model');
const MySQLTrainingModels = require('../models/mysql/TrainingPlan.model');
const MySQLDietModels = require('../models/mysql/DietPlan.model');

// Utility
const {
  databaseType,
  getMySQLUserId,
  safeMongoOperation,
  safeMySQLOperation,
  Transaction
} = require('../utils/database.utils');

const {
  detectFileFormat,
  parseImportFile,
  serializeToFormat,
  extractTrainingPlanData,
  reconstructTrainingPlan,
  extractDietPlanData,
  reconstructDietPlan,
  deletePlan,
  checkIfPlanExists
} = require('../utils/plansImportExport.utils');

// Destrukturyzacja modeli
const { TrainingPlan: MySQLTrainingPlan, TrainingDay, TrainingExercise } = MySQLTrainingModels;
const { DietPlan: MySQLDietPlan, DietDay, Meal } = MySQLDietModels;

class PlanImportExportController {
  
  // Export planu treningowego
  static async exportTrainingPlan(req, res) {
    try {
      const planId = req.params.id;
      const format = req.query.format || 'json'; // domyślnie json

      // Sprawdź, czy format jest obsługiwany
      if (!['json', 'xml', 'yaml'].includes(format)) {
        return res.status(400).json({ error: 'Nieobsługiwany format. Dostępne formaty: json, xml, yaml.' });
      }

      let plan = null;

      // Pobierz plan treningowy w zależności od typu bazy danych i ID
      if (/^[0-9a-fA-F]{24}$/.test(planId) && (databaseType === 'mongo' || databaseType === 'both')) {
        // MongoDB ObjectId
        plan = await safeMongoOperation(async () => {
          return await MongoTrainingPlan.findById(planId);
        });

        if (plan) {
          const planData = extractTrainingPlanData(plan, 'mongo');
          const serializedData = serializeToFormat(planData, format);

          // Ustaw odpowiednie nagłówki dla różnych formatów
          if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
          } else if (format === 'xml') {
            res.setHeader('Content-Type', 'application/xml');
          } else if (format === 'yaml') {
            res.setHeader('Content-Type', 'text/yaml');
          }

          res.setHeader('Content-Disposition', `attachment; filename=training-plan-${plan.name.replace(/\s+/g, '-')}.${format}`);
          return res.send(serializedData);
        }
      }
      else if (!isNaN(parseInt(planId, 10)) && (databaseType === 'mysql' || databaseType === 'both')) {
        // MySQL ID
        plan = await safeMySQLOperation(async (transaction) => {
          return await MySQLTrainingPlan.findByPk(parseInt(planId, 10), {
            include: [{ model: TrainingDay, include: [TrainingExercise] }],
            transaction
          });
        }, null, Transaction.ISOLATION_LEVELS.REPEATABLE_READ);

        if (plan) {
          const planData = extractTrainingPlanData(plan, 'mysql');
          const serializedData = serializeToFormat(planData, format);

          // Ustaw odpowiednie nagłówki dla różnych formatów
          if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
          } else if (format === 'xml') {
            res.setHeader('Content-Type', 'application/xml');
          } else if (format === 'yaml') {
            res.setHeader('Content-Type', 'text/yaml');
          }

          res.setHeader('Content-Disposition', `attachment; filename=training-plan-${plan.name.replace(/\s+/g, '-')}.${format}`);
          return res.send(serializedData);
        }
      }

      res.status(404).json({ error: 'Plan treningowy nie został znaleziony.' });
    } catch (error) {
      console.error('Błąd eksportu planu treningowego:', error);
      res.status(500).json({ error: 'Błąd eksportu planu treningowego.' });
    }
  }

  // Export planu dietetycznego
  static async exportDietPlan(req, res) {
    try {
      const planId = req.params.id;
      const format = req.query.format || 'json'; // domyślnie json

      // Sprawdź, czy format jest obsługiwany
      if (!['json', 'xml', 'yaml'].includes(format)) {
        return res.status(400).json({ error: 'Nieobsługiwany format. Dostępne formaty: json, xml, yaml.' });
      }

      let plan = null;

      // Pobierz plan dietetyczny w zależności od typu bazy danych i ID
      if (/^[0-9a-fA-F]{24}$/.test(planId) && (databaseType === 'mongo' || databaseType === 'both')) {
        // MongoDB ObjectId
        plan = await safeMongoOperation(async () => {
          return await MongoDietPlan.findById(planId);
        });

        if (plan) {
          const planData = extractDietPlanData(plan, 'mongo');
          const serializedData = serializeToFormat(planData, format);

          // Ustaw odpowiednie nagłówki dla różnych formatów
          if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
          } else if (format === 'xml') {
            res.setHeader('Content-Type', 'application/xml');
          } else if (format === 'yaml') {
            res.setHeader('Content-Type', 'text/yaml');
          }

          res.setHeader('Content-Disposition', `attachment; filename=diet-plan-${plan.name.replace(/\s+/g, '-')}.${format}`);
          return res.send(serializedData);
        }
      }
      else if (!isNaN(parseInt(planId, 10)) && (databaseType === 'mysql' || databaseType === 'both')) {
        // MySQL ID
        plan = await safeMySQLOperation(async (transaction) => {
          return await MySQLDietPlan.findByPk(parseInt(planId, 10), {
            include: [{ model: DietDay, include: [Meal] }],
            transaction
          });
        }, null, Transaction.ISOLATION_LEVELS.REPEATABLE_READ);

        if (plan) {
          const planData = extractDietPlanData(plan, 'mysql');
          const serializedData = serializeToFormat(planData, format);

          // Ustaw odpowiednie nagłówki dla różnych formatów
          if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
          } else if (format === 'xml') {
            res.setHeader('Content-Type', 'application/xml');
          } else if (format === 'yaml') {
            res.setHeader('Content-Type', 'text/yaml');
          }

          res.setHeader('Content-Disposition', `attachment; filename=diet-plan-${plan.name.replace(/\s+/g, '-')}.${format}`);
          return res.send(serializedData);
        }
      }

      res.status(404).json({ error: 'Plan dietetyczny nie został znaleziony.' });
    } catch (error) {
      console.error('Błąd eksportu planu dietetycznego:', error);
      res.status(500).json({ error: 'Błąd eksportu planu dietetycznego.' });
    }
  }

  // Import planu treningowego
  static async importTrainingPlan(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nie przesłano pliku.' });
      }
      
      // Wykryj format z rozszerzenia pliku
      const format = detectFileFormat(req.file.originalname);
      if (!format) {
        // Usuń plik tymczasowy
        if (req.file && req.file.path) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (err) {
            console.error('Błąd usuwania pliku tymczasowego:', err);
          }
        }
        return res.status(400).json({ error: 'Nie można określić formatu pliku. Obsługiwane formaty to JSON, XML i YAML.' });
      }

      // Parsowanie pliku do wspólnej struktury
      const importData = await parseImportFile(req.file.path, format);

      // Walidacja danych
      if (!importData || !importData.plan || !importData.plan.name || !Array.isArray(importData.days)) {
        // Usuń plik tymczasowy
        if (req.file && req.file.path) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (err) {
            console.error('Błąd usuwania pliku tymczasowego:', err);
          }
        }
        return res.status(400).json({ error: 'Nieprawidłowa struktura pliku.' });
      }

      // Pobierz strategię obsługi duplikatów z requestu
      const duplicateStrategy = req.body.duplicateStrategy || 'prefix'; // Domyślnie prefix

      // Sprawdź czy już istnieje plan o tej nazwie
      const existingPlan = await checkIfPlanExists(importData.plan.name, 'training', req.user.id);

      if (existingPlan.exists) {
        if (duplicateStrategy === 'reject') {
          // Usuń plik tymczasowy
          if (req.file && req.file.path) {
            try {
              fs.unlinkSync(req.file.path);
            } catch (err) {
              console.error('Błąd usuwania pliku tymczasowego:', err);
            }
          }
          return res.status(409).json({
            error: `Plan o nazwie "${importData.plan.name}" już istnieje. Import odrzucony.`
          });
        } else if (duplicateStrategy === 'prefix') {
          // Dodaj prefix do nazwy planu
          importData.plan.name = `Kopia - ${importData.plan.name}`;

          // Sprawdź czy plan z prefiksem już istnieje, jeśli tak - dodaj licznik
          let counter = 1;
          let newName = importData.plan.name;

          while ((await checkIfPlanExists(newName, 'training', req.user.id)).exists) {
            counter++;
            newName = `Kopia (${counter}) - ${importData.plan.name.replace(/^Kopia( \(\d+\))? - /, '')}`;
          }

          importData.plan.name = newName;
        }
        // Dla strategii 'replace', po prostu kontynuujemy przetwarzanie, a istniejący plan zostanie zaktualizowany
      }

      // Rekonstrukcja planu treningowego
      const reconstructedPlan = reconstructTrainingPlan(importData);

      // Dodaj dodatkowe informacje do planu
      reconstructedPlan.userId = req.user.id; // MongoDB
      reconstructedPlan.dateCreated = new Date();
      reconstructedPlan.dateUpdated = new Date();

      // Poprawne ID użytkownika dla MySQL
      const mysqlUserId = getMySQLUserId(req.user);

      let createdPlanMongo = null;
      let createdPlanMySQL = null;

      // Jeśli strategia to 'replace' i istniejący plan, usuń go najpierw
      if (duplicateStrategy === 'replace' && existingPlan.exists) {
        if (existingPlan.mongoId) {
          await deletePlan(existingPlan.mongoId, 'training', req.user.id);
        }
        if (existingPlan.mysqlId) {
          await deletePlan(existingPlan.mysqlId, 'training', req.user.id);
        }
      }

      // MongoDB - operacja
      if (databaseType === 'mongo' || databaseType === 'both') {
        createdPlanMongo = await safeMongoOperation(async () => {
          const trainingPlan = new MongoTrainingPlan(reconstructedPlan);
          return await trainingPlan.save();
        });
      }

      // MySQL - operacja z transakcją i poziomem izolacji SERIALIZABLE
      if (databaseType === 'mysql' || databaseType === 'both') {
        createdPlanMySQL = await safeMySQLOperation(async (transaction) => {
          // Tworzenie planu
          const plan = await MySQLTrainingPlan.create({
            userId: mysqlUserId,
            name: reconstructedPlan.name,
            description: reconstructedPlan.description || '',
            isActive: false,
            dateCreated: new Date(),
            dateUpdated: new Date(),
          }, { transaction });

          // Tworzenie dni i ćwiczeń
          if (reconstructedPlan.days && reconstructedPlan.days.length > 0) {
            for (const day of reconstructedPlan.days) {
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
        }, null, Transaction.ISOLATION_LEVELS.SERIALIZABLE);
      }

      // Usuń plik tymczasowy po zakończeniu operacji
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error('Błąd usuwania pliku tymczasowego:', err);
        }
      }

      // Odpowiedź
      if (databaseType === 'both' && createdPlanMongo && createdPlanMySQL) {
        res.status(201).json({
          message: 'Plan treningowy został pomyślnie zaimportowany do obu baz danych.',
          plan: {
            ...createdPlanMongo.toObject(),
            mysqlId: createdPlanMySQL.id
          }
        });
      } else if (createdPlanMongo) {
        res.status(201).json({
          message: 'Plan treningowy został pomyślnie zaimportowany do MongoDB.',
          plan: createdPlanMongo
        });
      } else if (createdPlanMySQL) {
        res.status(201).json({
          message: 'Plan treningowy został pomyślnie zaimportowany do MySQL.',
          plan: createdPlanMySQL
        });
      } else {
        // Usuń plik tymczasowy w przypadku błędu
        if (req.file && req.file.path) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (err) {
            console.error('Błąd usuwania pliku tymczasowego:', err);
          }
        }
        res.status(500).json({ error: 'Nie udało się zaimportować planu treningowego.' });
      }
    } catch (error) {
      console.error('Błąd importu planu treningowego:', error);

      // Usuń plik tymczasowy w przypadku błędu
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error('Błąd usuwania pliku tymczasowego:', err);
        }
      }

      // Sprawdź, czy to błąd walidacji struktury, jeśli tak - zwróć 400 zamiast 500
      if (error.message && error.message.includes('struktura pliku')) {
        return res.status(400).json({ error: 'Nieprawidłowa struktura pliku.' });
      }

      // Zwróć ogólny komunikat błędu dla innych przypadków
      res.status(500).json({ error: 'Błąd importu planu treningowego: ' + (error.message || 'Nieznany błąd') });
    }
  }

  // Import planu dietetycznego
  static async importDietPlan(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nie przesłano pliku.' });
      }

      // Wykryj format z rozszerzenia pliku
      const format = detectFileFormat(req.file.originalname);
      if (!format) {
        // Usuń plik tymczasowy
        if (req.file && req.file.path) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (err) {
            console.error('Błąd usuwania pliku tymczasowego:', err);
          }
        }
        return res.status(400).json({ error: 'Nie można określić formatu pliku. Obsługiwane formaty to JSON, XML i YAML.' });
      }

      // Parsowanie pliku do wspólnej struktury
      const importData = await parseImportFile(req.file.path, format);

      // Walidacja danych
      if (!importData || !importData.plan || !importData.plan.name || !Array.isArray(importData.days)) {
        // Usuń plik tymczasowy
        if (req.file && req.file.path) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (err) {
            console.error('Błąd usuwania pliku tymczasowego:', err);
          }
        }
        return res.status(400).json({ error: 'Nieprawidłowa struktura pliku.' });
      }

      // Pobierz strategię obsługi duplikatów z requestu
      const duplicateStrategy = req.body.duplicateStrategy || 'prefix'; // Domyślnie prefix

      // Sprawdź czy już istnieje plan o tej nazwie
      const existingPlan = await checkIfPlanExists(importData.plan.name, 'diet', req.user.id);

      if (existingPlan.exists) {
        if (duplicateStrategy === 'reject') {
          // Usuń plik tymczasowy
          if (req.file && req.file.path) {
            try {
              fs.unlinkSync(req.file.path);
            } catch (err) {
              console.error('Błąd usuwania pliku tymczasowego:', err);
            }
          }
          return res.status(409).json({
            error: `Plan o nazwie "${importData.plan.name}" już istnieje. Import odrzucony.`
          });
        } else if (duplicateStrategy === 'prefix') {
          // Dodaj prefix do nazwy planu
          importData.plan.name = `Kopia - ${importData.plan.name}`;

          // Sprawdź czy plan z prefiksem już istnieje, jeśli tak - dodaj licznik
          let counter = 1;
          let newName = importData.plan.name;

          while ((await checkIfPlanExists(newName, 'diet', req.user.id)).exists) {
            counter++;
            newName = `Kopia (${counter}) - ${importData.plan.name.replace(/^Kopia( \(\d+\))? - /, '')}`;
          }

          importData.plan.name = newName;
        }
        // Dla strategii 'replace', po prostu kontynuujemy przetwarzanie, a istniejący plan zostanie zaktualizowany
      }

      // Rekonstrukcja planu dietetycznego
      const reconstructedPlan = reconstructDietPlan(importData);

      // Dodaj dodatkowe informacje do planu
      reconstructedPlan.userId = req.user.id; // MongoDB
      reconstructedPlan.dateCreated = new Date();
      reconstructedPlan.dateUpdated = new Date();

      // Poprawne ID użytkownika dla MySQL
      const mysqlUserId = getMySQLUserId(req.user);

      let createdPlanMongo = null;
      let createdPlanMySQL = null;

      // Jeśli strategia to 'replace' i istniejący plan, usuń go najpierw
      if (duplicateStrategy === 'replace' && existingPlan.exists) {
        if (existingPlan.mongoId) {
          await deletePlan(existingPlan.mongoId, 'diet', req.user.id);
        }
        if (existingPlan.mysqlId) {
          await deletePlan(existingPlan.mysqlId, 'diet', req.user.id);
        }
      }

      // MongoDB - operacja
      if (databaseType === 'mongo' || databaseType === 'both') {
        createdPlanMongo = await safeMongoOperation(async () => {
          const dietPlan = new MongoDietPlan(reconstructedPlan);
          return await dietPlan.save();
        });
      }

      // MySQL - operacja z transakcją i poziomem izolacji SERIALIZABLE
      if (databaseType === 'mysql' || databaseType === 'both') {
        createdPlanMySQL = await safeMySQLOperation(async (transaction) => {
          // Tworzenie planu
          const plan = await MySQLDietPlan.create({
            userId: mysqlUserId,
            name: reconstructedPlan.name,
            description: reconstructedPlan.description || '',
            isActive: false,
            dateCreated: new Date(),
            dateUpdated: new Date(),
          }, { transaction });

          // Tworzenie dni i posiłków
          if (reconstructedPlan.days && reconstructedPlan.days.length > 0) {
            for (const day of reconstructedPlan.days) {
              const createdDay = await DietDay.create({
                planId: plan.id,
                dayOfWeek: day.dayOfWeek,
                name: day.name,
                order: day.order,
              }, { transaction });

              if (day.meals && day.meals.length > 0) {
                for (const meal of day.meals) {
                  await Meal.create({
                    dayId: createdDay.id,
                    recipeId: meal.recipeId,
                    title: meal.title,
                    calories: meal.calories || 0,
                    protein: meal.protein || 0,
                    carbs: meal.carbs || 0,
                    fat: meal.fat || 0,
                    image: meal.image,
                    recipeUrl: meal.recipeUrl,
                    order: meal.order,
                  }, { transaction });
                }
              }
            }
          }

          // Pobieranie utworzonego planu z relacjami
          return await MySQLDietPlan.findByPk(plan.id, {
            include: [{ model: DietDay, include: [Meal] }],
            transaction
          });
        }, null, Transaction.ISOLATION_LEVELS.SERIALIZABLE);
      }

      // Usuń plik tymczasowy po zakończeniu operacji
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error('Błąd usuwania pliku tymczasowego:', err);
        }
      }

      // Odpowiedź
      if (databaseType === 'both' && createdPlanMongo && createdPlanMySQL) {
        res.status(201).json({
          message: 'Plan dietetyczny został pomyślnie zaimportowany do obu baz danych.',
          plan: {
            ...createdPlanMongo.toObject(),
            mysqlId: createdPlanMySQL.id
          }
        });
      } else if (createdPlanMongo) {
        res.status(201).json({
          message: 'Plan dietetyczny został pomyślnie zaimportowany do MongoDB.',
          plan: createdPlanMongo
        });
      } else if (createdPlanMySQL) {
        res.status(201).json({
          message: 'Plan dietetyczny został pomyślnie zaimportowany do MySQL.',
          plan: createdPlanMySQL
        });
      } else {
        // Usuń plik tymczasowy w przypadku błędu
        if (req.file && req.file.path) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (err) {
            console.error('Błąd usuwania pliku tymczasowego:', err);
          }
        }
        res.status(500).json({ error: 'Nie udało się zaimportować planu dietetycznego.' });
      }
    } catch (error) {
      console.error('Błąd importu planu dietetycznego:', error);

      // Usuń plik tymczasowy w przypadku błędu
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error('Błąd usuwania pliku tymczasowego:', err);
        }
      }

      // Sprawdź, czy to błąd walidacji struktury, jeśli tak - zwróć 400 zamiast 500
      if (error.message && error.message.includes('struktura pliku')) {
        return res.status(400).json({ error: 'Nieprawidłowa struktura pliku.' });
      }

      // Zwróć ogólny komunikat błędu dla innych przypadków
      res.status(500).json({ error: 'Błąd importu planu dietetycznego: ' + (error.message || 'Nieznany błąd') });
    }
  }
}

module.exports = PlanImportExportController;