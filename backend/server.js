const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const connectMongoDB = require('./config/db.config');
const { sequelize } = require('./config/mysql.config');

// Połączenie z bazami danych
connectMongoDB();

sequelize.sync({ alter: true }) // Włączy się z MySQL i synchronizuj modele
  .then(() => console.log('Modele Sequelize zsynchronizowane z bazą MySQL.'))
  .catch(error => console.error('Błąd synchronizacji MySQL:', error));

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Prosta trasa testowa
app.get('/', (req, res) => {
  res.json({ message: "Witaj w API FitTrack!" });
});

const userRoutes = require('./routes/user.routes');
app.use('/api', userRoutes);

const authRoutes = require('./routes/auth.routes');
app.use('/api', authRoutes);

// Import i konfiguracja tras (dodamy je później)
// require('./routes/auth.routes')(app);
// require('./routes/user.routes')(app);

// Ustawienie portu i uruchomienie serwera
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}.`);
});