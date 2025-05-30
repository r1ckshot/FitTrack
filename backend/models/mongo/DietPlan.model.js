// MongoDB Model
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Schema for a single Meal
const MealSchema = new Schema({
  recipeId: { type: String, required: true }, // ID przepisu z API Spoonacular
  title: { type: String, required: true }, // Tytuł przepisu
  calories: { type: Number, required: true }, // Kalorie
  protein: { type: Number, required: true }, // Białko (np. "10g")
  carbs: { type: Number, required: true }, // Węglowodany (np. "20g")
  fat: { type: Number, required: true }, // Tłuszcze (np. "5g")
  image: { type: String, default: null }, // URL obrazka przepisu
  recipeUrl: { type: String, default: null }, // URL do przepisu
  order: { type: Number, required: true },
});

// Schema for DietDay
const DietDaySchema = new Schema({
  dayOfWeek: { type: String, required: true }, // Dzień tygodnia np. "Monday"
  name: { type: String, required: true }, // Nazwa dnia np. "Low Carb Monday"
  order: { type: Number, required: true }, // Kolejność dni w planie
  meals: [MealSchema], // Lista posiłków przypisanych do dnia
});

// Schema for DietPlan
const DietPlanSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Referencja do użytkownika
  name: { type: String, required: true }, // Nazwa planu
  description: { type: String, default: '' }, // Opcjonalny opis
  isActive: { type: Boolean, default: false }, // Czy plan jest aktywny
  dateCreated: { type: Date, default: Date.now }, // Data utworzenia
  dateUpdated: { type: Date, default: Date.now }, // Data ostatniej aktualizacji
  days: [DietDaySchema], // Lista dni dietetycznych
});

// Tworzymy model
module.exports = mongoose.model('DietPlan', DietPlanSchema);