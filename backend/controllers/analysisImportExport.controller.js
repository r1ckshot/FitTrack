const fs = require('fs');
const path = require('path');

// Modele
const MongoAnalysis = require('../models/mongo/Analysis.model');
const MySQLAnalysis = require('../models/mysql/Analysis.model');

// Utility
const {
  databaseType,
  getMySQLUserId,
  safeMongoOperation,
  safeMySQLOperation,
  Transaction
} = require('../utils/database.utils');

const {
  detectFileFormat,
  parseImportFile,
  serializeToFormat,
  extractAnalysisData,
  reconstructAnalysis,
  deleteAnalysis,
  checkIfAnalysisExists
} = require('../utils/analysesImportExport.utils');

class AnalysisImportExportController {
  // Export analizy
  static async exportAnalysis(req, res) {
    try {
      const analysisId = req.params.id;
      const format = req.query.format || 'json'; // domyślnie json

      // Sprawdź, czy format jest obsługiwany
      if (!['json', 'xml', 'yaml'].includes(format)) {
        return res.status(400).json({ error: 'Nieobsługiwany format. Dostępne formaty: json, xml, yaml.' });
      }

      let analysis = null;

      // Pobierz analizę w zależności od typu bazy danych i ID
      if (/^[0-9a-fA-F]{24}$/.test(analysisId) && (databaseType === 'mongo' || databaseType === 'both')) {
        // MongoDB ObjectId
        analysis = await safeMongoOperation(async () => {
          return await MongoAnalysis.findById(analysisId);
        });

        if (analysis) {
          const analysisData = extractAnalysisData(analysis, 'mongo');
          const serializedData = serializeToFormat(analysisData, format);

          // Ustaw odpowiednie nagłówki dla różnych formatów
          if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
          } else if (format === 'xml') {
            res.setHeader('Content-Type', 'application/xml');
          } else if (format === 'yaml') {
            res.setHeader('Content-Type', 'text/yaml');
          }

          res.setHeader('Content-Disposition', `attachment; filename=analysis-${analysis.name.replace(/\s+/g, '-')}.${format}`);
          return res.send(serializedData);
        }
      }
      else if (!isNaN(parseInt(analysisId, 10)) && (databaseType === 'mysql' || databaseType === 'both')) {
        // MySQL ID
        analysis = await safeMySQLOperation(async (transaction) => {
          return await MySQLAnalysis.findByPk(parseInt(analysisId, 10), {
            transaction
          });
        }, null, Transaction.ISOLATION_LEVELS.REPEATABLE_READ); // Poziom izolacji dla odczytu

        if (analysis) {
          const analysisData = extractAnalysisData(analysis, 'mysql');
          const serializedData = serializeToFormat(analysisData, format);

          // Ustaw odpowiednie nagłówki dla różnych formatów
          if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
          } else if (format === 'xml') {
            res.setHeader('Content-Type', 'application/xml');
          } else if (format === 'yaml') {
            res.setHeader('Content-Type', 'text/yaml');
          }

          res.setHeader('Content-Disposition', `attachment; filename=analysis-${analysis.name.replace(/\s+/g, '-')}.${format}`);
          return res.send(serializedData);
        }
      }

      res.status(404).json({ error: 'Analiza nie została znaleziona.' });
    } catch (error) {
      console.error('Błąd eksportu analizy:', error);
      res.status(500).json({ error: 'Błąd eksportu analizy.' });
    }
  }

  // Import analizy
  static async importAnalysis(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Nie przesłano pliku.' });
      }

      // Wykryj format z rozszerzenia pliku
      const format = detectFileFormat(req.file.originalname);
      if (!format) {
        // Usuń plik tymczasowy
        if (req.file && req.file.path) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (err) {
            console.error('Błąd usuwania pliku tymczasowego:', err);
          }
        }
        return res.status(400).json({ error: 'Nie można określić formatu pliku. Obsługiwane formaty to JSON, XML i YAML.' });
      }

      // Parsowanie pliku do wspólnej struktury
      const importData = await parseImportFile(req.file.path, format);

      // Walidacja danych
      if (!importData || !importData.analysis || !importData.analysis.name || !importData.analysis.analysisType) {
        // Usuń plik tymczasowy
        if (req.file && req.file.path) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (err) {
            console.error('Błąd usuwania pliku tymczasowego:', err);
          }
        }
        return res.status(400).json({ error: 'Nieprawidłowa struktura pliku.' });
      }

      // Walidacja typu analizy
      const allowedAnalysisTypes = [
        'obesity_vs_health_expenditure',
        'gdp_vs_physical_activity',
        'death_probability_vs_urbanization',
        'diabetes_vs_gini_index'
      ];

      if (!allowedAnalysisTypes.includes(importData.analysis.analysisType)) {
        // Usuń plik tymczasowy
        if (req.file && req.file.path) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (err) {
            console.error('Błąd usuwania pliku tymczasowego:', err);
          }
        }
        return res.status(400).json({ error: 'Nieprawidłowy typ analizy.' });
      }

      // Pobierz strategię obsługi duplikatów z requestu
      const duplicateStrategy = req.body.duplicateStrategy || 'prefix'; // Domyślnie prefix

      // Sprawdź czy już istnieje analiza o tej nazwie
      const existingAnalysis = await checkIfAnalysisExists(importData.analysis.name, req.user.id);

      if (existingAnalysis.exists) {
        if (duplicateStrategy === 'reject') {
          // Usuń plik tymczasowy
          if (req.file && req.file.path) {
            try {
              fs.unlinkSync(req.file.path);
            } catch (err) {
              console.error('Błąd usuwania pliku tymczasowego:', err);
            }
          }
          return res.status(409).json({
            error: `Analiza o nazwie "${importData.analysis.name}" już istnieje. Import odrzucony.`
          });
        } else if (duplicateStrategy === 'prefix') {
          // Dodaj prefix do nazwy analizy
          importData.analysis.name = `Kopia - ${importData.analysis.name}`;

          // Sprawdź czy analiza z prefiksem już istnieje, jeśli tak - dodaj licznik
          let counter = 1;
          let newName = importData.analysis.name;

          while ((await checkIfAnalysisExists(newName, req.user.id)).exists) {
            counter++;
            newName = `Kopia (${counter}) - ${importData.analysis.name.replace(/^Kopia( \(\d+\))? - /, '')}`;
          }

          importData.analysis.name = newName;
        }
        // Dla strategii 'replace', po prostu kontynuujemy przetwarzanie, a istniejąca analiza zostanie zaktualizowana
      }

      // Rekonstrukcja analizy
      const reconstructedAnalysis = reconstructAnalysis(importData);

      // Dodaj dodatkowe informacje do analizy
      reconstructedAnalysis.userId = req.user.id; // MongoDB

      // Poprawne ID użytkownika dla MySQL
      const mysqlUserId = getMySQLUserId(req.user);

      let createdAnalysisMongo = null;
      let createdAnalysisMySQL = null;

      // Jeśli strategia to 'replace' i istniejąca analiza, usuń ją najpierw
      if (duplicateStrategy === 'replace' && existingAnalysis.exists) {
        if (existingAnalysis.mongoId) {
          await deleteAnalysis(existingAnalysis.mongoId, req.user.id);
        }
        if (existingAnalysis.mysqlId) {
          await deleteAnalysis(existingAnalysis.mysqlId, req.user.id);
        }
      }

      // MongoDB - operacja
      if (databaseType === 'mongo' || databaseType === 'both') {
        createdAnalysisMongo = await safeMongoOperation(async () => {
          const analysis = new MongoAnalysis(reconstructedAnalysis);
          return await analysis.save();
        });
      }

      // MySQL - operacja z transakcją i poziomem izolacji SERIALIZABLE
      if (databaseType === 'mysql' || databaseType === 'both') {
        createdAnalysisMySQL = await safeMySQLOperation(async (transaction) => {
          // Tworzenie analizy
          return await MySQLAnalysis.create({
            userId: mysqlUserId,
            name: reconstructedAnalysis.name,
            analysisType: reconstructedAnalysis.analysisType,
            countryCode: reconstructedAnalysis.country.code,
            countryName: reconstructedAnalysis.country.name,
            periodStart: reconstructedAnalysis.period.start,
            periodEnd: reconstructedAnalysis.period.end,
            correlationValue: reconstructedAnalysis.correlation?.value,
            correlationInterpretation: reconstructedAnalysis.correlation?.interpretation,
            result: reconstructedAnalysis.result,
            datasets: reconstructedAnalysis.datasets,
            rawData: reconstructedAnalysis.rawData,
            title: reconstructedAnalysis.title,
            description: reconstructedAnalysis.description
          }, { transaction });
        }, null, Transaction.ISOLATION_LEVELS.SERIALIZABLE);
      }

      // Usuń plik tymczasowy po zakończeniu operacji
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error('Błąd usuwania pliku tymczasowego:', err);
        }
      }

      // Odpowiedź
      if (databaseType === 'both' && createdAnalysisMongo && createdAnalysisMySQL) {
        res.status(201).json({
          message: 'Analiza została pomyślnie zaimportowana do obu baz danych.',
          analysis: {
            ...createdAnalysisMongo.toObject(),
            mysqlId: createdAnalysisMySQL.id
          }
        });
      } else if (createdAnalysisMongo) {
        res.status(201).json({
          message: 'Analiza została pomyślnie zaimportowana do MongoDB.',
          analysis: createdAnalysisMongo
        });
      } else if (createdAnalysisMySQL) {
        res.status(201).json({
          message: 'Analiza została pomyślnie zaimportowana do MySQL.',
          analysis: createdAnalysisMySQL
        });
      } else {
        // Usuń plik tymczasowy w przypadku błędu
        if (req.file && req.file.path) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (err) {
            console.error('Błąd usuwania pliku tymczasowego:', err);
          }
        }
        res.status(500).json({ error: 'Nie udało się zaimportować analizy.' });
      }
    } catch (error) {
      console.error('Błąd importu analizy:', error);

      // Usuń plik tymczasowy w przypadku błędu
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (err) {
          console.error('Błąd usuwania pliku tymczasowego:', err);
        }
      }

      // Sprawdź, czy to błąd walidacji struktury, jeśli tak - zwróć 400 zamiast 500
      if (error.message && error.message.includes('struktura pliku')) {
        return res.status(400).json({ error: 'Nieprawidłowa struktura pliku.' });
      }

      // Zwróć ogólny komunikat błędu dla innych przypadków
      res.status(500).json({ error: 'Błąd importu analizy: ' + (error.message || 'Nieznany błąd') });
    }
  }
}

module.exports = AnalysisImportExportController;