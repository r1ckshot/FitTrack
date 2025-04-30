const mongoose = require('mongoose');
const ProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  trainingTime: {
    type: Number, // Czas treningu w minutach
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true // To pole nie powinno być zmieniane po utworzeniu
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: false // Wyłączamy automatyczne znaczniki czasowe
});

// Middleware pre-save do aktualizacji updatedAt
ProgressSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Middleware pre-findOneAndUpdate do aktualizacji updatedAt
ProgressSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('Progress', ProgressSchema);