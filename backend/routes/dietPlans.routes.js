const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const DietPlanController = require('../controllers/dietPlan.controller');

// Tworzenie nowego planu diety
router.post('/diet-plans', authenticateToken, DietPlanController.createDietPlan);

// Pobieranie wszystkich planów użytkownika
router.get('/diet-plans', authenticateToken, DietPlanController.getAllDietPlans);

// Pobieranie szczegółów konkretnego planu diety
router.get('/diet-plans/:id', authenticateToken, DietPlanController.getDietPlanById);

// Aktualizacja planu diety
router.put('/diet-plans/:id', authenticateToken, DietPlanController.updateDietPlan);

// Usuwanie planu diety
router.delete('/diet-plans/:id', authenticateToken, DietPlanController.deleteDietPlan);

module.exports = router;