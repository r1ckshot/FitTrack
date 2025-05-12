const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const xml2js = require('xml2js');
const { js2xml } = require('xml-js');

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

// Destrukturyzacja modeli
const { TrainingPlan: MySQLTrainingPlan, TrainingDay, TrainingExercise } = MySQLTrainingModels;
const { DietPlan: MySQLDietPlan, DietDay, Meal } = MySQLDietModels;

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
        days: plan.days
          .sort((a, b) => a.order - b.order)  // Sortowanie dni według pola order
          .map(day => ({
            dayOfWeek: day.dayOfWeek,
            name: day.name,
            order: day.order
          })),
        items: []
      };

      // Dodajemy ćwiczenia jako listę płaską z referencją do dnia
      plan.days.forEach((day, dayIndex) => {
        if (day.exercises && day.exercises.length > 0) {
          // Sortowanie ćwiczeń według pola order
          const sortedExercises = [...day.exercises].sort((a, b) => a.order - b.order);
          sortedExercises.forEach(exercise => {
            planData.items.push({
              dayIndex: planData.days.findIndex(d => d.order === day.order), // Znajdujemy prawidłowy indeks po sortowaniu
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
        days: plan.TrainingDays ? 
          plan.TrainingDays
            .sort((a, b) => a.order - b.order)  // Sortowanie dni według pola order
            .map(day => ({
              dayOfWeek: day.dayOfWeek,
              name: day.name,
              order: day.order
            })) : [],
        items: []
      };

      // Dodajemy ćwiczenia jako listę płaską z referencją do dnia
      if (plan.TrainingDays) {
        plan.TrainingDays.forEach((day) => {
          const dayIndex = planData.days.findIndex(d => d.order === day.order); // Znajdujemy prawidłowy indeks po sortowaniu
          
          if (day.TrainingExercises && day.TrainingExercises.length > 0) {
            // Sortowanie ćwiczeń według pola order
            const sortedExercises = [...day.TrainingExercises].sort((a, b) => a.order - b.order);
            sortedExercises.forEach(exercise => {
              planData.items.push({
                dayIndex: dayIndex,
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

    // Rekonstruujemy dni (już posortowane)
    importData.days.forEach((dayData, index) => {
      plan.days.push({
        dayOfWeek: dayData.dayOfWeek,
        name: dayData.name,
        order: dayData.order || index,
        exercises: []
      });
    });

    // Grupujemy ćwiczenia według dayIndex
    const exercisesByDay = {};
    importData.items.forEach(item => {
      if (!exercisesByDay[item.dayIndex]) {
        exercisesByDay[item.dayIndex] = [];
      }
      exercisesByDay[item.dayIndex].push(item);
    });

    // Dodajemy posortowane ćwiczenia do odpowiednich dni
    Object.keys(exercisesByDay).forEach(dayIndex => {
      if (plan.days[dayIndex]) {
        // Sortowanie ćwiczeń według pola order
        const sortedExercises = exercisesByDay[dayIndex].sort((a, b) => a.order - b.order);
        
        plan.days[dayIndex].exercises = sortedExercises.map(item => ({
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
        }));
      }
    });

    return plan;
  } catch (error) {
    console.error('Błąd podczas rekonstrukcji planu treningowego:', error);
    throw error;
  }
}

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
        days: plan.days
          .sort((a, b) => a.order - b.order)  // Sortowanie dni według pola order
          .map(day => ({
            dayOfWeek: day.dayOfWeek,
            name: day.name,
            order: day.order
          })),
        items: []
      };

      // Dodajemy posiłki jako listę płaską z referencją do dnia
      plan.days.forEach((day) => {
        const dayIndex = planData.days.findIndex(d => d.order === day.order); // Znajdujemy prawidłowy indeks po sortowaniu
        
        if (day.meals && day.meals.length > 0) {
          // Sortowanie posiłków według pola order
          const sortedMeals = [...day.meals].sort((a, b) => a.order - b.order);
          sortedMeals.forEach(meal => {
            planData.items.push({
              dayIndex: dayIndex,
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
        days: plan.DietDays ? 
          plan.DietDays
            .sort((a, b) => a.order - b.order)  // Sortowanie dni według pola order
            .map(day => ({
              dayOfWeek: day.dayOfWeek,
              name: day.name,
              order: day.order
            })) : [],
        items: []
      };

      // Dodajemy posiłki jako listę płaską z referencją do dnia
      if (plan.DietDays) {
        plan.DietDays.forEach((day) => {
          const dayIndex = planData.days.findIndex(d => d.order === day.order); // Znajdujemy prawidłowy indeks po sortowaniu
          
          if (day.Meals && day.Meals.length > 0) {
            // Sortowanie posiłków według pola order
            const sortedMeals = [...day.Meals].sort((a, b) => a.order - b.order);
            sortedMeals.forEach(meal => {
              planData.items.push({
                dayIndex: dayIndex,
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

// Funkcja do rekonstrukcji planów z wspólnej struktury
function reconstructDietPlan(importData) {
  try {
    const plan = {
      name: importData.plan.name,
      description: importData.plan.description || '',
      isActive: false,
      days: []
    };

    // Rekonstruujemy dni (już posortowane)
    importData.days.forEach((dayData, index) => {
      plan.days.push({
        dayOfWeek: dayData.dayOfWeek,
        name: dayData.name,
        order: dayData.order || index,
        meals: []
      });
    });

    // Grupujemy posiłki według dayIndex
    const mealsByDay = {};
    importData.items.forEach(item => {
      if (!mealsByDay[item.dayIndex]) {
        mealsByDay[item.dayIndex] = [];
      }
      mealsByDay[item.dayIndex].push(item);
    });

    // Dodajemy posortowane posiłki do odpowiednich dni
    Object.keys(mealsByDay).forEach(dayIndex => {
      if (plan.days[dayIndex]) {
        // Sortowanie posiłków według pola order
        const sortedMeals = mealsByDay[dayIndex].sort((a, b) => a.order - b.order);
        
        plan.days[dayIndex].meals = sortedMeals.map(item => ({
          recipeId: item.recipeId,
          title: item.title,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          image: item.image,
          recipeUrl: item.recipeUrl,
          order: item.order
        }));
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

module.exports = {
  detectFileFormat,
  parseImportFile,
  serializeToFormat,
  extractTrainingPlanData,
  reconstructTrainingPlan,
  extractDietPlanData,
  reconstructDietPlan,
  deletePlan,
  checkIfPlanExists
};