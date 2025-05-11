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
//const userRoutes = require('./routes/user.routes');
//app.use('/api', userRoutes);

const authRoutes = require('./routes/auth.routes');
app.use('/api', authRoutes);

const progressRoutes = require('./routes/progress.routes');
app.use('/api', progressRoutes);

const trainingPlansRoutes = require('./routes/trainingPlans.routes');
app.use('/api', trainingPlansRoutes); // Trasy dla Training Plans

const dietPlansRoutes = require('./routes/dietPlans.routes');
app.use('/api', dietPlansRoutes); // Trasy dla Diet Plans

const userProfileRoutes = require('./routes/userProfile.routes');
app.use('/api', userProfileRoutes); 

const plansImportExportRoutes = require('./routes/plansImportExport.routes');
app.use('/api', plansImportExportRoutes); // Trasy dla importu/eksportu planów

const analyticsRoutes = require('./routes/analytics.routes');
app.use('/api', analyticsRoutes); // Trasy dla analiz

const analysisImportExportRoutes = require('./routes/analysesImportExport.routes');
app.use('/api', analysisImportExportRoutes); // Trasy dla importu/eksportu analiz

// Ustawienie portu i uruchomienie serwera
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}.`);
});