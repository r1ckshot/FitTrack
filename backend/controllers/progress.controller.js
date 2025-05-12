const MongoProgress = require('../models/mongo/progress.model');
const MySQLProgress = require('../models/mysql/progress.model');
const { databaseType, getMySQLUserId, safeMongoOperation, safeMySQLOperation, Transaction } = require('../utils/database.utils');

class ProgressController {
    
  // Dodaj nowe dane postępów
  static async createProgress(req, res) {
    const { weight, trainingTime, date } = req.body;

    if (!weight || !trainingTime) {
      return res.status(400).json({ error: "Waga i czas treningu są wymagane." });
    }

    try {
      let createdProgressMongo = null;
      let createdProgressMySQL = null;
      const currentDate = date ? new Date(date) : new Date();
      const currentTimestamp = new Date();

      // Poprawne ID użytkownika dla MySQL
      const mysqlUserId = await getMySQLUserId(req.user);

      // MongoDB - operacja
      if (databaseType === 'mongo' || databaseType === 'both') {
        createdProgressMongo = await safeMongoOperation(async () => {
          const progress = new MongoProgress({
            userId: req.user.id,
            weight,
            trainingTime,
            date: currentDate,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp
          });
          return await progress.save();
        });
      }

      // MySQL - operacja z transakcją
      if (databaseType === 'mysql' || databaseType === 'both') {
        createdProgressMySQL = await safeMySQLOperation(async (transaction) => {
          return await MySQLProgress.create({
            userId: mysqlUserId,
            weight,
            trainingTime,
            date: currentDate,
            createdAt: currentTimestamp,
            updatedAt: currentTimestamp
          }, { transaction });
        }, null, Transaction.ISOLATION_LEVELS.READ_COMMITTED);
      }

      // Odpowiedź
      if (databaseType === 'both' && createdProgressMongo && createdProgressMySQL) {
        const responseData = {
          ...createdProgressMongo.toObject(),
          mysqlId: createdProgressMySQL.id
        };

        res.status(201).json({
          message: 'Postęp został zapisany w obu bazach danych.',
          progress: responseData
        });
      } else if (createdProgressMongo) {
        res.status(201).json({
          message: 'Postęp został zapisany w MongoDB.',
          progress: createdProgressMongo,
        });
      } else if (createdProgressMySQL) {
        res.status(201).json({
          message: 'Postęp został zapisany w MySQL.',
          progress: createdProgressMySQL,
        });
      } else {
        res.status(500).json({ error: 'Nie udało się zapisać postępu.' });
      }
    } catch (error) {
      console.error('Błąd zapisu postępu:', error);
      res.status(500).json({ error: 'Błąd zapisu postępu.' });
    }
  }

  // Pobierz wszystkie dane postępów
  static async getAllProgress(req, res) {
    try {
      let mongoProgress = [];
      let mysqlProgress = [];
      const mysqlUserId = await getMySQLUserId(req.user);

      // MongoDB - zawsze pobieramy jeśli używamy mongo
      if (databaseType === 'mongo' || databaseType === 'both') {
        mongoProgress = await safeMongoOperation(async () => {
          return await MongoProgress.find({ userId: req.user.id }).sort({ date: 1 });
        }, []);
      }

      // MySQL - pobieramy jeśli używamy tylko MySQL (w trybie both używamy tylko MongoDB dla odczytu)
      if (databaseType === 'mysql') {
        mysqlProgress = await safeMySQLOperation(async (transaction) => {
          return await MySQLProgress.findAll({
            where: { userId: mysqlUserId },
            order: [['date', 'ASC']],
            transaction
          });
        }, [], Transaction.ISOLATION_LEVELS.READ_COMMITTED);
      }

      // Odpowiedź zależna od typu bazy danych
      if (databaseType === 'both' || databaseType === 'mongo') {
        res.status(200).json(mongoProgress);
      } else if (databaseType === 'mysql') {
        res.status(200).json(mysqlProgress);
      } else {
        res.status(200).json([]);
      }
    } catch (error) {
      console.error('Błąd pobierania postępów:', error);
      res.status(500).json({ error: 'Błąd pobierania postępów.' });
    }
  }

  // Edytuj dane postępów
  static async updateProgress(req, res) {
    const { weight, trainingTime, date } = req.body;
    const progressId = req.params.id;

    if (!weight || !trainingTime) {
      return res.status(400).json({ error: "Waga i czas treningu są wymagane." });
    }

    try {
      let updatedMongo = null;
      let updatedMySQL = null;
      let mongoId = null;
      let mysqlId = null;
      const currentTimestamp = new Date();

      // Określ odpowiednie ID dla obu baz
      if (/^[0-9a-fA-F]{24}$/.test(progressId)) {
        // Progress ID to MongoDB ObjectID
        mongoId = progressId;

        // Tylko jeśli używamy obu baz danych, spróbuj znaleźć odpowiadający rekord w MySQL
        if (databaseType === 'both') {
          const mongoProg = await safeMongoOperation(async () => {
            return await MongoProgress.findById(mongoId);
          });

          if (mongoProg) {
            const mysqlUserId = await getMySQLUserId(req.user);
            
            // Znajdź rekord w MySQL na podstawie createdAt zamiast date
            // To pozwoli jednoznacznie zidentyfikować rekord
            const mysqlProgs = await safeMySQLOperation(async (transaction) => {
              return await MySQLProgress.findAll({
                where: { 
                  userId: mysqlUserId,
                  createdAt: mongoProg.createdAt  // Używamy createdAt zamiast date
                },
                transaction
              });
            }, [], Transaction.ISOLATION_LEVELS.REPEATABLE_READ);

            if (mysqlProgs && mysqlProgs.length > 0) {
              mysqlId = mysqlProgs[0].id;
            }
          }
        }
      } else {
        // Progress ID to prawdopodobnie MySQL ID
        mysqlId = parseInt(progressId, 10);

        // Tylko jeśli używamy obu baz danych, spróbuj znaleźć odpowiadający rekord w MongoDB
        if (databaseType === 'both' && !isNaN(mysqlId)) {
          const mysqlProg = await safeMySQLOperation(async (transaction) => {
            return await MySQLProgress.findByPk(mysqlId, { transaction });
          }, null, Transaction.ISOLATION_LEVELS.REPEATABLE_READ);

          if (mysqlProg) {
            // Znajdź rekord w MongoDB na podstawie createdAt zamiast date
            const mongoProgs = await safeMongoOperation(async () => {
              return await MongoProgress.find({ 
                userId: req.user.id,
                createdAt: mysqlProg.createdAt  // Używamy createdAt zamiast date
              });
            }, []);

            if (mongoProgs && mongoProgs.length > 0) {
              mongoId = mongoProgs[0]._id;
            }
          }
        }
      }

      // MongoDB - aktualizacja jeśli dostępny
      if ((databaseType === 'mongo' || databaseType === 'both') && mongoId) {
        updatedMongo = await safeMongoOperation(async () => {
          return await MongoProgress.findByIdAndUpdate(
            mongoId,
            { 
              weight, 
              trainingTime, 
              date: date || new Date(),
              updatedAt: currentTimestamp
            },
            { new: true }
          );
        });
      }

      // MySQL - aktualizacja jeśli dostępny
      if ((databaseType === 'mysql' || databaseType === 'both') && mysqlId && !isNaN(mysqlId)) {
        updatedMySQL = await safeMySQLOperation(async (transaction) => {
          // Aktualizacja konkretnego rekordu po id
          await MySQLProgress.update(
            { 
              weight, 
              trainingTime, 
              date: date || new Date(),
              updatedAt: currentTimestamp
            },
            {
              where: { id: mysqlId },
              transaction
            }
          );
          
          // Pobierz zaktualizowany rekord
          return await MySQLProgress.findByPk(mysqlId, { transaction });
        }, null, Transaction.ISOLATION_LEVELS.REPEATABLE_READ);
      }

      // Obsługa odpowiedzi
      if (databaseType === 'both' && updatedMongo && updatedMySQL) {
        const responseData = {
          ...updatedMongo.toObject(),
          mysqlId: mysqlId,
        };
        return res.status(200).json({
          message: 'Postęp został zaktualizowany w obu bazach danych.',
          progress: responseData,
        });
      } else if (updatedMongo) {
        return res.status(200).json({
          message: 'Postęp został zaktualizowany w MongoDB.',
          progress: updatedMongo,
        });
      } else if (updatedMySQL) {
        return res.status(200).json({
          message: 'Postęp został zaktualizowany w MySQL.',
          progress: updatedMySQL,
        });
      }

      res.status(404).json({ error: 'Nie znaleziono postępu do aktualizacji.' });
    } catch (error) {
      console.error('Błąd aktualizacji postępu:', error);
      res.status(500).json({ error: 'Błąd aktualizacji postępu.' });
    }
  }

  // Usuń dane postępów
  static async deleteProgress(req, res) {
    const progressId = req.params.id;
    
    try {
      let isMongoDeleted = false;
      let isMySQLDeleted = false;
      let mongoId = null;
      let mysqlId = null;

      // Określ odpowiednie ID dla obu baz
      if (/^[0-9a-fA-F]{24}$/.test(progressId)) {
        // Progress ID to MongoDB ObjectID
        mongoId = progressId;

        // Tylko jeśli używamy obu baz danych, spróbuj znaleźć odpowiadający rekord w MySQL
        if (databaseType === 'both') {
          const mongoProg = await safeMongoOperation(async () => {
            return await MongoProgress.findById(mongoId);
          });

          if (mongoProg) {
            const mysqlUserId = await getMySQLUserId(req.user);
            
            // Znajdź rekord w MySQL na podstawie createdAt zamiast date
            const mysqlProgs = await safeMySQLOperation(async (transaction) => {
              return await MySQLProgress.findAll({
                where: { 
                  userId: mysqlUserId,
                  createdAt: mongoProg.createdAt  // Używamy createdAt zamiast date
                },
                transaction
              });
            }, [], Transaction.ISOLATION_LEVELS.REPEATABLE_READ);

            if (mysqlProgs && mysqlProgs.length > 0) {
              mysqlId = mysqlProgs[0].id;
            }
          }
        }
      } else {
        // Progress ID to prawdopodobnie MySQL ID
        mysqlId = parseInt(progressId, 10);

        // Tylko jeśli używamy obu baz danych, spróbuj znaleźć odpowiadający rekord w MongoDB
        if (databaseType === 'both' && !isNaN(mysqlId)) {
          const mysqlProg = await safeMySQLOperation(async (transaction) => {
            return await MySQLProgress.findByPk(mysqlId, { transaction });
          }, null, Transaction.ISOLATION_LEVELS.REPEATABLE_READ);

          if (mysqlProg) {
            // Znajdź rekord w MongoDB na podstawie createdAt zamiast date
            const mongoProgs = await safeMongoOperation(async () => {
              return await MongoProgress.find({ 
                userId: req.user.id,
                createdAt: mysqlProg.createdAt  // Używamy createdAt zamiast date
              });
            }, []);

            if (mongoProgs && mongoProgs.length > 0) {
              mongoId = mongoProgs[0]._id;
            }
          }
        }
      }

      // MongoDB - usuwanie jeśli dostępny
      if ((databaseType === 'mongo' || databaseType === 'both') && mongoId) {
        const deletedProg = await safeMongoOperation(async () => {
          return await MongoProgress.findByIdAndDelete(mongoId);
        });
        isMongoDeleted = !!deletedProg;
      }

      // MySQL - usuwanie jeśli dostępny
      if ((databaseType === 'mysql' || databaseType === 'both') && mysqlId && !isNaN(mysqlId)) {
        const deletedRows = await safeMySQLOperation(async (transaction) => {
          // Usunięcie konkretnego rekordu po id
          return await MySQLProgress.destroy({
            where: { id: mysqlId },
            transaction
          });
        }, 0, Transaction.ISOLATION_LEVELS.SERIALIZABLE);
        
        isMySQLDeleted = deletedRows > 0;
      }

      // Obsługa odpowiedzi
      if (databaseType === 'both' && isMongoDeleted && isMySQLDeleted) {
        return res.status(200).json({
          message: 'Postęp został usunięty z obu baz danych.'
        });
      } else if (isMongoDeleted) {
        return res.status(200).json({
          message: 'Postęp został usunięty z MongoDB.'
        });
      } else if (isMySQLDeleted) {
        return res.status(200).json({
          message: 'Postęp został usunięty z MySQL.'
        });
      } else {
        // Jeśli nie udało się usunąć żadnego rekordu
        res.status(404).json({ error: 'Nie znaleziono postępu do usunięcia.' });
      }
    } catch (error) {
      console.error('Błąd usuwania postępu:', error);
      res.status(500).json({ error: 'Błąd usuwania postępu.' });
    }
  }
}

module.exports = ProgressController;