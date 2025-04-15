const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const connectMongoDB = require('./config/db.config');
const { connectMySQL } = require('./config/mysql.config');

// Połączenie z bazami danych
connectMongoDB();
connectMySQL();

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

// Konfiguracja routingu (będziemy dodawać później)
// require('./routes/auth.routes')(app);
// require('./routes/user.routes')(app);

// Ustawienie portu i uruchomienie serwera
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}.`);
});