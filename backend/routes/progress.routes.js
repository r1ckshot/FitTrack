const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const ProgressController = require('../controllers/progress.controller');

// Dodaj nowe dane postępów
router.post('/progress', authenticateToken, ProgressController.createProgress);

// Pobierz wszystkie dane postępów
router.get('/progress', authenticateToken, ProgressController.getAllProgress);

// Edytuj dane postępów
router.put('/progress/:id', authenticateToken, ProgressController.updateProgress);

// Usuń dane postępów
router.delete('/progress/:id', authenticateToken, ProgressController.deleteProgress);

module.exports = router;