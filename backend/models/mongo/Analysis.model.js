const mongoose = require('mongoose');

const AnalysisSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  analysisType: {
    type: String,
    required: true,
    enum: [
      'obesity_vs_health_expenditure',
      'gdp_vs_physical_activity',
      'death_probability_vs_urbanization',
      'diabetes_vs_gini_index'
    ]
  },
  country: {
    code: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  period: {
    start: {
      type: Number,
      required: true
    },
    end: {
      type: Number,
      required: true
    }
  },
  correlation: {
    value: Number,
    interpretation: String
  },
  result: {
    type: String
  },
  datasets: {
    years: [Number],
    healthData: [Number],
    economicData: [Number]
  },
  rawData: [{
    year: Number,
    healthValue: Number,
    economicValue: Number
  }],
  title: String,
  description: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true }); // Automatyczne pola createdAt i updatedAt

module.exports = mongoose.model('Analysis', AnalysisSchema);