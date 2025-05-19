const { sequelize } = require('./mysql.config');
const User = require('../models/mysql/user.model');
const Progress = require('../models/mysql/progress.model');
const { TrainingPlan, TrainingDay, TrainingExercise } = require('../models/mysql/TrainingPlan.model');
const { DietPlan, DietDay, Meal } = require('../models/mysql/DietPlan.model');
const Analysis = require('../models/mysql/Analysis.model');

// Funkcja do synchronizacji modeli w odpowiedniej kolejności
const syncModels = async () => {
  try {
    // 1. Najpierw tabele bazowe (bez kluczy obcych)
    await User.sync({ alter: true });
    console.log('Tabela users zsynchronizowana');
    
    // 2. Następnie tabele z kluczami obcymi do User
    await Promise.all([
      TrainingPlan.sync({ alter: true }),
      DietPlan.sync({ alter: true }),
      Progress.sync({ alter: true }),
      Analysis.sync({ alter: true })
    ]);
    console.log('Tabele planów i postępów zsynchronizowane');
    
    // 3. Na końcu tabele zależne od planów
    await Promise.all([
      TrainingDay.sync({ alter: true }),
      DietDay.sync({ alter: true })
    ]);
    console.log('Tabele dni treningowych i dietetycznych zsynchronizowane');
    
    // 4. Na samym końcu tabele najbardziej zagnieżdżone
    await Promise.all([
      TrainingExercise.sync({ alter: true }),
      Meal.sync({ alter: true })
    ]);
    console.log('Tabele ćwiczeń i posiłków zsynchronizowane');
    
    console.log('Wszystkie modele pomyślnie zsynchronizowane');
  } catch (error) {
    console.error('Błąd podczas synchronizacji modeli:', error);
    throw error;
  }
};

module.exports = syncModels;