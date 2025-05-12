const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const AnalyticsController = require('../controllers/analytics.controller');

// Zwraca listę dostępnych krajów
router.get('/analytics/countries', AnalyticsController.getAvailableCountries);

// Zwraca dostępne lata dla danego kraju i typu analizy
router.get('/analytics/available-years', AnalyticsController.getAvailableYears);

// Zwraca dostępne typy analiz
router.get('/analytics/analysis-types', AnalyticsController.getAnalysisTypes);

// Tworzy i zapisuje nową analizę
router.post('/analyses', authenticateToken, AnalyticsController.createAnalysis);

// Pobiera listę zapisanych analiz użytkownika
router.get('/analyses', authenticateToken, AnalyticsController.getAnalyses);

// Pobiera szczegóły konkretnej analizy
router.get('/analyses/:id', authenticateToken, AnalyticsController.getAnalysisById);

// Aktualizacja nazwy istniejącej analizy
router.put('/analyses/:id', authenticateToken, AnalyticsController.updateAnalysis);

// Usunięcie analizy
router.delete('/analyses/:id', authenticateToken, AnalyticsController.deleteAnalysis);

module.exports = router;