const { sequelize } = require('../config/mysql.config');
const { Transaction } = require('sequelize');

// Pobranie typu bazy danych z .env
const databaseType = process.env.DATABASE_TYPE || 'both';

// Funkcja pomocnicza do poprawnego mapowania ID użytkownika
function getMySQLUserId(user) {
  ///console.log('DEBUG - req.user w getMySQLUserId:', JSON.stringify(user, null, 2));

  const databaseType = process.env.DATABASE_TYPE || 'both';
  if (databaseType === 'mongo') {
    return 1; // Domyślne ID dla operacji MySQL gdy używamy tylko MongoDB
  }

  // Najpierw bezpośrednio pole mysqlId, które powinno zawierać liczbowy ID z MySQL
  if (user.mysqlId && typeof user.mysqlId === 'number') return user.mysqlId;

  // Inne możliwe lokalizacje ID MySQL
  if (user.sqlId && typeof user.sqlId === 'number') return user.sqlId;
  if (user.numericId && typeof user.numericId === 'number') return user.numericId;

  // Jeśli wszystkie powyższe zawiodły, sprawdzenie czy mamy dostęp do obiektu użytkownika MySQL
  if (user.currentUser && user.currentUser.id && typeof user.currentUser.id === 'number') {
    return user.currentUser.id;
  }

  throw new Error('Nie można ustalić ID użytkownika MySQL - brak numerycznego identyfikatora');
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