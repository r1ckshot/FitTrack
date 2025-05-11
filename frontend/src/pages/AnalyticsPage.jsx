import { useState, useEffect } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import { motion } from 'framer-motion';
import api from '../services/api';
import Navbar from '../components/common/Navbar';
import BackgroundIcons from '../components/common/BackgroundIcons';
import { useSnackbar } from '../contexts/SnackbarContext';
import AnalysisForm from '../components/analytics/AnalysisForm';
import AnalysisResults from '../components/analytics/AnalysisResults';
import SavedAnalyses from '../components/analytics/SavedAnalyses';

const AnalyticsPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [countries, setCountries] = useState([]);
  const [analysisTypes, setAnalysisTypes] = useState([]);
  const [availableYears, setAvailableYears] = useState({ minYear: null, maxYear: null });
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedAnalysisType, setSelectedAnalysisType] = useState(null);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [savedAnalyses, setSavedAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshSavedAnalyses, setRefreshSavedAnalyses] = useState(0);
  const { showSnackbar } = useSnackbar();

  // Pobieranie listy krajów
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await api.get('/analytics/countries');
        if (response.data.success) {
          setCountries(response.data.data);
        } else {
          showSnackbar('Nie udało się pobrać listy krajów', 'error');
        }
      } catch (error) {
        console.error('Błąd podczas pobierania krajów:', error);
        showSnackbar('Błąd podczas pobierania krajów', 'error');
      }
    };

    fetchCountries();
  }, [showSnackbar]);

  // Pobieranie typów analiz
  useEffect(() => {
    const fetchAnalysisTypes = async () => {
      try {
        const response = await api.get('/analytics/analysis-types');
        if (response.data.success) {
          setAnalysisTypes(response.data.data);
        } else {
          showSnackbar('Nie udało się pobrać typów analiz', 'error');
        }
      } catch (error) {
        console.error('Błąd podczas pobierania typów analiz:', error);
        showSnackbar('Błąd podczas pobierania typów analiz', 'error');
      }
    };

    fetchAnalysisTypes();
  }, [showSnackbar]);

  // Pobieranie dostępnych lat dla wybranego kraju i typu analizy
  useEffect(() => {
    const fetchAvailableYears = async () => {
      if (!selectedCountry || !selectedAnalysisType) return;

      try {
        const response = await api.get(
          `/analytics/available-years?countryCode=${selectedCountry.code}&analysisType=${selectedAnalysisType}`
        );
        if (response.data.success) {
          setAvailableYears(response.data.data);
        } else {
          showSnackbar('Nie udało się pobrać dostępnych lat', 'error');
        }
      } catch (error) {
        console.error('Błąd podczas pobierania dostępnych lat:', error);
        showSnackbar('Błąd podczas pobierania dostępnych lat', 'error');
      }
    };

    fetchAvailableYears();
  }, [selectedCountry, selectedAnalysisType, showSnackbar]);

  // Pobieranie zapisanych analiz
  const fetchSavedAnalyses = async () => {
    try {
      const response = await api.get('/analyses');
      if (response.data.success) {
        setSavedAnalyses(response.data.data.analyses);
      } else {
        showSnackbar('Nie udało się pobrać zapisanych analiz', 'error');
      }
    } catch (error) {
      console.error('Błąd podczas pobierania zapisanych analiz:', error);
      showSnackbar('Błąd podczas pobierania zapisanych analiz', 'error');
    }
  };

  // Pobieranie zapisanych analiz przy przełączeniu na zakładkę lub gdy licznik odświeżenia się zmieni
  useEffect(() => {
    if (tabValue === 2) {
      fetchSavedAnalyses();
    }
  }, [tabValue, refreshSavedAnalyses]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
  };

  const handleAnalysisTypeSelect = (analysisType) => {
    setSelectedAnalysisType(analysisType);
  };

  const handleAnalysisSubmit = async (formData) => {
    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        analysisType: selectedAnalysisType,
        countryCode: selectedCountry?.code
      };

      const response = await api.post('/analyses', payload);
      if (response.data.success) {
        setCurrentAnalysis(response.data.data);
        setTabValue(1);
        showSnackbar('Analiza została pomyślnie wykonana', 'success');
      } else {
        showSnackbar('Nie udało się wykonać analizy', 'error');
      }
    } catch (error) {
      console.error('Błąd podczas wykonywania analizy:', error);
      showSnackbar('Błąd podczas wykonywania analizy', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalysisLoad = async (analysisId) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/analyses/${analysisId}`);
      if (response.data.success) {
        setCurrentAnalysis(response.data.data);
        setTabValue(1);
      } else {
        showSnackbar('Nie udało się wczytać analizy', 'error');
      }
    } catch (error) {
      console.error('Błąd podczas wczytywania analizy:', error);
      showSnackbar('Błąd podczas wczytywania analizy', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalysisUpdate = async (analysisId, newName) => {
    try {
      // Jeżeli nic nie jest przekazane, to oznacza, że chcemy tylko odświeżyć listę
      if (!analysisId && !newName) {
        setRefreshSavedAnalyses(prev => prev + 1);
        return;
      }

      // W przeciwnym razie aktualizujemy nazwę analizy
      const response = await api.put(`/analyses/${analysisId}`, { name: newName });
      if (response.data.success) {
        showSnackbar('Nazwa analizy została zaktualizowana', 'success');
        setRefreshSavedAnalyses(prev => prev + 1);
      } else {
        showSnackbar('Nie udało się zaktualizować nazwy analizy', 'error');
      }
    } catch (error) {
      console.error('Błąd podczas aktualizacji analizy:', error);
      showSnackbar('Błąd podczas aktualizacji analizy', 'error');
    }
  };

  const handleAnalysisDelete = async (analysisId) => {
    try {
      const response = await api.delete(`/analyses/${analysisId}`);
      if (response.data.success) {
        showSnackbar('Analiza została usunięta', 'success');
        setRefreshSavedAnalyses(prev => prev + 1);
      } else {
        showSnackbar('Nie udało się usunąć analizy', 'error');
      }
    } catch (error) {
      console.error('Błąd podczas usuwania analizy:', error);
      showSnackbar('Błąd podczas usuwania analizy', 'error');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #4CAF50, #81C784)',
      }}
    >
      <Navbar />
      <BackgroundIcons />

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          padding: '20px',
        }}
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            width: '100%',
            maxWidth: '1350px',
            borderRadius: '8px',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.2)',
            background: '#ffffff',
            padding: '20px',
            marginBottom: '20px'
          }}
        >
          <Typography variant="h4" align="center" gutterBottom>
            Analiza Danych Zdrowotnych i Ekonomicznych
          </Typography>

          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            centered
            sx={{ mb: 2 }}
          >
            <Tab label="Nowa Analiza" />
            <Tab label="Wyniki" disabled={!currentAnalysis} />
            <Tab label="Zapisane Analizy" />
          </Tabs>

          {tabValue === 0 && (
            <AnalysisForm
              countries={countries}
              analysisTypes={analysisTypes}
              availableYears={availableYears}
              onCountrySelect={handleCountrySelect}
              onAnalysisTypeSelect={handleAnalysisTypeSelect}
              onSubmit={handleAnalysisSubmit}
              isLoading={isLoading}
            />
          )}

          {tabValue === 1 && currentAnalysis && (
            <AnalysisResults
              analysis={currentAnalysis}
            />
          )}

          {tabValue === 2 && (
            <SavedAnalyses
              analyses={savedAnalyses}
              onLoad={handleAnalysisLoad}
              onUpdate={handleAnalysisUpdate}
              onDelete={handleAnalysisDelete}
              key={`saved-analyses-${refreshSavedAnalyses}`}
            />
          )}
        </motion.div>
      </Box>
    </Box>
  );
};

export default AnalyticsPage;