const express = require('express');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize'); 
const MongoUser = require('../models/mongo/user.model');
const MySQLUser = require('../models/mysql/user.model');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Rejestracja użytkownika
router.post('/auth/register', async (req, res) => {
  const { username, email, password, role, accessCode } = req.body;

  try {
    // Sprawdzanie roli i kodu dostępu
    if (role === 'trainer' && accessCode !== process.env.TRAINER_ACCESS_CODE) {
      return res.status(400).json({ error: 'Nieprawidłowy kod dostępu dla trenera.' });
    }

    if (role === 'admin' && accessCode !== process.env.ADMIN_ACCESS_CODE) {
      return res.status(400).json({ error: 'Nieprawidłowy kod dostępu dla administratora.' });
    }

    // Sprawdzenie, czy użytkownik istnieje w MongoDB
    const existingMongoUser = await MongoUser.findOne({ $or: [{ username }, { email }] });
    if (existingMongoUser) {
      return res.status(400).json({ error: 'Użytkownik już istnieje.' });
    }

    // Sprawdzenie, czy użytkownik istnieje w MySQL
    const existingMySQLUser = await MySQLUser.findOne({
      where: { [Op.or]: [{ username }, { email }] } 
    });
    if (existingMySQLUser) {
      return res.status(400).json({ error: 'Użytkownik już istnieje.' });
    }

    // Hashowanie hasła
    const hashedPassword = await bcrypt.hash(password, 10);

    // Zapis użytkownika w MongoDB
    const mongoUser = new MongoUser({
      username,
      email,
      password: hashedPassword,
      role
    });
    await mongoUser.save();

    // Zapis użytkownika w MySQL
    const mysqlUser = await MySQLUser.create({
      username,
      email,
      password: hashedPassword,
      role
    });

    res.status(201).json({ message: 'Użytkownik zarejestrowany pomyślnie.', mongoUser, mysqlUser });
  } catch (error) {
    console.error('Błąd podczas rejestracji użytkownika:', error);
    res.status(500).json({ error: 'Błąd podczas rejestracji użytkownika.' });
  }
});

// Logowanie użytkownika
router.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Sprawdzenie, czy użytkownik istnieje w MongoDB
      const mongoUser = await MongoUser.findOne({ email });
      const mysqlUser = await MySQLUser.findOne({ where: { email } });
  
      if (!mongoUser && !mysqlUser) {
        return res.status(404).json({ error: 'Użytkownik nie znaleziony.' });
      }
  
      // Weryfikacja hasła (MongoDB)
      if (mongoUser && !(await bcrypt.compare(password, mongoUser.password))) {
        return res.status(401).json({ error: 'Nieprawidłowe hasło.' });
      }
  
      // Weryfikacja hasła (MySQL)
      if (mysqlUser && !(await bcrypt.compare(password, mysqlUser.password))) {
        return res.status(401).json({ error: 'Nieprawidłowe hasło.' });
      }
  
      // Generowanie tokena JWT
      const token = jwt.sign(
        {
          id: mongoUser?._id || mysqlUser.id,
          username: mongoUser?.username || mysqlUser.username,
          role: mongoUser?.role || mysqlUser.role,
        },
        process.env.JWT_SECRET || 'supersecretkey',
        { expiresIn: '1h' } // Token ważny przez 1 godzinę
      );
  
      res.status(200).json({
        message: 'Logowanie udane.',
        token,
        user: {
          id: mongoUser?._id || mysqlUser.id,
          username: mongoUser?.username || mysqlUser.username,
          email,
          role: mongoUser?.role || mysqlUser.role,
        },
      });
    } catch (error) {
      console.error('Błąd podczas logowania użytkownika:', error);
      res.status(500).json({ error: 'Błąd podczas logowania użytkownika.' });
    }
  });

module.exports = router;