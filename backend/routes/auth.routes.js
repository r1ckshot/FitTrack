const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');

// Rejestracja użytkownika
router.post('/auth/register', AuthController.register);

// Logowanie użytkownika
router.post('/auth/login', AuthController.login);

module.exports = router;