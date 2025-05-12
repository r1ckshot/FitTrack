const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Middleware
const { authenticateToken } = require('../middlewares/auth.middleware');

// Kontroler
const AnalysisImportExportController = require('../controllers/analysisImportExport.controller');

const router = express.Router();

// Konfiguracja multera dla obsługi przesyłanych plików
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limit do 10MB
    fieldSize: 10 * 1024 * 1024 // Limit dla każdego pola formularza
  },
  fileFilter: (req, file, cb) => {
    const allowedFormats = ['application/json', 'text/xml', 'application/xml', 'text/yaml', 'application/x-yaml'];
    const acceptedExts = ['.json', '.xml', '.yaml', '.yml'];

    // Sprawdź rozszerzenie pliku
    const ext = path.extname(file.originalname).toLowerCase();
    if (acceptedExts.includes(ext) || allowedFormats.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Nieprawidłowy format pliku. Akceptowane formaty to JSON, XML lub YAML.'), false);
    }
  }
});

// Eksport analizy
router.get('/analyses/:id/export', authenticateToken, AnalysisImportExportController.exportAnalysis);

// Import analizy
router.post('/analyses/import', authenticateToken, upload.single('file'), AnalysisImportExportController.importAnalysis);

module.exports = router;