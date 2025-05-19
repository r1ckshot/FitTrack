const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const MongoUser = require('../models/mongo/user.model');
const MySQLUser = require('../models/mysql/user.model');
const jwt = require('jsonwebtoken');

class AuthController {
  
  // Rejestracja użytkownika
  static async register(req, res) {
    const { username, email, password } = req.body;
    
    try {
      let userCreated = false;
      let mongoUserId = null;
      let mysqlUserId = null;
      
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
        mongoUserId = mongoUser._id;
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
        mysqlUserId = mysqlUser.id;
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
  }
  
  // Logowanie użytkownika
  static async login(req, res) {
    const { email, password } = req.body;
    
    try {
      let mongoUser = null;
      let mysqlUser = null;
      
      // Próba logowania w MongoDB
      if (process.env.DATABASE_TYPE === 'mongo' || process.env.DATABASE_TYPE === 'both') {
        mongoUser = await MongoUser.findOne({ email });
        if (mongoUser && !(await bcrypt.compare(password, mongoUser.password))) {
          return res.status(401).json({ error: 'Nieprawidłowe hasło.' });
        }
      }
      
      // Próba logowania w MySQL
      if (process.env.DATABASE_TYPE === 'mysql' || process.env.DATABASE_TYPE === 'both') {
        mysqlUser = await MySQLUser.findOne({ where: { email } });
        if (mysqlUser && !(await bcrypt.compare(password, mysqlUser.password))) {
          return res.status(401).json({ error: 'Nieprawidłowe hasło.' });
        }
      }
      
      if (!mongoUser && !mysqlUser) {
        return res.status(404).json({ error: 'Użytkownik nie znaleziony.' });
      }
      
      // Wybierz aktywnego użytkownika (preferujemy MongoDB, jeśli istnieje)
      const activeUser = mongoUser || mysqlUser;
      
      // Generowanie tokena JWT
      const token = jwt.sign(
        {
          id: activeUser._id || activeUser.id,
          username: activeUser.username,
          mysqlId: mysqlUser ? mysqlUser.id : null,
          mongoId: mongoUser ? mongoUser._id.toString() : null
        },
        process.env.JWT_SECRET || 'supersecretkey',
        { expiresIn: '1h' } // Token ważny przez 1 godzinę
      );
      
      res.status(200).json({
        message: 'Logowanie udane.',
        token,
        user: {
          id: activeUser._id || activeUser.id,
          username: activeUser.username,
          email
        },
      });
    } catch (error) {
      console.error('Błąd podczas logowania użytkownika:', error);
      res.status(500).json({ error: 'Błąd podczas logowania użytkownika.' });
    }
  }
}

module.exports = AuthController;