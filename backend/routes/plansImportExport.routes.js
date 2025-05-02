const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const xml2js = require('xml2js');
const { js2xml } = require('xml-js');

// Models
const MongoTrainingPlan = require('../models/mongo/TrainingPlan.model');
const MongoDietPlan = require('../models/mongo/DietPlan.model');
const MySQLTrainingModels = require('../models/mysql/TrainingPlan.model');
const MySQLDietModels = require('../models/mysql/DietPlan.model');

// Middleware & Utils
const { authenticateToken } = require('../middlewares/auth.middleware');
const {
  databaseType,
  getMySQLUserId,
  safeMongoOperation,
  safeMySQLOperation,
  Transaction
} = require('../utils/database.utils');

const router = express.Router();

// Destrukturyzacja modeli
const { TrainingPlan: MySQLTrainingPlan, TrainingDay, TrainingExercise } = MySQLTrainingModels;
const { DietPlan: MySQLDietPlan, DietDay, Meal } = MySQLDietModels;

// Konfiguracja multera dla obsługi przesyłanych plików
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limit do 10MB
    fieldSize: 10 * 1024 * 1024 // Limit dla każdego pola formularza
  },
  fileFilter: (req, file, cb) => {
    const allowedFormats = ['application/json', 'text/xml', 'application/xml', 'text/yaml', 'application/x-yaml'];
    const acceptedExts = ['.json', '.xml', '.yaml', '.yml'];

    // Sprawdź rozszerzenie pliku
    const ext = path.extname(file.originalname).toLowerCase();
    if (acceptedExts.includes(ext) || allowedFormats.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Nieprawidłowy format pliku. Akceptowane formaty to JSON, XML lub YAML.'), false);
    }
  }
});

/**
 * Funkcje pomocnicze do obsługi formatów danych
 */

// Funkcja do wykrywania formatu pliku
function detectFileFormat(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.json') return 'json';
  if (ext === '.xml') return 'xml';
  if (['.yaml', '.yml'].includes(ext)) return 'yaml';
  return null;
}

// Funkcja do parsowania danych z pliku do wspólnej struktury
async function parseImportFile(filePath, format) {
  try {
    // Użycie promisów do odczytu pliku zamiast synchronicznego odczytu
    const fileContent = await fs.promises.readFile(filePath, 'utf8');

    // Dodanie obsługi błędów dla każdego formatu
    let parsedData;

    if (format === 'json') {
      try {
        parsedData = JSON.parse(fileContent);
      } catch (jsonError) {
        console.error('Błąd parsowania JSON:', jsonError);
        throw new Error('Nieprawidłowy format pliku JSON.');
      }
    }
    else if (format === 'xml') {
      try {
        parsedData = await new Promise((resolve, reject) => {
          xml2js.parseString(fileContent, { explicitArray: false }, (err, result) => {
            if (err) {
              reject(err);
            } else {
              // Konwersja z formatu XML do wspólnej struktury
              const data = result.plan;
              if (!data || !data.planInfo || !data.days) {
                reject(new Error('Nieprawidłowa struktura pliku XML.'));
                return;
              }
              resolve({
                plan: data.planInfo,
                days: Array.isArray(data.days.day) ? data.days.day : (data.days.day ? [data.days.day] : []),
                items: data.items ? (Array.isArray(data.items.item) ? data.items.item : (data.items.item ? [data.items.item] : [])) : []
              });
            }
          });
        });
      } catch (xmlError) {
        console.error('Błąd parsowania XML:', xmlError);
        throw new Error('Nieprawidłowy format pliku XML.');
      }
    }
    else if (format === 'yaml') {
      try {
        parsedData = yaml.load(fileContent);
      } catch (yamlError) {
        console.error('Błąd parsowania YAML:', yamlError);
        throw new Error('Nieprawidłowy format pliku YAML.');
      }
    } else {
      throw new Error('Nieobsługiwany format pliku.');
    }

    // Podstawowa walidacja struktury danych
    if (!parsedData || !parsedData.plan || !Array.isArray(parsedData.days)) {
      throw new Error('Nieprawidłowa struktura pliku.');
    }

    return parsedData;
  } catch (error) {
    console.error('Błąd parsowania pliku:', error);
    throw error;
  }
}

// Funkcja do serializacji danych do określonego formatu
function serializeToFormat(data, format) {
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }
  else if (format === 'xml') {
    const options = { compact: true, ignoreComment: true, spaces: 2 };
    return js2xml({
      plan: {
        planInfo: data.plan,
        days: { day: data.days },
        items: { item: data.items }
      }
    }, options);
  }
  else if (format === 'yaml') {
    return yaml.dump(data);
  }
  throw new Error('Nieobsługiwany format wyjściowy.');
}

/**
 * Funkcje transformacyjne dla planów treningowych
 */

// Funkcja do ekstrakcji danych treningowych do wspólnej struktury
function extractTrainingPlanData(plan, planType = 'mongo') {
  try {
    if (planType === 'mongo') {
      // Struktura dla MongoDB
      const planData = {
        plan: {
          name: plan.name,
          description: plan.description || '',
          isActive: plan.isActive || false,
          dateCreated: plan.dateCreated,
          dateUpdated: plan.dateUpdated
        },
        days: plan.days.map(day => ({
          dayOfWeek: day.dayOfWeek,
          name: day.name,
          order: day.order
        })),
        items: []
      };

      // Dodajemy ćwiczenia jako listę płaską z referencją do dnia
      plan.days.forEach((day, dayIndex) => {
        if (day.exercises && day.exercises.length > 0) {
          day.exercises.forEach(exercise => {
            planData.items.push({
              dayIndex: dayIndex, // Indeks dnia, do którego należy ćwiczenie
              exerciseId: exercise.exerciseId,
              exerciseName: exercise.exerciseName,
              sets: exercise.sets,
              reps: exercise.reps,
              weight: exercise.weight,
              restTime: exercise.restTime,
              order: exercise.order,
              gifUrl: exercise.gifUrl,
              equipment: exercise.equipment,
              target: exercise.target,
              bodyPart: exercise.bodyPart
            });
          });
        }
      });

      return planData;
    } else {
      // Struktura dla MySQL
      const planData = {
        plan: {
          name: plan.name,
          description: plan.description || '',
          isActive: plan.isActive || false,
          dateCreated: plan.dateCreated,
          dateUpdated: plan.dateUpdated
        },
        days: plan.TrainingDays ? plan.TrainingDays.map(day => ({
          dayOfWeek: day.dayOfWeek,
          name: day.name,
          order: day.order
        })) : [],
        items: []
      };

      // Dodajemy ćwiczenia jako listę płaską z referencją do dnia
      if (plan.TrainingDays) {
        plan.TrainingDays.forEach((day, dayIndex) => {
          if (day.TrainingExercises && day.TrainingExercises.length > 0) {
            day.TrainingExercises.forEach(exercise => {
              planData.items.push({
                dayIndex: dayIndex, // Indeks dnia, do którego należy ćwiczenie
                exerciseId: exercise.exerciseId,
                exerciseName: exercise.exerciseName,
                sets: exercise.sets,
                reps: exercise.reps,
                weight: exercise.weight,
                restTime: exercise.restTime,
                order: exercise.order,
                gifUrl: exercise.gifUrl,
                equipment: exercise.equipment,
                target: exercise.target,
                bodyPart: exercise.bodyPart
              });
            });
          }
        });
      }

      return planData;
    }
  } catch (error) {
    console.error('Błąd podczas ekstraktowania danych planu treningowego:', error);
    throw error;
  }
}

// Funkcja do rekonstrukcji planu treningowego z wspólnej struktury
function reconstructTrainingPlan(importData) {
  try {
    const plan = {
      name: importData.plan.name,
      description: importData.plan.description || '',
      isActive: false,
      days: []
    };

    // Rekonstruujemy dni
    importData.days.forEach((dayData, index) => {
      plan.days.push({
        dayOfWeek: dayData.dayOfWeek,
        name: dayData.name,
        order: dayData.order || index,
        exercises: []
      });
    });

    // Dodajemy ćwiczenia do odpowiednich dni
    importData.items.forEach(item => {
      const dayIndex = item.dayIndex;
      if (plan.days[dayIndex]) {
        plan.days[dayIndex].exercises.push({
          exerciseId: item.exerciseId,
          exerciseName: item.exerciseName,
          sets: item.sets,
          reps: item.reps,
          weight: item.weight,
          restTime: item.restTime,
          order: item.order,
          gifUrl: item.gifUrl,
          equipment: item.equipment,
          target: item.target,
          bodyPart: item.bodyPart
        });
      }
    });

    return plan;
  } catch (error) {
    console.error('Błąd podczas rekonstrukcji planu treningowego:', error);
    throw error;
  }
}

/**
 * Funkcje transformacyjne dla planów dietetycznych
 */

// Funkcja do ekstrakcji danych planu dietetycznego do wspólnej struktury
function extractDietPlanData(plan, planType = 'mongo') {
  try {
    if (planType === 'mongo') {
      // Struktura dla MongoDB
      const planData = {
        plan: {
          name: plan.name,
          description: plan.description || '',
          isActive: plan.isActive || false,
          dateCreated: plan.dateCreated,
          dateUpdated: plan.dateUpdated
        },
        days: plan.days.map(day => ({
          dayOfWeek: day.dayOfWeek,
          name: day.name,
          order: day.order
        })),
        items: []
      };

      // Dodajemy posiłki jako listę płaską z referencją do dnia
      plan.days.forEach((day, dayIndex) => {
        if (day.meals && day.meals.length > 0) {
          day.meals.forEach(meal => {
            planData.items.push({
              dayIndex: dayIndex, // Indeks dnia, do którego należy posiłek
              recipeId: meal.recipeId,
              title: meal.title,
              calories: meal.calories,
              protein: meal.protein,
              carbs: meal.carbs,
              fat: meal.fat,
              image: meal.image,
              recipeUrl: meal.recipeUrl,
              order: meal.order
            });
          });
        }
      });

      return planData;
    } else {
      // Struktura dla MySQL
      const planData = {
        plan: {
          name: plan.name,
          description: plan.description || '',
          isActive: plan.isActive || false,
          dateCreated: plan.dateCreated,
          dateUpdated: plan.dateUpdated
        },
        days: plan.DietDays ? plan.DietDays.map(day => ({
          dayOfWeek: day.dayOfWeek,
          name: day.name,
          order: day.order
        })) : [],
        items: []
      };

      // Dodajemy posiłki jako listę płaską z referencją do dnia
      if (plan.DietDays) {
        plan.DietDays.forEach((day, dayIndex) => {
          if (day.Meals && day.Meals.length > 0) {
            day.Meals.forEach(meal => {
              planData.items.push({
                dayIndex: dayIndex, // Indeks dnia, do którego należy posiłek
                recipeId: meal.recipeId,
                title: meal.title,
                calories: meal.calories,
                protein: meal.protein,
                carbs: meal.carbs,
                fat: meal.fat,
                image: meal.image,
                recipeUrl: meal.recipeUrl,
                order: meal.order
              });
            });
          }
        });
      }

      return planData;
    }
  } catch (error) {
    console.error('Błąd podczas ekstraktowania danych planu dietetycznego:', error);
    throw error;
  }
}

// Funkcja do rekonstrukcji planu dietetycznego z wspólnej struktury
function reconstructDietPlan(importData) {
  try {
    const plan = {
      name: importData.plan.name,
      description: importData.plan.description || '',
      isActive: false,
      days: []
    };

    // Rekonstruujemy dni
    importData.days.forEach((dayData, index) => {
      plan.days.push({
        dayOfWeek: dayData.dayOfWeek,
        name: dayData.name,
        order: dayData.order || index,
        meals: []
      });
    });

    // Dodajemy posiłki do odpowiednich dni
    importData.items.forEach(item => {
      const dayIndex = item.dayIndex;
      if (plan.days[dayIndex]) {
        plan.days[dayIndex].meals.push({
          recipeId: item.recipeId,
          title: item.title,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          image: item.image,
          recipeUrl: item.recipeUrl,
          order: item.order
        });
      }
    });

    return plan;
  } catch (error) {
    console.error('Błąd podczas rekonstrukcji planu dietetycznego:', error);
    throw error;
  }
}

// Funkcja pomocnicza do usuwania istniejącego planu (dla strategii 'replace')
async function deletePlan(planId, planType, userId) {
  try {
    // Konwersja ID użytkownika dla MySQL
    const mysqlUserId = getMySQLUserId({ id: userId });

    if (databaseType === 'mongo' || databaseType === 'both') {
      const PlanModel = planType === 'training' ? MongoTrainingPlan : MongoDietPlan;
      await safeMongoOperation(async () => {
        return await PlanModel.findOneAndDelete({ _id: planId, userId });
      });
    }

    if (databaseType === 'mysql' || databaseType === 'both') {
      // Wywołanie odpowiedniej trasy DELETE dla MySQL
      if (planType === 'training') {
        await safeMySQLOperation(async (transaction) => {
          // Znajdź wszystkie dni dla tego planu
          const days = await TrainingDay.findAll({
            where: { planId: planId },
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
            where: { planId: planId },
            transaction
          });

          // Usuń plan treningu
          return await MySQLTrainingPlan.destroy({
            where: {
              id: planId,
              userId: mysqlUserId
            },
            transaction
          });
        }, 0, Transaction.ISOLATION_LEVELS.SERIALIZABLE);
      } else {
        await safeMySQLOperation(async (transaction) => {
          // Znajdź wszystkie dni dla tego planu
          const days = await DietDay.findAll({
            where: { planId: planId },
            transaction
          });

          // Usuń wszystkie posiłki
          for (const day of days) {
            await Meal.destroy({
              where: { dayId: day.id },
              transaction
            });
          }

          // Usuń wszystkie dni
          await DietDay.destroy({
            where: { planId: planId },
            transaction
          });

          // Usuń plan diety
          return await MySQLDietPlan.destroy({
            where: {
              id: planId,
              userId: mysqlUserId
            },
            transaction
          });
        }, 0, Transaction.ISOLATION_LEVELS.SERIALIZABLE);
      }
    }

    return true;
  } catch (error) {
    console.error(`Błąd podczas usuwania planu: ${error.message}`);
    throw error;
  }
}

// Funkcja pomocnicza do sprawdzania czy plan o danej nazwie już istnieje
async function checkIfPlanExists(planName, planType, userId) {
  try {
    let mongoPlan = null;
    let mysqlPlan = null;

    // Konwersja ID użytkownika dla MySQL
    const mysqlUserId = getMySQLUserId({ id: userId });

    if (databaseType === 'mongo' || databaseType === 'both') {
      const PlanModel = planType === 'training' ? MongoTrainingPlan : MongoDietPlan;
      mongoPlan = await safeMongoOperation(async () => {
        return await PlanModel.findOne({ name: planName, userId });
      });
    }

    if (databaseType === 'mysql' || databaseType === 'both') {
      const PlanModel = planType === 'training' ? MySQLTrainingPlan : MySQLDietPlan;

      mysqlPlan = await safeMySQLOperation(async (transaction) => {
        return await PlanModel.findOne({
          where: {
            name: planName,
            userId: mysqlUserId
          },
          transaction
        });
      }, null, Transaction.ISOLATION_LEVELS.REPEATABLE_READ);
    }

    // Zwróć obiekt zawierający zarówno plan z Mongo, jak i MySQL z ich ID
    return {
      exists: !!(mongoPlan || mysqlPlan),
      mongoId: mongoPlan ? mongoPlan._id : null,
      mysqlId: mysqlPlan ? mysqlPlan.id : null,
      name: planName
    };
  } catch (error) {
    console.error(`Błąd podczas sprawdzania istnienia planu: ${error.message}`);
    throw error;
  }
}

/**
 * ENDPOINTS EKSPORTU
 */

// Export planu treningowego
router.get('/training-plans/:id/export', authenticateToken, async (req, res) => {
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
      }, null, Transaction.ISOLATION_LEVELS.REPEATABLE_READ); // Poziom izolacji dla odczytu

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
});

// Export planu dietetycznego
router.get('/diet-plans/:id/export', authenticateToken, async (req, res) => {
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
      }, null, Transaction.ISOLATION_LEVELS.REPEATABLE_READ); // Poziom izolacji dla odczytu

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
});

/**
 * ENDPOINTS IMPORTU
 */

// Import planu treningowego
router.post('/training-plans/import', authenticateToken, upload.single('file'), async (req, res) => {
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
});

// Import planu dietetycznego
router.post('/diet-plans/import', authenticateToken, upload.single('file'), async (req, res) => {
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
});

module.exports = router;