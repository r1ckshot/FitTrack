import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  FormHelperText,
  Grid,
  CircularProgress
} from '@mui/material';
import { motion } from 'framer-motion';

const AnalysisForm = ({
  countries,
  analysisTypes,
  availableYears,
  onCountrySelect,
  onAnalysisTypeSelect,
  onSubmit,
  isLoading
}) => {
  const [formData, setFormData] = useState({
    name: '',
    analysisType: '',
    countryCode: '',
    countryName: '',
    yearStart: '',
    yearEnd: ''
  });
  const [errors, setErrors] = useState({});

  // Aktualizacja lat i wybranego typu analizy
  useEffect(() => {
    if (availableYears.minYear && availableYears.maxYear) {
      setFormData(prev => ({
        ...prev,
        yearStart: availableYears.minYear,
        yearEnd: availableYears.maxYear
      }));
    }
  }, [availableYears]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Powiadomienie o zmianie typu analizy
    if (name === 'analysisType') {
      onAnalysisTypeSelect(value);
    }

    // Czyszczenie błędów
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCountryChange = (e) => {
    const countryCode = e.target.value;
    const selectedCountry = countries.find(country => country.code === countryCode);

    if (selectedCountry) {
      setFormData(prev => ({
        ...prev,
        countryCode: selectedCountry.code,
        countryName: selectedCountry.name
      }));
      onCountrySelect(selectedCountry);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Walidacja nazwy analizy
    if (!formData.name) {
      newErrors.name = 'Nazwa analizy jest wymagana';
    } else if (formData.name.trim() === '') {
      newErrors.name = 'Nazwa analizy nie może składać się tylko z białych znaków';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Nazwa analizy musi zawierać co najmniej 3 znaki';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Nazwa analizy nie może przekraczać 100 znaków';
    }
    
    if (!formData.analysisType) newErrors.analysisType = 'Typ analizy jest wymagany';
    if (!formData.countryCode) newErrors.countryCode = 'Kraj jest wymagany';
    if (!formData.yearStart) newErrors.yearStart = 'Rok początkowy jest wymagany';
    if (!formData.yearEnd) {
      newErrors.yearEnd = 'Rok końcowy jest wymagany';
    } else if (formData.yearEnd < formData.yearStart) {
      newErrors.yearEnd = 'Rok końcowy musi być większy lub równy początkowemu';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) onSubmit(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Grid container justifyContent="center">
        <Box component="form" onSubmit={handleSubmit} sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Parametry Analizy
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Nazwa analizy"
                fullWidth
                value={formData.name}
                onChange={handleInputChange}
                error={!!errors.name}
                helperText={errors.name}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12} md={6} sx={{ minWidth: 150 }}>
              <FormControl fullWidth error={!!errors.analysisType}>
                <InputLabel id="analysis-type-label" sx={{ backgroundColor: 'transparent' }}>
                  Typ analizy
                </InputLabel>
                <Select
                  labelId="analysis-type-label"
                  name="analysisType"
                  value={formData.analysisType}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  label="Typ analizy"
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300
                      }
                    }
                  }}
                >
                  {analysisTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.analysisType && <FormHelperText>{errors.analysisType}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6} sx={{ minWidth: 100 }}>
              <FormControl fullWidth error={!!errors.countryCode}>
                <InputLabel id="country-label" sx={{ backgroundColor: 'transparent' }}>
                  Kraj
                </InputLabel>
                <Select
                  labelId="country-label"
                  name="countryCode"
                  value={formData.countryCode}
                  onChange={handleCountryChange}
                  disabled={isLoading}
                  label="Kraj"
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300
                      }
                    }
                  }}
                >
                  {countries.map((country) => (
                    <MenuItem key={country.code} value={country.code}>
                      {country.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.countryCode && <FormHelperText>{errors.countryCode}</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6} >
              <TextField
                name="yearStart"
                label="Rok początkowy"
                type="number"
                fullWidth
                value={formData.yearStart}
                onChange={handleInputChange}
                disabled={!availableYears.minYear || isLoading}
                inputProps={{
                  min: availableYears.minYear,
                  max: availableYears.maxYear
                }}
                error={!!errors.yearStart}
                helperText={errors.yearStart}
              />
            </Grid>

            <Grid item xs={12} md={6} >
              <TextField
                name="yearEnd"
                label="Rok końcowy"
                type="number"
                fullWidth
                value={formData.yearEnd}
                onChange={handleInputChange}
                disabled={!availableYears.maxYear || isLoading}
                inputProps={{
                  min: availableYears.minYear,
                  max: availableYears.maxYear
                }}
                error={!!errors.yearEnd}
                helperText={errors.yearEnd}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isLoading}
              sx={{
                backgroundColor: '#4CAF50',
                '&:hover': { backgroundColor: '#45A049' },
                minWidth: '200px'
              }}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Wykonaj Analizę'
              )}
            </Button>
          </Box>
        </Box>
      </Grid>

      <Grid container justifyContent="center">
        {formData.analysisType && (
          <Box sx={{ mt: 2, }}>
            <Typography align="center" sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
              Opis analizy
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
              {analysisTypes.find(type => type.id === formData.analysisType)?.description || ''}
            </Typography>
          </Box>
        )}
      </Grid>
    </motion.div>
  );
};

export default AnalysisForm;