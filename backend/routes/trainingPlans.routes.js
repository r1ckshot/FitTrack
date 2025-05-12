const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const TrainingPlanController = require('../controllers/trainingPlan.controller');

// Tworzenie nowego planu treningowego
router.post('/training-plans', authenticateToken, TrainingPlanController.createTrainingPlan);

// Pobieranie wszystkich planów użytkownika
router.get('/training-plans', authenticateToken, TrainingPlanController.getAllTrainingPlans);

// Pobieranie szczegółów konkretnego planu
router.get('/training-plans/:id', authenticateToken, TrainingPlanController.getTrainingPlanById);

// Aktualizacja planu treningowego
router.put('/training-plans/:id', authenticateToken, TrainingPlanController.updateTrainingPlan);

// Usuwanie planu treningowego
router.delete('/training-plans/:id', authenticateToken, TrainingPlanController.deleteTrainingPlan);

module.exports = router;