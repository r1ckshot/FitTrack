const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/mysql.config');

const Progress = sequelize.define('Progress', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  weight: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  trainingTime: {
    type: DataTypes.INTEGER, // Czas treningu w minutach
    allowNull: false,
  },
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false, // Wyłączamy automatyczne znaczniki czasowe
  tableName: 'progress',
  hooks: {
    beforeCreate: (record) => {
      record.createdAt = new Date();
      record.updatedAt = new Date();
    },
    beforeUpdate: (record) => {
      record.updatedAt = new Date();
    }
  }
});

module.exports = Progress;
