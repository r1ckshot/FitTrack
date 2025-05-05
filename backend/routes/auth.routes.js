const express = require('express');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize'); 
const MongoUser = require('../models/mongo/user.model');
const MySQLUser = require('../models/mysql/user.model');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Rejestracja użytkownika
router.post('/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    let userCreated = false;

    // Rejestracja w MongoDB
    if (process.env.DATABASE_TYPE === 'mongo' || process.env.DATABASE_TYPE === 'both') {
      const existingMongoUser = await MongoUser.findOne({ $or: [{ username }, { email }] });
      if (existingMongoUser) {
        return res.status(400).json({ error: 'Użytkownik już istnieje.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const mongoUser = new MongoUser({
        username,
        email,
        password: hashedPassword
      });
      await mongoUser.save();
      userCreated = true;
    }

    // Rejestracja w MySQL
    if (process.env.DATABASE_TYPE === 'mysql' || process.env.DATABASE_TYPE === 'both') {
      const existingMySQLUser = await MySQLUser.findOne({
        where: { [Op.or]: [{ username }, { email }] }
      });
      if (existingMySQLUser) {
        return res.status(400).json({ error: 'Użytkownik już istnieje.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const mysqlUser = await MySQLUser.create({
        username,
        email,
        password: hashedPassword
      });
      userCreated = true;
    }

    if (userCreated) {
      return res.status(201).json({ message: 'Użytkownik zarejestrowany pomyślnie.' });
    } else {
      return res.status(500).json({ error: 'Nie udało się zarejestrować użytkownika.' });
    }
  } catch (error) {
    console.error('Błąd podczas rejestracji użytkownika:', error);
    res.status(500).json({ error: 'Błąd podczas rejestracji użytkownika.' });
  }
});

// Logowanie użytkownika
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = null;

    // Próba logowania w MongoDB
    if (process.env.DATABASE_TYPE === 'mongo' || process.env.DATABASE_TYPE === 'both') {
      user = await MongoUser.findOne({ email });
      if (user && !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Nieprawidłowe hasło.' });
      }
    }

    // Próba logowania w MySQL
    if ((process.env.DATABASE_TYPE === 'mysql' || process.env.DATABASE_TYPE === 'both') && !user) {
      user = await MySQLUser.findOne({ where: { email } });
      if (user && !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Nieprawidłowe hasło.' });
      }
    }

    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony.' });
    }

    // Generowanie tokena JWT
    const token = jwt.sign(
      {
        id: user._id || user.id,
        username: user.username
      },
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: '1h' } // Token ważny przez 1 godzinę
    );

    res.status(200).json({
      message: 'Logowanie udane.',
      token,
      user: {
        id: user._id || user.id,
        username: user.username,
        email
      },
    });
  } catch (error) {
    console.error('Błąd podczas logowania użytkownika:', error);
    res.status(500).json({ error: 'Błąd podczas logowania użytkownika.' });
  }
});

module.exports = router;