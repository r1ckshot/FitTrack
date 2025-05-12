const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const xml2js = require('xml2js');

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

module.exports = {
  detectFileFormat,
  parseImportFile,
  serializeToFormat,
  extractAnalysisData,
  reconstructAnalysis,
  deleteAnalysis,
  checkIfAnalysisExists
}