const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const connectMongoDB = require('./config/db.config');
const { sequelize } = require('./config/mysql.config');

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Sprawdzamy typ bazy danych z .env
const databaseType = process.env.DATABASE_TYPE || 'both';

// Połączenie z bazami danych na podstawie DATABASE_TYPE
if (databaseType === 'mongo' || databaseType === 'both') {
  connectMongoDB();
}

if (databaseType === 'mysql' || databaseType === 'both') {
  sequelize.sync({ alter: true }) // Synchronizacja z MySQL
    .then(() => console.log('Modele Sequelize zsynchronizowane z bazą MySQL.'))
    .catch(error => console.error('Błąd synchronizacji MySQL:', error));
}

// Prosta trasa testowa
app.get('/', (req, res) => {
  res.json({ message: `API FitTrack działa na bazie: ${databaseType}` });
});

// Import tras
const userRoutes = require('./routes/user.routes');
app.use('/api', userRoutes);

const authRoutes = require('./routes/auth.routes');
app.use('/api', authRoutes);

const progressRoutes = require('./routes/progress.routes');
app.use('/api', progressRoutes);

const trainingPlansRoutes = require('./routes/trainingPlans.routes');
app.use('/api', trainingPlansRoutes); // Trasy dla Training Plans

const trainingDaysRoutes = require('./routes/trainingDays.routes');
app.use('/api', trainingDaysRoutes); // Trasy dla Training Days

const trainingExercisesRoutes = require('./routes/trainingExercises.routes');
app.use('/api', trainingExercisesRoutes); // Trasy dla Training Exercises

// Ustawienie portu i uruchomienie serwera
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}.`);
});