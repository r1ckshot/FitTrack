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
},{
  timestamps: false // Wyłączenie automatycznych pól createdAt i updatedAt
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
const Meal = sequelize.define('Meal', {
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
    type: DataTypes.STRING,
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
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  carbs: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  fat: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  recipeUrl: {
    type: DataTypes.STRING,
    allowNull: true, // Nowe pole na URL przepisu
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

// Relacje
DietPlan.hasMany(DietDay, { foreignKey: 'planId', onDelete: 'CASCADE' });
DietDay.belongsTo(DietPlan, { foreignKey: 'planId' });

DietDay.hasMany(Meal, { foreignKey: 'dayId', onDelete: 'CASCADE' });
Meal.belongsTo(DietDay, { foreignKey: 'dayId' });

module.exports = { DietPlan, DietDay, Meal };