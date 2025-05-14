const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/mysql.config');
const User = require('./user.model');

const Analysis = sequelize.define('Analysis', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  analysisType: {
    type: DataTypes.ENUM('obesity_vs_health_expenditure', 'gdp_vs_physical_activity', 'death_probability_vs_urbanization', 'diabetes_vs_gini_index'),
    allowNull: false
  },
  countryCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  countryName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  periodStart: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  periodEnd: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  correlationValue: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  correlationInterpretation: {
    type: DataTypes.STRING,
    allowNull: true
  },
  result: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Dane do wykresów w formacie JSON
  datasets: {
    type: DataTypes.JSON,
    allowNull: true
  },
  rawData: {
    type: DataTypes.JSON,
    allowNull: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'analyses'
});

// Relacje
User.hasMany(Analysis, { 
  foreignKey: 'userId', 
  as: 'analyses',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  hooks: true
});

Analysis.belongsTo(User, { 
  foreignKey: 'userId', 
  as: 'user',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
  hooks: true
});

module.exports = Analysis;