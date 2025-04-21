// MySQL Model
const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/mysql.config');

// Model DietPlan
const DietPlan = sequelize.define('DietPlan', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
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

// Model DietDay
const DietDay = sequelize.define('DietDay', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  planId: {
    type: DataTypes.INTEGER,
    references: {
      model: DietPlan,
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

// Model Meal
const Meal = sequelize.define('DietMeal', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  dayId: {
    type: DataTypes.INTEGER,
    references: {
      model: DietDay,
      key: 'id',
    },
    allowNull: false,
  },
  recipeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  calories: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  protein: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  carbs: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fat: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Relacje
DietPlan.hasMany(DietDay, { foreignKey: 'planId', onDelete: 'CASCADE' });
DietDay.belongsTo(DietPlan, { foreignKey: 'planId' });

DietDay.hasMany(Meal, { foreignKey: 'dayId', onDelete: 'CASCADE' });
Meal.belongsTo(DietDay, { foreignKey: 'dayId' });

module.exports = { DietPlan, DietDay, Meal };