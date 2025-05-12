const AnalyticsService = require('../services/analytics.service');
const MongoAnalysis = require('../models/mongo/Analysis.model');
const MySQLAnalysis = require('../models/mysql/Analysis.model');
const { databaseType, getMySQLUserId, safeMongoOperation, safeMySQLOperation, Transaction } = require('../utils/database.utils');

const analyticsService = new AnalyticsService();

class AnalyticsController {

    // Zwraca listę dostępnych krajów
    static async getAvailableCountries(req, res) {
        try {
            const countries = await analyticsService.getAvailableCountries();
            res.status(200).json({
                success: true,
                data: countries
            });
        } catch (error) {
            console.error('Błąd pobierania krajów:', error);
            res.status(500).json({
                success: false,
                error: 'Nie udało się pobrać listy krajów.'
            });
        }
    }

    // Zwraca dostępne lata dla danego kraju i typu analizy
    static async getAvailableYears(req, res) {
        const { countryCode, analysisType } = req.query;

        if (!countryCode) {
            return res.status(400).json({
                success: false,
                error: 'Kod kraju jest wymagany.'
            });
        }

        if (!analysisType) {
            return res.status(400).json({
                success: false,
                error: 'Typ analizy jest wymagany.'
            });
        }

        try {
            // Pobieramy wspólne dostępne lata dla obu wskaźników
            const yearsData = await analyticsService.getCommonAvailableYears(countryCode, analysisType);

            res.status(200).json({
                success: true,
                data: yearsData
            });
        } catch (error) {
            console.error('Błąd pobierania dostępnych lat:', error);
            res.status(500).json({
                success: false,
                error: 'Nie udało się pobrać dostępnych lat.'
            });
        }
    }

    // Zwraca dostępne typy analiz
    static async getAnalysisTypes(req, res) {
        const analysisTypes = [
            {
                id: 'obesity_vs_health_expenditure',
                name: 'Otyłość vs wydatki na ochronę zdrowia',
                description: 'Czy kraje wydające więcej na ochronę zdrowia mają niższe wskaźniki otyłości?'
            },
            {
                id: 'gdp_vs_physical_activity',
                name: 'PKB per capita vs aktywność fizyczna',
                description: 'Czy zamożność społeczeństwa przekłada się na większą aktywność fizyczną?'
            },
            {
                id: 'death_probability_vs_urbanization',
                name: 'Prawdopodobieństwo zgonu vs urbanizacja',
                description: 'Czy w bardziej zurbanizowanych krajach częściej występują choroby serca?'
            },
            {
                id: 'diabetes_vs_gini_index',
                name: 'Cukrzyca vs nierówności dochodowe',
                description: 'Czy większe nierówności dochodowe wiążą się z częstszym występowaniem chorób cywilizacyjnych?'
            }
        ];

        res.status(200).json({
            success: true,
            data: analysisTypes
        });
    }


    // Tworzy i zapisuje nową analizę
    static async createAnalysis(req, res) {
        const { name, analysisType, countryCode, countryName, yearStart, yearEnd } = req.body;

        // Walidacja wymaganych pól
        if (!name || !analysisType || !countryCode || !countryName || !yearStart || !yearEnd) {
            return res.status(400).json({
                success: false,
                error: 'Wszystkie pola są wymagane.'
            });
        }

        try {
            // Wykonaj analizę przy pomocy serwisu
            const analysisResults = await analyticsService.performAnalysis(
                analysisType,
                countryCode,
                yearStart,
                yearEnd
            );

            let createdAnalysisMongo = null;
            let createdAnalysisMySQL = null;
            const currentTimestamp = new Date();

            // Poprawne ID użytkownika dla MySQL
            const mysqlUserId = await getMySQLUserId(req.user);

            // MongoDB - operacja
            if (databaseType === 'mongo' || databaseType === 'both') {
                createdAnalysisMongo = await safeMongoOperation(async () => {
                    const analysis = new MongoAnalysis({
                        name,
                        analysisType,
                        country: {
                            code: countryCode,
                            name: countryName
                        },
                        period: {
                            start: yearStart,
                            end: yearEnd
                        },
                        correlation: {
                            value: analysisResults.correlation,
                            interpretation: analysisResults.correlationInterpretation
                        },
                        result: analysisResults.result,
                        datasets: {
                            years: analysisResults.datasets.years,
                            healthData: analysisResults.datasets.healthData,
                            economicData: analysisResults.datasets.economicData
                        },
                        rawData: analysisResults.rawData,
                        title: analysisResults.title,
                        description: analysisResults.description,
                        userId: req.user.id,
                        createdAt: currentTimestamp,
                        updatedAt: currentTimestamp
                    });
                    return await analysis.save();
                });
            }

            // MySQL - operacja z transakcją
            if (databaseType === 'mysql' || databaseType === 'both') {
                createdAnalysisMySQL = await safeMySQLOperation(async (transaction) => {
                    // Przygotuj dane dla MySQL w odpowiednim formacie
                    const datasets = {
                        years: analysisResults.datasets.years,
                        healthData: analysisResults.datasets.healthData,
                        economicData: analysisResults.datasets.economicData
                    };

                    return await MySQLAnalysis.create({
                        name,
                        analysisType,
                        countryCode,
                        countryName,
                        periodStart: yearStart,
                        periodEnd: yearEnd,
                        correlationValue: analysisResults.correlation,
                        correlationInterpretation: analysisResults.correlationInterpretation,
                        result: analysisResults.result,
                        datasets: datasets,
                        rawData: analysisResults.rawData,
                        title: analysisResults.title,
                        description: analysisResults.description,
                        userId: mysqlUserId,
                        createdAt: currentTimestamp,
                        updatedAt: currentTimestamp
                    }, { transaction });
                }, null, Transaction.ISOLATION_LEVELS.READ_COMMITTED);
            }

            // Odpowiedź
            if (databaseType === 'both' && createdAnalysisMongo && createdAnalysisMySQL) {
                const responseData = {
                    ...createdAnalysisMongo.toObject(),
                    mysqlId: createdAnalysisMySQL.id
                };

                res.status(201).json({
                    success: true,
                    message: 'Analiza została zapisana w obu bazach danych.',
                    data: responseData
                });
            } else if (createdAnalysisMongo) {
                res.status(201).json({
                    success: true,
                    message: 'Analiza została zapisana w MongoDB.',
                    data: createdAnalysisMongo,
                });
            } else if (createdAnalysisMySQL) {
                res.status(201).json({
                    success: true,
                    message: 'Analiza została zapisana w MySQL.',
                    data: createdAnalysisMySQL,
                });
            } else {
                res.status(500).json({
                    success: false,
                    error: 'Nie udało się zapisać analizy.'
                });
            }
        } catch (error) {
            console.error('Błąd tworzenia analizy:', error);
            res.status(500).json({
                success: false,
                error: 'Błąd podczas tworzenia analizy.'
            });
        }
    }

    // Pobiera listę zapisanych analiz użytkownika
    static async getAnalyses(req, res) {
        try {
            // Parametry paginacji
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            let mongoAnalyses = [];
            let mysqlAnalyses = [];
            let total = 0;

            const mysqlUserId = await getMySQLUserId(req.user);

            // MongoDB - zawsze pobieramy jeśli używamy mongo
            if (databaseType === 'mongo' || databaseType === 'both') {
                // Pobierz całkowitą liczbę dla paginacji
                total = await safeMongoOperation(async () => {
                    return await MongoAnalysis.countDocuments({ userId: req.user.id });
                }, 0);

                mongoAnalyses = await safeMongoOperation(async () => {
                    return await MongoAnalysis.find({ userId: req.user.id })
                        .sort({ createdAt: 1 })
                        .skip(skip)
                        .limit(limit);
                }, []);
            }

            // MySQL - pobieramy jeśli używamy tylko MySQL (w trybie both używamy tylko MongoDB dla odczytu)
            if (databaseType === 'mysql') {
                // Pobierz całkowitą liczbę dla paginacji
                const countResult = await safeMySQLOperation(async (transaction) => {
                    return await MySQLAnalysis.count({
                        where: { userId: mysqlUserId },
                        transaction
                    });
                }, 0, Transaction.ISOLATION_LEVELS.READ_COMMITTED);

                total = countResult;

                mysqlAnalyses = await safeMySQLOperation(async (transaction) => {
                    return await MySQLAnalysis.findAll({
                        where: { userId: mysqlUserId },
                        order: [['createdAt', 'ASC']],
                        offset: skip,
                        limit: limit,
                        transaction
                    });
                }, [], Transaction.ISOLATION_LEVELS.READ_COMMITTED);
            }

            // Odpowiedź zależna od typu bazy danych
            let analyses = [];
            if (databaseType === 'both' || databaseType === 'mongo') {
                analyses = mongoAnalyses.map(analysis => analysis.toObject ? analysis.toObject() : analysis);
            } else if (databaseType === 'mysql') {
                analyses = mysqlAnalyses.map(analysis => {
                    const plainAnalysis = analysis.get({ plain: true });
                    return plainAnalysis;
                });
            }

            res.status(200).json({
                success: true,
                data: {
                    analyses,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            console.error('Błąd pobierania analiz:', error);
            res.status(500).json({
                success: false,
                error: 'Błąd pobierania analiz.'
            });
        }
    }


    // Pobiera szczegóły konkretnej analizy
    static async getAnalysisById(req, res) {
        const analysisId = req.params.id;

        try {
            let analysis = null;

            // Określ odpowiednie ID dla danej bazy
            if (/^[0-9a-fA-F]{24}$/.test(analysisId)) {
                // Analysis ID to MongoDB ObjectID
                if (databaseType === 'mongo' || databaseType === 'both') {
                    analysis = await safeMongoOperation(async () => {
                        return await MongoAnalysis.findOne({ _id: analysisId, userId: req.user.id });
                    });
                }
            } else {
                // Analysis ID to prawdopodobnie MySQL ID
                const analysisIdInt = parseInt(analysisId, 10);

                if ((databaseType === 'mysql' || databaseType === 'both') && !isNaN(analysisIdInt)) {
                    const mysqlUserId = await getMySQLUserId(req.user);

                    analysis = await safeMySQLOperation(async (transaction) => {
                        const result = await MySQLAnalysis.findOne({
                            where: {
                                id: analysisIdInt,
                                userId: mysqlUserId
                            },
                            transaction
                        });

                        if (result) {
                            const plainResult = result.get({ plain: true });
                            return plainResult;
                        }
                        return null;
                    }, null, Transaction.ISOLATION_LEVELS.READ_COMMITTED);
                }
            }

            if (analysis) {
                res.status(200).json({
                    success: true,
                    data: analysis
                });
            } else {
                res.status(404).json({
                    success: false,
                    error: 'Nie znaleziono analizy.'
                });
            }
        } catch (error) {
            console.error('Błąd pobierania analizy:', error);
            res.status(500).json({
                success: false,
                error: 'Błąd pobierania analizy.'
            });
        }
    }

    // Aktualizacja nazwy istniejącej analizy
    static async updateAnalysis(req, res) {
        const analysisId = req.params.id;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Nazwa analizy jest wymagana.'
            });
        }

        try {
            let updatedMongo = null;
            let updatedMySQL = null;
            let mongoId = null;
            let mysqlId = null;
            const currentTimestamp = new Date();

            // Określ odpowiednie ID dla danej bazy
            if (/^[0-9a-fA-F]{24}$/.test(analysisId)) {
                // Analysis ID to MongoDB ObjectID
                mongoId = analysisId;

                // Tylko jeśli używamy obu baz danych, spróbuj znaleźć odpowiadający rekord w MySQL
                if (databaseType === 'both') {
                    const mongoProg = await safeMongoOperation(async () => {
                        return await MongoAnalysis.findById(mongoId);
                    });

                    if (mongoProg && mongoProg.userId.toString() === req.user.id) {
                        const mysqlUserId = await getMySQLUserId(req.user);

                        // Znajdź rekord w MySQL na podstawie createdAt
                        const mysqlProgs = await safeMySQLOperation(async (transaction) => {
                            return await MySQLAnalysis.findAll({
                                where: {
                                    userId: mysqlUserId,
                                    createdAt: mongoProg.createdAt
                                },
                                transaction
                            });
                        }, [], Transaction.ISOLATION_LEVELS.REPEATABLE_READ);

                        if (mysqlProgs && mysqlProgs.length > 0) {
                            mysqlId = mysqlProgs[0].id;
                        }
                    }
                }
            } else {
                // Analysis ID to prawdopodobnie MySQL ID
                mysqlId = parseInt(analysisId, 10);

                // Tylko jeśli używamy obu baz danych, spróbuj znaleźć odpowiadający rekord w MongoDB
                if (databaseType === 'both' && !isNaN(mysqlId)) {
                    const mysqlUserId = await getMySQLUserId(req.user);

                    const mysqlProg = await safeMySQLOperation(async (transaction) => {
                        return await MySQLAnalysis.findOne({
                            where: {
                                id: mysqlId,
                                userId: mysqlUserId
                            },
                            transaction
                        });
                    }, null, Transaction.ISOLATION_LEVELS.REPEATABLE_READ);

                    if (mysqlProg) {
                        // Znajdź rekord w MongoDB na podstawie createdAt
                        const mongoProgs = await safeMongoOperation(async () => {
                            return await MongoAnalysis.find({
                                userId: req.user.id,
                                createdAt: mysqlProg.createdAt
                            });
                        }, []);

                        if (mongoProgs && mongoProgs.length > 0) {
                            mongoId = mongoProgs[0]._id;
                        }
                    }
                }
            }

            // MongoDB - aktualizacja jeśli dostępny
            if ((databaseType === 'mongo' || databaseType === 'both') && mongoId) {
                updatedMongo = await safeMongoOperation(async () => {
                    return await MongoAnalysis.findOneAndUpdate(
                        { _id: mongoId, userId: req.user.id },
                        {
                            name,
                            updatedAt: currentTimestamp
                        },
                        { new: true }
                    );
                });
            }

            // MySQL - aktualizacja jeśli dostępny
            if ((databaseType === 'mysql' || databaseType === 'both') && mysqlId && !isNaN(mysqlId)) {
                const mysqlUserId = await getMySQLUserId(req.user);

                updatedMySQL = await safeMySQLOperation(async (transaction) => {
                    // Aktualizacja konkretnego rekordu po id
                    await MySQLAnalysis.update(
                        {
                            name,
                            updatedAt: currentTimestamp
                        },
                        {
                            where: {
                                id: mysqlId,
                                userId: mysqlUserId
                            },
                            transaction
                        }
                    );

                    // Pobierz zaktualizowany rekord
                    return await MySQLAnalysis.findOne({
                        where: { id: mysqlId },
                        transaction
                    });
                }, null, Transaction.ISOLATION_LEVELS.REPEATABLE_READ);

                // Przekształć dane z MySQL
                if (updatedMySQL) {
                    const plainResult = updatedMySQL.get({ plain: true });
                    updatedMySQL = plainResult;
                }
            }

            // Obsługa odpowiedzi
            if (databaseType === 'both' && updatedMongo && updatedMySQL) {
                const responseData = {
                    ...updatedMongo.toObject(),
                    mysqlId: mysqlId,
                };
                return res.status(200).json({
                    success: true,
                    message: 'Analiza została zaktualizowana w obu bazach danych.',
                    data: responseData,
                });
            } else if (updatedMongo) {
                return res.status(200).json({
                    success: true,
                    message: 'Analiza została zaktualizowana w MongoDB.',
                    data: updatedMongo,
                });
            } else if (updatedMySQL) {
                return res.status(200).json({
                    success: true,
                    message: 'Analiza została zaktualizowana w MySQL.',
                    data: updatedMySQL,
                });
            }

            res.status(404).json({
                success: false,
                error: 'Nie znaleziono analizy do aktualizacji.'
            });
        } catch (error) {
            console.error('Błąd aktualizacji analizy:', error);
            res.status(500).json({
                success: false,
                error: 'Błąd aktualizacji analizy.'
            });
        }
    }


    // Usunięcie analizy
    static async deleteAnalysis(req, res) {
        const analysisId = req.params.id;

        try {
            let isMongoDeleted = false;
            let isMySQLDeleted = false;
            let mongoId = null;
            let mysqlId = null;

            // Określ odpowiednie ID dla obu baz
            if (/^[0-9a-fA-F]{24}$/.test(analysisId)) {
                // Analysis ID to MongoDB ObjectID
                mongoId = analysisId;

                // Tylko jeśli używamy obu baz danych, spróbuj znaleźć odpowiadający rekord w MySQL
                if (databaseType === 'both') {
                    const mongoProg = await safeMongoOperation(async () => {
                        return await MongoAnalysis.findOne({ _id: mongoId, userId: req.user.id });
                    });

                    if (mongoProg) {
                        const mysqlUserId = await getMySQLUserId(req.user);

                        // Znajdź rekord w MySQL na podstawie createdAt
                        const mysqlProgs = await safeMySQLOperation(async (transaction) => {
                            return await MySQLAnalysis.findAll({
                                where: {
                                    userId: mysqlUserId,
                                    createdAt: mongoProg.createdAt
                                },
                                transaction
                            });
                        }, [], Transaction.ISOLATION_LEVELS.REPEATABLE_READ);

                        if (mysqlProgs && mysqlProgs.length > 0) {
                            mysqlId = mysqlProgs[0].id;
                        }
                    }
                }
            } else {
                // Analysis ID to prawdopodobnie MySQL ID
                mysqlId = parseInt(analysisId, 10);

                // Tylko jeśli używamy obu baz danych, spróbuj znaleźć odpowiadający rekord w MongoDB
                if (databaseType === 'both' && !isNaN(mysqlId)) {
                    const mysqlUserId = await getMySQLUserId(req.user);

                    const mysqlProg = await safeMySQLOperation(async (transaction) => {
                        return await MySQLAnalysis.findOne({
                            where: {
                                id: mysqlId,
                                userId: mysqlUserId
                            },
                            transaction
                        });
                    }, null, Transaction.ISOLATION_LEVELS.REPEATABLE_READ);

                    if (mysqlProg) {
                        // Znajdź rekord w MongoDB na podstawie createdAt
                        const mongoProgs = await safeMongoOperation(async () => {
                            return await MongoAnalysis.find({
                                userId: req.user.id,
                                createdAt: mysqlProg.createdAt
                            });
                        }, []);

                        if (mongoProgs && mongoProgs.length > 0) {
                            mongoId = mongoProgs[0]._id;
                        }
                    }
                }
            }

            // MongoDB - usuwanie jeśli dostępny
            if ((databaseType === 'mongo' || databaseType === 'both') && mongoId) {
                const deletedProg = await safeMongoOperation(async () => {
                    return await MongoAnalysis.findOneAndDelete({ _id: mongoId, userId: req.user.id });
                });
                isMongoDeleted = !!deletedProg;
            }

            // MySQL - usuwanie jeśli dostępny
            if ((databaseType === 'mysql' || databaseType === 'both') && mysqlId && !isNaN(mysqlId)) {
                const mysqlUserId = await getMySQLUserId(req.user);

                const deletedRows = await safeMySQLOperation(async (transaction) => {
                    // Usunięcie konkretnego rekordu po id
                    return await MySQLAnalysis.destroy({
                        where: {
                            id: mysqlId,
                            userId: mysqlUserId
                        },
                        transaction
                    });
                }, 0, Transaction.ISOLATION_LEVELS.SERIALIZABLE);

                isMySQLDeleted = deletedRows > 0;
            }

            // Obsługa odpowiedzi
            if (databaseType === 'both' && isMongoDeleted && isMySQLDeleted) {
                return res.status(200).json({
                    success: true,
                    message: 'Analiza została usunięte z obu baz danych.'
                });
            } else if (isMongoDeleted) {
                return res.status(200).json({
                    success: true,
                    message: 'Analiza została usunięta z MongoDB.'
                });
            } else if (isMySQLDeleted) {
                return res.status(200).json({
                    success: true,
                    message: 'Analiza została usunięta z MySQL.'
                });
            } else {
                // Jeśli nie udało się usunąć żadnego rekordu
                res.status(404).json({
                    success: false,
                    error: 'Nie znaleziono analizy do usunięcia.'
                });
            }
        } catch (error) {
            console.error('Błąd usuwania analizy:', error);
            res.status(500).json({
                success: false,
                error: 'Błąd usuwania analizy.'
            });
        }
    }
}

module.exports = AnalyticsController;