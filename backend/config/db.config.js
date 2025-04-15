const mongoose = require('mongoose');
require('dotenv').config();

const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Połączono z MongoDB.');
  } catch (error) {
    console.error('Błąd połączenia z MongoDB:', error);
    process.exit(1);
  }
};

module.exports = connectMongoDB;