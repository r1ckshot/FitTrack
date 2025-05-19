const { sequelize } = require('../config/mysql.config');
const { Transaction } = require('sequelize');

// Pobranie typu bazy danych z .env
const databaseType = process.env.DATABASE_TYPE || 'both';

// Funkcja pomocnicza do poprawnego mapowania ID użytkownika
function getMySQLUserId(user) {
  console.log('DEBUG - req.user w getMySQLUserId:', JSON.stringify(user, null, 2));
  
  if (user.mysqlId) return user.mysqlId;
  if (user.currentUser && user.currentUser.id) return user.currentUser.id;
  if (user.sqlId) return user.sqlId;
  if (user.numericId) return user.numericId;
  
  throw new Error('Nie można ustalić ID użytkownika MySQL');
}

// Bezpieczna operacja MongoDB - ignoruje błędy połączenia gdy baza jest niedostępna
async function safeMongoOperation(operation, fallback = null) {
  if (databaseType !== 'mongo' && databaseType !== 'both') return fallback;

  try {
    return await operation();
  } catch (error) {
    console.log('MongoDB operation failed:', error.message);
    return fallback;
  }
}

// Bezpieczna operacja MySQL z obsługą poziomów izolacji
async function safeMySQLOperation(operation, fallback = null, isolationLevel = Transaction.ISOLATION_LEVELS.REPEATABLE_READ) {
  if (databaseType !== 'mysql' && databaseType !== 'both') return fallback;

  let transaction;

  try {
    // Rozpocznij transakcję z określonym poziomem izolacji
    transaction = await sequelize.transaction({ isolationLevel: isolationLevel });

    // Wykonaj operację w kontekście transakcji
    const result = await operation(transaction);

    // Zatwierdź transakcję
    await transaction.commit();

    return result;
  } catch (error) {
    // Wycofaj transakcję w przypadku błędu
    if (transaction) await transaction.rollback();
    console.log('MySQL operation failed:', error.message);
    return fallback;
  }
}

module.exports = {
  databaseType,
  getMySQLUserId,
  safeMongoOperation,
  safeMySQLOperation,
  Transaction // Eksportujemy również Transaction, aby były dostępne poziomy izolacji
};