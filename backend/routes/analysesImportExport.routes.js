const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const xml2js = require('xml2js');
const { js2xml } = require('xml-js');

// Models
const MongoAnalysis = require('../models/mongo/Analysis.model');
const MySQLAnalysis = require('../models/mysql/Analysis.model');

// Middleware & Utils
const { authenticateToken } = require('../middlewares/auth.middleware');
const {
  databaseType,
  getMySQLUserId,
  safeMongoOperation,
  safeMySQLOperation,
  Transaction
} = require('../utils/database.utils');

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

/**
 * Funkcje pomocnicze do obsługi formatów danych
 */

// Funkcja do wykrywania formatu pliku
function detectFileFormat(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.json') return 'json';
  if (ext === '.xml') return 'xml';
  if (['.yaml', '.yml'].includes(ext)) return 'yaml';
  return null;
}

// Funkcja do parsowania danych z pliku do wspólnej struktury
async function parseImportFile(filePath, format) {
  try {
    // Użycie promisów do odczytu pliku zamiast synchronicznego odczytu
    const fileContent = await fs.promises.readFile(filePath, 'utf8');

    // Dodanie obsługi błędów dla każdego formatu
    let parsedData;

    if (format === 'json') {
      try {
        parsedData = JSON.parse(fileContent);
      } catch (jsonError) {
        console.error('Błąd parsowania JSON:', jsonError);
        throw new Error('Nieprawidłowy format pliku JSON.');
      }
    }
    else if (format === 'xml') {
      try {
        parsedData = await new Promise((resolve, reject) => {
          xml2js.parseString(fileContent, { explicitArray: false }, (err, result) => {
            if (err) {
              reject(err);
            } else {
              // Konwersja z formatu XML do wspólnej struktury
              const data = result.analysis;
              if (!data || !data.analysisInfo || !data.datasets) {
                reject(new Error('Nieprawidłowa struktura pliku XML.'));
                return;
              }
              resolve({
                analysis: data.analysisInfo,
                datasets: data.datasets,
                rawData: data.rawData ? (Array.isArray(data.rawData.item) ? data.rawData.item : (data.rawData.item ? [data.rawData.item] : [])) : []
              });
            }
          });
        });
      } catch (xmlError) {
        console.error('Błąd parsowania XML:', xmlError);
        throw new Error('Nieprawidłowy format pliku XML.');
      }
    }
    else if (format === 'yaml') {
      try {
        parsedData = yaml.load(fileContent);
      } catch (yamlError) {
        console.error('Błąd parsowania YAML:', yamlError);
        throw new Error('Nieprawidłowy format pliku YAML.');
      }
    } else {
      throw new Error('Nieobsługiwany format pliku.');
    }

    // Podstawowa walidacja struktury danych
    if (!parsedData || !parsedData.analysis || !parsedData.datasets) {
      throw new Error('Nieprawidłowa struktura pliku.');
    }

    return parsedData;
  } catch (error) {
    console.error('Błąd parsowania pliku:', error);
    throw error;
  }
}

// Funkcja do serializacji danych do określonego formatu
function serializeToFormat(data, format) {
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }
  else if (format === 'xml') {
    // Zamiast używać biblioteki xml-js, użyjemy xml2js do tworzenia XML
    const xml2js = require('xml2js');

    try {
      // Klonowanie obiektu, aby uniknąć modyfikacji oryginalnych danych
      const preparedData = JSON.parse(JSON.stringify(data));

      // Tworzenie odpowiedniej struktury dla XML Builder
      const xmlObj = {
        analysis: {
          $: { version: '1.0' }, // Dodanie atrybutu wersji
          analysisInfo: preparedData.analysis,
          datasets: preparedData.datasets,
          rawData: {
            item: Array.isArray(preparedData.rawData) ? preparedData.rawData : []
          }
        }
      };

      // Tworzenie instancji buildera XML
      const builder = new xml2js.Builder({
        rootName: 'root',
        headless: true,
        renderOpts: { pretty: true, indent: '  ' }
      });

      // Tworzenie dokumentu XML
      return builder.buildObject(xmlObj);
    } catch (error) {
      console.error('Błąd podczas konwersji do XML:', error);
      throw new Error(`Błąd konwersji XML: ${error.message}`);
    }
  }
  else if (format === 'yaml') {
    const yaml = require('js-yaml');
    return yaml.dump(data);
  }
  throw new Error('Nieobsługiwany format wyjściowy.');
}

/**
 * Funkcje transformacyjne dla analiz
 */

// Funkcja do ekstrakcji danych analizy do wspólnej struktury
function extractAnalysisData(analysis, analysisType = 'mongo') {
  try {
    let analysisData;
    
    if (analysisType === 'mongo') {
      // Struktura dla MongoDB
      analysisData = {
        analysis: {
          name: analysis.name,
          analysisType: analysis.analysisType,
          title: analysis.title || '',
          description: analysis.description || '',
          country: {
            code: analysis.country.code,
            name: analysis.country.name
          },
          period: {
            start: analysis.period.start,
            end: analysis.period.end
          },
          correlation: {
            value: analysis.correlation?.value,
            interpretation: analysis.correlation?.interpretation
          },
          result: analysis.result || ''
        },
        datasets: {
          years: analysis.datasets?.years || [],
          healthData: analysis.datasets?.healthData || [],
          economicData: analysis.datasets?.economicData || []
        },
        // Głębokie klonowanie i oczyszczanie rawData
        rawData: JSON.parse(JSON.stringify(analysis.rawData || []))
      };

      // Usuwamy pola _id z każdego elementu rawData
      if (Array.isArray(analysisData.rawData)) {
        analysisData.rawData = analysisData.rawData.map(item => {
          // Tworzy nowy obiekt bez pola _id
          const { _id, ...cleanItem } = item;
          return cleanItem;
        });
      }
    } else {
      // Struktura dla MySQL (bez zmian)
      analysisData = {
        analysis: {
          name: analysis.name,
          analysisType: analysis.analysisType,
          title: analysis.title || '',
          description: analysis.description || '',
          country: {
            code: analysis.countryCode,
            name: analysis.countryName
          },
          period: {
            start: analysis.periodStart,
            end: analysis.periodEnd
          },
          correlation: {
            value: analysis.correlationValue || null,
            interpretation: analysis.correlationInterpretation
          },
          result: analysis.result || ''
        },
        datasets: analysis.datasets || {
          years: [],
          healthData: [],
          economicData: []
        },
        rawData: analysis.rawData || []
      };
    }

    return analysisData;
  } catch (error) {
    console.error('Błąd podczas ekstraktowania danych analizy:', error);
    throw error;
  }
}

// Funkcja do rekonstrukcji analizy z wspólnej struktury
function reconstructAnalysis(importData) {
  try {
    // Parsowanie wartości korelacji
    const rawCorr = importData.analysis.correlation?.value;
    const correlationValue = (rawCorr !== undefined && rawCorr !== null && rawCorr !== '')
      ? parseFloat(rawCorr)
      : null;

    // Normalizacja danych do tablic
    const ds = importData.datasets || {};
    const years = ds.years !== undefined
      ? (Array.isArray(ds.years) ? ds.years : [ds.years])
      : [];
    const healthData = ds.healthData !== undefined
      ? (Array.isArray(ds.healthData) ? ds.healthData : [ds.healthData])
      : [];
    const economicData = ds.economicData !== undefined
      ? (Array.isArray(ds.economicData) ? ds.economicData : [ds.economicData])
      : [];

    const analysis = {
      name: importData.analysis.name,
      analysisType: importData.analysis.analysisType,
      title: importData.analysis.title || '',
      description: importData.analysis.description || '',
      country: {
        code: importData.analysis.country.code,
        name: importData.analysis.country.name
      },
      period: {
        start: Number(importData.analysis.period.start),
        end: Number(importData.analysis.period.end)
      },
      correlation: {
        value: correlationValue,
        interpretation: importData.analysis.correlation?.interpretation || ''
      },
      result: importData.analysis.result || '',
      datasets: {
        years,
        healthData,
        economicData
      },
      rawData: Array.isArray(importData.rawData) ? importData.rawData : []
    };

    return analysis;
  } catch (error) {
    console.error('Błąd podczas rekonstrukcji analizy:', error);
    throw error;
  }
}

// Funkcja pomocnicza do usuwania istniejącej analizy (dla strategii 'replace')
async function deleteAnalysis(analysisId, userId) {
  try {
    // Konwersja ID użytkownika dla MySQL
    const mysqlUserId = getMySQLUserId({ id: userId });

    if (databaseType === 'mongo' || databaseType === 'both') {
      await safeMongoOperation(async () => {
        return await MongoAnalysis.findOneAndDelete({ _id: analysisId, userId });
      });
    }

    if (databaseType === 'mysql' || databaseType === 'both') {
      await safeMySQLOperation(async (transaction) => {
        return await MySQLAnalysis.destroy({
          where: {
            id: analysisId,
            userId: mysqlUserId
          },
          transaction
        });
      }, 0, Transaction.ISOLATION_LEVELS.SERIALIZABLE);
    }

    return true;
  } catch (error) {
    console.error(`Błąd podczas usuwania analizy: ${error.message}`);
    throw error;
  }
}

// Funkcja pomocnicza do sprawdzania czy analiza o danej nazwie już istnieje
async function checkIfAnalysisExists(analysisName, userId) {
  try {
    let mongoAnalysis = null;
    let mysqlAnalysis = null;

    // Konwersja ID użytkownika dla MySQL
    const mysqlUserId = getMySQLUserId({ id: userId });

    if (databaseType === 'mongo' || databaseType === 'both') {
      mongoAnalysis = await safeMongoOperation(async () => {
        return await MongoAnalysis.findOne({ name: analysisName, userId });
      });
    }

    if (databaseType === 'mysql' || databaseType === 'both') {
      mysqlAnalysis = await safeMySQLOperation(async (transaction) => {
        return await MySQLAnalysis.findOne({
          where: {
            name: analysisName,
            userId: mysqlUserId
          },
          transaction
        });
      }, null, Transaction.ISOLATION_LEVELS.REPEATABLE_READ);
    }

    // Zwróć obiekt zawierający zarówno analizę z Mongo, jak i MySQL z ich ID
    return {
      exists: !!(mongoAnalysis || mysqlAnalysis),
      mongoId: mongoAnalysis ? mongoAnalysis._id : null,
      mysqlId: mysqlAnalysis ? mysqlAnalysis.id : null,
      name: analysisName
    };
  } catch (error) {
    console.error(`Błąd podczas sprawdzania istnienia analizy: ${error.message}`);
    throw error;
  }
}

/**
 * ENDPOINTS EKSPORTU
 */

// Export analizy
router.get('/analyses/:id/export', authenticateToken, async (req, res) => {
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
});

/**
 * ENDPOINTS IMPORTU
 */

// Import analizy
router.post('/analyses/import', authenticateToken, upload.single('file'), async (req, res) => {
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
});

module.exports = router;