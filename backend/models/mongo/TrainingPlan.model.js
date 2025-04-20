const mongoose = require('mongoose');
const { Schema } = mongoose;

// Schema for TrainingExercise
const TrainingExerciseSchema = new Schema({
  exerciseId: { type: String, required: true },
  exerciseName: { type: String, required: true },
  sets: { type: Number, required: true },
  reps: { type: Number, required: true },
  weight: { type: Number, default: null },
  restTime: { type: Number, default: null }, 
  order: { type: Number, required: true },
  gifUrl: { type: String, default: null },
  equipment: { type: String, default: null }, 
  target: { type: String, default: null },    
  bodyPart: { type: String, default: null }, 
});

// Schema for TrainingDay
const TrainingDaySchema = new Schema({
  dayOfWeek: { type: String, required: true }, // Dzień tygodnia np. "Monday"
  name: { type: String, required: true }, // Nazwa dnia np. "Push Day"
  order: { type: Number, required: true }, // Kolejność dni w planie
  exercises: [TrainingExerciseSchema], // Lista ćwiczeń przypisanych do dnia
});

// Schema for TrainingPlan
const TrainingPlanSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Referencja do użytkownika
  name: { type: String, required: true }, // Nazwa planu
  description: { type: String, default: '' }, // Opcjonalny opis
  isActive: { type: Boolean, default: false }, // Czy plan jest aktywny
  dateCreated: { type: Date, default: Date.now }, // Data utworzenia
  dateUpdated: { type: Date, default: Date.now }, // Data ostatniej aktualizacji
  days: [TrainingDaySchema], // Lista dni treningowych
});

// Tworzymy model
module.exports = mongoose.model('TrainingPlan', TrainingPlanSchema);