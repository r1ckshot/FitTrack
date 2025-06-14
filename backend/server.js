const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const connectMongoDB = require('./config/db.config');
const { sequelize } = require('./config/mysql.config');
const syncModels = require('./config/sync.models'); 

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serwowanie plików statycznych
app.use('/public', express.static('public'));

// Sprawdzamy typ bazy danych z .env
const databaseType = process.env.DATABASE_TYPE || 'both';

// Połączenie z bazami danych na podstawie DATABASE_TYPE
if (databaseType === 'mongo' || databaseType === 'both') {
  connectMongoDB();
}

if (databaseType === 'mysql' || databaseType === 'both') {
  syncModels()
    .then(() => console.log('Wszystkie modele Sequelize poprawnie zsynchronizowane z bazą MySQL.'))
    .catch(error => console.error('Błąd synchronizacji MySQL:', error));
}

// Trasa testowa
app.get('/', (req, res) => {
  res.json({ message: `API FitTrack działa na bazie: ${databaseType}` });
});

// Import tras
const authRoutes = require('./routes/auth.routes');
app.use('/api', authRoutes);

const progressRoutes = require('./routes/progress.routes');
app.use('/api', progressRoutes);

const trainingPlansRoutes = require('./routes/trainingPlans.routes');
app.use('/api', trainingPlansRoutes); 

const dietPlansRoutes = require('./routes/dietPlans.routes');
app.use('/api', dietPlansRoutes); 

const profile = require('./routes/profile.routes');
app.use('/api', profile); 

const plansImportExportRoutes = require('./routes/plansImportExport.routes');
app.use('/api', plansImportExportRoutes);

const analyticsRoutes = require('./routes/analytics.routes');
app.use('/api', analyticsRoutes);

const analysisImportExportRoutes = require('./routes/analysesImportExport.routes');
app.use('/api', analysisImportExportRoutes); 

// Ustawienie portu i uruchomienie serwera
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}.`);
});