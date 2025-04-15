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
    role: {
      type: String,
      enum: ['client', 'trainer', 'admin'],
      default: 'client'
    },
    profileData: {
      firstName: String,
      lastName: String,
      dateOfBirth: Date,
      gender: String,
      weight: Number,
      height: Number
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  })
);

module.exports = User;