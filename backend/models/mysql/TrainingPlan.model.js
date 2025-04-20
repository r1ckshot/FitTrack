const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/mysql.config');

// Model TrainingPlan
const TrainingPlan = sequelize.define('TrainingPlan', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER, // Konwertujemy na INTEGER
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  dateCreated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  dateUpdated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

// Model TrainingDay
const TrainingDay = sequelize.define('TrainingDay', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  planId: {
    type: DataTypes.INTEGER,
    references: {
      model: TrainingPlan,
      key: 'id',
    },
    allowNull: false,
  },
  dayOfWeek: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

// Model TrainingExercise
const TrainingExercise = sequelize.define('TrainingExercise', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  dayId: {
    type: DataTypes.INTEGER,
    references: {
      model: TrainingDay,
      key: 'id',
    },
    allowNull: false,
  },
  exerciseId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  exerciseName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  sets: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  reps: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  weight: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  restTime: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  equipment: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  target: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  bodyPart: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  gifUrl: {
    type: DataTypes.STRING, // URL do animacji/gifa ćwiczenia
    allowNull: true,
  },
});

// Relacje
TrainingPlan.hasMany(TrainingDay, { foreignKey: 'planId', onDelete: 'CASCADE' });
TrainingDay.belongsTo(TrainingPlan, { foreignKey: 'planId' });

TrainingDay.hasMany(TrainingExercise, { foreignKey: 'dayId', onDelete: 'CASCADE' });
TrainingExercise.belongsTo(TrainingDay, { foreignKey: 'dayId' });

module.exports = { TrainingPlan, TrainingDay, TrainingExercise };