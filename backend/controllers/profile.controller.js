const bcrypt = require('bcryptjs');
const MongoUser = require('../models/mongo/user.model');
const MySQLUser = require('../models/mysql/user.model');

class ProfileController {

  // Pobieranie profilu użytkownika
  static async getProfile(req, res) {
    const username = req.user.username;
    const databaseType = process.env.DATABASE_TYPE || 'both';

    try {
      let user = null;

      const userFromMongo = (databaseType === 'mongo' || databaseType === 'both')
        ? await MongoUser.findOne({ username }).select('-password')
        : null;

      const userFromMySQL = (databaseType === 'mysql' || databaseType === 'both')
        ? await MySQLUser.findOne({ where: { username }, attributes: { exclude: ['password'] } })
        : null;

      if (userFromMongo || userFromMySQL) {
        user = {
          id: userFromMongo?._id || userFromMySQL?.id,
          username: username,
          email: userFromMongo?.email || userFromMySQL?.email,
          profileData: userFromMongo?.profileData || {
            firstName: userFromMySQL?.firstName,
            lastName: userFromMySQL?.lastName,
            dateOfBirth: userFromMySQL?.dateOfBirth,
            gender: userFromMySQL?.gender,
            weight: userFromMySQL?.weight,
            height: userFromMySQL?.height
          },
          createdAt: userFromMongo?.createdAt || userFromMySQL?.createdAt,
          updatedAt: userFromMongo?.updatedAt || userFromMySQL?.updatedAt
        };
      }

      if (!user) {
        return res.status(404).json({ error: 'Użytkownik nie został znaleziony.' });
      }

      res.status(200).json(user);
    } catch (error) {
      console.error('Błąd podczas pobierania profilu użytkownika:', error);
      res.status(500).json({ error: 'Błąd podczas pobierania profilu użytkownika.' });
    }
  }

  // Aktualizacja profilu użytkownika
  static async updateProfile(req, res) {
    const username = req.user.username;
    const { firstName, lastName, dateOfBirth, gender, weight, height } = req.body;
    const databaseType = process.env.DATABASE_TYPE || 'both';

    try {
      let updatedInMongo = false;
      let updatedInMySQL = false;

      // Zaktualizuj MongoDB (jeśli jest używane)
      if (databaseType === 'mongo' || databaseType === 'both') {
        const mongoUser = await MongoUser.findOne({ username });
        if (mongoUser) {
          mongoUser.profileData = {
            firstName: firstName ?? mongoUser.profileData?.firstName,
            lastName: lastName ?? mongoUser.profileData?.lastName,
            dateOfBirth: dateOfBirth ?? mongoUser.profileData?.dateOfBirth,
            gender: gender ?? mongoUser.profileData?.gender,
            weight: weight ?? mongoUser.profileData?.weight,
            height: height ?? mongoUser.profileData?.height
          };
          await mongoUser.save();
          updatedInMongo = true;
        }
      }

      // Zaktualizuj MySQL (jeśli jest używane)
      if (databaseType === 'mysql' || databaseType === 'both') {
        const mysqlUser = await MySQLUser.findOne({ where: { username } });
        if (mysqlUser) {
          const updateData = {};
          
          // Jeśli pole jest puste, ustaw NULL
          if (firstName !== undefined) updateData.firstName = firstName;
          if (lastName !== undefined) updateData.lastName = lastName;
          if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth ? dateOfBirth : null;
          if (gender !== undefined) updateData.gender = gender ? gender : null;
          if (weight !== undefined) updateData.weight = weight ? weight : null;
          if (height !== undefined) updateData.height = height ? height : null;

          await mysqlUser.update(updateData);
          updatedInMySQL = true;
        }
      }

      if (updatedInMongo || updatedInMySQL) {
        return res.status(200).json({
          message: 'Profil użytkownika został zaktualizowany.',
          updated: { mongo: updatedInMongo, mysql: updatedInMySQL }
        });
      } else {
        return res.status(404).json({ error: 'Nie znaleziono użytkownika do aktualizacji.' });
      }
    } catch (error) {
      console.error('Błąd podczas aktualizacji profilu użytkownika:', error);
      res.status(500).json({ error: 'Błąd podczas aktualizacji profilu użytkownika.' });
    }
  }

  // Zmiana hasła użytkownika
  static async changePassword(req, res) {
    const username = req.user.username;
    const { currentPassword, newPassword } = req.body;
    const databaseType = process.env.DATABASE_TYPE || 'both';

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Obecne i nowe hasło są wymagane.' });
    }

    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      let passwordVerified = false;
      let updatedInMongo = false;
      let updatedInMySQL = false;

      // Sprawdź hasło w Mongo
      const mongoUser = (databaseType === 'mongo' || databaseType === 'both')
        ? await MongoUser.findOne({ username })
        : null;

      if (mongoUser && await bcrypt.compare(currentPassword, mongoUser.password)) {
        passwordVerified = true;
      }

      // Sprawdź hasło w MySQL, jeśli nie było wcześniej potwierdzone
      const mysqlUser = (databaseType === 'mysql' || databaseType === 'both')
        ? await MySQLUser.findOne({ where: { username } })
        : null;

      if (!passwordVerified && mysqlUser && await bcrypt.compare(currentPassword, mysqlUser.password)) {
        passwordVerified = true;
      }

      if (!passwordVerified) {
        return res.status(400).json({ error: 'Obecne hasło jest nieprawidłowe.' });
      }

      // Zaktualizuj Mongo
      if (mongoUser) {
        mongoUser.password = hashedPassword;
        await mongoUser.save();
        updatedInMongo = true;
      }

      // Zaktualizuj MySQL
      if (mysqlUser) {
        await mysqlUser.update({ password: hashedPassword });
        updatedInMySQL = true;
      }

      res.status(200).json({
        message: 'Hasło zostało zmienione pomyślnie.',
        updated: { mongo: updatedInMongo, mysql: updatedInMySQL }
      });
    } catch (error) {
      console.error('Błąd podczas zmiany hasła:', error);
      res.status(500).json({ error: 'Błąd podczas zmiany hasła.' });
    }
  }

  // Usuwanie konta użytkownika
  static async deleteProfile(req, res) {
    const username = req.user.username;
    const databaseType = process.env.DATABASE_TYPE || 'both';

    try {
      let deletedInMongo = false;
      let deletedInMySQL = false;

      if (databaseType === 'mongo' || databaseType === 'both') {
        const result = await MongoUser.findOneAndDelete({ username });
        if (result) deletedInMongo = true;
      }

      if (databaseType === 'mysql' || databaseType === 'both') {
        const deletedRows = await MySQLUser.destroy({ where: { username } });
        if (deletedRows > 0) deletedInMySQL = true;
      }

      if (deletedInMongo || deletedInMySQL) {
        return res.status(200).json({
          message: 'Konto użytkownika zostało usunięte.',
          deleted: { mongo: deletedInMongo, mysql: deletedInMySQL }
        });
      } else {
        return res.status(404).json({ error: 'Nie znaleziono użytkownika do usunięcia.' });
      }
    } catch (error) {
      console.error('Błąd podczas usuwania konta użytkownika:', error);
      res.status(500).json({ error: 'Błąd podczas usuwania konta użytkownika.' });
    }
  }
}

module.exports = ProfileController;