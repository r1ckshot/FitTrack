const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/mysql.config');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dateOfBirth: {
    type: DataTypes.DATE,
    allowNull: true
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: true
  },
  weight: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  height: {
    type: DataTypes.FLOAT,
    allowNull: true
  }
}, {
  timestamps: true, // Automatyczne pola createdAt i updatedAt
  tableName: 'users' // Opcjonalnie: nazwa tabeli w MySQL
});

module.exports = User;