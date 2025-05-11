import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab
} from '@mui/material';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  BarChart,
  Bar
} from 'recharts';

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`chart-tabpanel-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const AnalysisResults = ({ analysis }) => {
  const [tabValue, setTabValue] = useState(0);

  console.log('Otrzymane dane analizy:', analysis);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Format danych dla wykresu liniowego
  const prepareLineChartData = () => {
    if (!analysis || !analysis.datasets || !analysis.datasets.years) {
      console.log('Brak danych dla wykresu liniowego');
      return [];
    }

    return analysis.datasets.years.map((year, index) => ({
      year,
      healthMetric: Number(analysis.datasets.healthData[index]),
      economicMetric: Number(analysis.datasets.economicData[index])
    }));
  };

  // Format danych dla wykresu rozproszenia (korelacja)
  const prepareScatterData = () => {
    if (!analysis || !analysis.datasets || !analysis.datasets.healthData) {
      console.log('Brak danych dla wykresu rozproszenia');
      return [];
    }

    return analysis.datasets.healthData.map((value, index) => ({
      x: Number(value), // Metryka zdrowotna na osi X
      y: Number(analysis.datasets.economicData[index]), // Metryka ekonomiczna na osi Y
      z: 1 // Stała wielkość punktu
    }));
  };

  // Pobieranie etykiet dla metryk (zależnie od typu analizy)
  const getMetricLabels = () => {
    if (!analysis || !analysis.analysisType) return { health: 'Dane zdrowotne', economic: 'Dane ekonomiczne' };

    switch (analysis.analysisType) {
      case 'obesity_vs_health_expenditure':
        return { health: 'Poziom otyłości (%)', economic: 'Wydatki na zdrowie (% PKB)' };
      case 'gdp_vs_physical_activity':
        return { health: 'Niedostateczna aktywność fizyczna (%)', economic: 'PKB per capita (USD)' };
      case 'death_probability_vs_urbanization':
        return { health: 'Prawdpopodobieństwo zgonu (%)', economic: 'Poziom urbanizacji (%)' };
      case 'diabetes_vs_gini_index':
        return { health: 'Występowanie cukrzycy (%)', economic: 'Wskaźnik Giniego' };
      default:
        return { health: 'Dane zdrowotne', economic: 'Dane ekonomiczne' };
    }
  };

  // Ujednolicenie nazw pól dla korelacji
  const getCorrelationValue = () => {
    if (!analysis) return null;

    // Obsługa różnych nazw pól w zależności od bazy danych
    return analysis.correlation?.value || analysis.correlationValue || 0;
  };

  const getCorrelationInterpretation = () => {
    if (!analysis) return '';

    return analysis.correlation?.interpretation || analysis.correlationInterpretation || '';
  };

  // Pobieranie wniosku z analizy
  const getResult = () => {
    if (!analysis) return '';
    
    return analysis.result || '';
  };

  const lineChartData = prepareLineChartData();
  const scatterData = prepareScatterData();
  const metricLabels = getMetricLabels();

  // Funkcja formatująca wartość korelacji z opisem
  const formatCorrelation = () => {
    const correlationValue = getCorrelationValue();
    const description = getCorrelationInterpretation();

    if (correlationValue === null) return 'Brak danych';

    return `${Number(correlationValue).toFixed(2)} - ${description}`;
  };

  // Funkcja przypisująca kolor w zależności od wartości korelacji
  const getCorrelationColor = () => {
    const value = getCorrelationValue();

    if (value === null) return '#757575';

    const absValue = Math.abs(value);

    if (absValue >= 0.7) return '#2E7D32'; // Silna korelacja - ciemny zielony
    if (absValue >= 0.5) return '#4CAF50'; // Umiarkowana korelacja - zielony
    if (absValue >= 0.3) return '#FFC107'; // Słaba korelacja - żółty
    return '#FF5722'; // Bardzo słaba korelacja - pomarańczowy
  };

  // Pobierz tytuł i opis analizy, obsługując różne formaty
  const getTitle = () => {
    return analysis?.title || analysis?.name || 'Analiza danych';
  };

  const getCountryName = () => {
    return analysis?.country?.name || analysis?.countryName || '';
  };

  const getPeriodStart = () => {
    return analysis?.period?.start || analysis?.periodStart || '';
  };

  const getPeriodEnd = () => {
    return analysis?.period?.end || analysis?.periodEnd || '';
  };

  const getDescription = () => {
    return analysis?.description || '';
  };

  // Funkcja do tworzenia danych dla mini wykresów
  const prepareMiniChartData = (year, index) => {
    return [
      {
        name: metricLabels.health,
        value: Number(analysis.datasets.healthData[index]),
        fill: '#4CAF50',
        label: metricLabels.health
      },
      {
        name: metricLabels.economic,
        value: Number(analysis.datasets.economicData[index]),
        fill: '#2196F3',
        label: metricLabels.economic
      }
    ];
  };

  // Niestandardowy formatowanie tooltipa dla mini wykresów
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: '#fff',
          padding: '5px 10px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', fontSize: 12 }}>
            {`${data.label}: ${Number(data.value).toFixed(2)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!analysis) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">Brak wyników do wyświetlenia</Typography>
      </Box>
    );
  }

  console.log('Przygotowane dane dla wykresu liniowego:', lineChartData);
  console.log('Przygotowane dane dla wykresu rozproszenia:', scatterData);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {getTitle()}
        </Typography>

        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          {getCountryName()}, {getPeriodStart()} - {getPeriodEnd()}
        </Typography>

        <Typography variant="body1" paragraph>
          {getDescription()}
        </Typography>

        <Box sx={{ mt: 2, mb: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Współczynnik korelacji:
          </Typography>
          <Typography
            variant="h4"
            sx={{ color: getCorrelationColor(), fontWeight: 'bold' }}
          >
            {formatCorrelation()}
          </Typography>
        </Box>
      </Paper>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label="Zmiany w czasie" />
            <Tab label="Wykres korelacji" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {lineChartData.length > 0 ? (
              <Box sx={{ width: '100%', height: 500 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={lineChartData}
                    margin={{ top: 20, right: 50, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="year"
                      padding={{ left: 30, right: 30 }}
                      label={{ value: 'Rok', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis
                      yAxisId="left"
                      label={{
                        value: metricLabels.health, angle: -90, position: 'insideLeft', offset: -10, style: {
                          textAnchor: 'middle',
                          dominantBaseline: 'middle'
                        }
                      }}
                      domain={['auto', 'auto']}
                      tickCount={7}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      label={{
                        value: metricLabels.economic, angle: 90, position: 'insideRight', offset: -10, style: {
                          textAnchor: 'middle',
                          dominantBaseline: 'middle'
                        }
                      }}
                      domain={['auto', 'auto']}
                      tickCount={7}
                    />
                    <Tooltip
                      formatter={(value) => Number(value).toFixed(2)}
                      labelFormatter={(label) => `Rok: ${label}`}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="healthMetric"
                      name={metricLabels.health}
                      stroke="#4CAF50"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                      dot={{ r: 6 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="economicMetric"
                      name={metricLabels.economic}
                      stroke="#2196F3"
                      strokeWidth={2}
                      dot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box sx={{ height: 500, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Brak danych do wyświetlenia na wykresie
                </Typography>
              </Box>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {scatterData.length > 0 ? (
              <Box sx={{ width: '100%', height: 500 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart
                    margin={{ top: 20, right: 30, bottom: 30, left: 30 }}
                  >
                    <CartesianGrid />
                    <XAxis
                      type="number"
                      dataKey="x"
                      name={metricLabels.health}
                      label={{
                        value: metricLabels.health, position: 'insideBottom', offset: -10, style: {
                          textAnchor: 'middle',
                          dominantBaseline: 'middle'
                        }
                      }}
                      domain={['auto', 'auto']}
                      tickCount={7}
                      padding={{ left: 30, right: 30 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name={metricLabels.economic}
                      label={{
                        value: metricLabels.economic, angle: -90, position: 'insideLeft', offset: -10, style: {
                          textAnchor: 'middle',
                          dominantBaseline: 'middle'
                        }
                      }}
                      domain={['auto', 'auto']}
                      tickCount={7}
                    />
                    <ZAxis type="number" range={[100, 100]} />
                    <Tooltip
                      formatter={(value) => Number(value).toFixed(2)}
                      cursor={{ strokeDasharray: '3 3' }}
                    />
                    <Legend verticalAlign="top" height={36} />
                    <Scatter
                      name="Korelacja"
                      data={scatterData}
                      fill="#4CAF50"
                      shape="circle"
                      legendType="circle"
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box sx={{ height: 500, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  Brak danych do wyświetlenia na wykresie
                </Typography>
              </Box>
            )}
          </TabPanel>
        </CardContent>
      </Card>

      {/* Nowa sekcja z wnioskiem */}
      {getResult() && (
        <Paper elevation={3} sx={{ p: 3, mb: 3, bgcolor: '#f9f9f9' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#2E7D32', fontWeight: 'bold' }}>
            Wniosek
          </Typography>
          <Typography variant="body1" paragraph>
            {getResult()}
          </Typography>
        </Paper>
      )}

      {analysis.rawData && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Szczegółowe dane
          </Typography>
          <Grid container spacing={2} display="flex" justifyContent="center">
            {analysis.datasets.years.map((year, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={year}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {year}
                    </Typography>

                    {/* Mini wykres słupkowy */}
                    <Box sx={{ height: 120, mb: 2 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareMiniChartData(year, index)}
                          layout="vertical"
                          margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            type="number"
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            tick={{ fontSize: 12 }}
                            width={0}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar
                            dataKey="value"
                            name="Wartość"
                            fill={(entry) => entry.fill}
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>

                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>
                      {metricLabels.health}: {Number(analysis.datasets.healthData[index]).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2196F3' }}>
                      {metricLabels.economic}: {Number(analysis.datasets.economicData[index]).toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </motion.div>
  );
};

export default AnalysisResults;