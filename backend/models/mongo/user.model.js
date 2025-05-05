const mongoose = require('mongoose');

const User = mongoose.model(
  "User",
  new mongoose.Schema({
    username: {
      type: String,
      required: true,
      unique: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    profileData: {
      firstName: String,
      lastName: String,
      dateOfBirth: Date,
      gender: String,
      weight: Number,
      height: Number
    }
  }, { timestamps: true }) // Automatyczne pola createdAt i updatedAt
);

module.exports = User;