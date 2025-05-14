const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const ProfileController = require('../controllers/profile.controller');

// Pobieranie profilu użytkownika
router.get('/profile', authenticateToken, ProfileController.getProfile);

// Aktualizacja profilu użytkownika
router.put('/profile', authenticateToken, ProfileController.updateProfile);

// Zmiana hasła użytkownika
router.put('/profile/change-password', authenticateToken, ProfileController.changePassword);

// Usuwanie konta użytkownika
router.delete('/profile', authenticateToken, ProfileController.deleteProfile);

module.exports = router;