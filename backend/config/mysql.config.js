const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'fittrack',
  process.env.MYSQL_USER || 'fituser',
  process.env.MYSQL_PASSWORD || 'fitpassword',
  {
    host: process.env.MYSQL_HOST || 'localhost',
    dialect: 'mysql',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const connectMySQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('Połączono z bazą MySQL.');
  } catch (error) {
    console.error('Błąd połączenia z MySQL:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectMySQL };