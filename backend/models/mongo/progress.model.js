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
    default: Date.now, // Domyślnie ustaw na aktualną datę
  },
});

module.exports = mongoose.model('Progress', ProgressSchema);