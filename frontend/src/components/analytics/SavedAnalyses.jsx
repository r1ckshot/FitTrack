import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Tooltip,
  Chip,
  CircularProgress
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import EventIcon from '@mui/icons-material/Event';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import api from '../../services/api';
import AnalysesImportExport from '../../components/import-export/AnalysesImportExport';

const SavedAnalyses = ({ analyses, onLoad, onUpdate, onDelete }) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysisTypesMap, setAnalysisTypesMap] = useState({});
  const [key, setKey] = useState(0);

  // Pobieranie typów analiz z API przy inicjalizacji komponentu
  useEffect(() => {
    const fetchAnalysisTypes = async () => {
      try {
        const response = await api.get('/analytics/analysis-types');
        if (response.data.success) {
          const typesMap = {};
          response.data.data.forEach(type => {
            typesMap[type.id] = type.name;
          });
          setAnalysisTypesMap(typesMap);
        }
      } catch (error) {
        console.error('Błąd podczas pobierania typów analiz:', error);
      }
    };
    
    fetchAnalysisTypes();
  }, []);
  
  // Otwieranie dialogu edycji nazwy
  const handleEditOpen = (analysis) => {
    setSelectedAnalysis(analysis);
    setNewName(analysis.name);
    setEditDialogOpen(true);
  };

  // Otwieranie dialogu usuwania
  const handleDeleteOpen = (analysis) => {
    setSelectedAnalysis(analysis);
    setDeleteDialogOpen(true);
  };

  // Zamykanie dialogów
  const handleClose = () => {
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
    setSelectedAnalysis(null);
  };

  // Uniwersalna funkcja do pobierania ID analizy
  const getAnalysisId = (analysis) => {
    if (analysis._id) return analysis._id;
    if (analysis.id) return analysis.id;
    return analysis._id || analysis.id || null;
  };

  // Zatwierdzanie aktualizacji nazwy
  const handleUpdateName = async () => {
    if (selectedAnalysis && newName) {
      const analysisId = getAnalysisId(selectedAnalysis);
      if (!analysisId) {
        console.error('Nie można znaleźć ID analizy:', selectedAnalysis);
        return;
      }

      setLoading(true);
      await onUpdate(analysisId, newName);
      setLoading(false);
      handleClose();
      resetAnimation(); // Reset animacji po aktualizacji
    }
  };

  // Zatwierdzanie usunięcia
  const handleDelete = async () => {
    if (selectedAnalysis) {
      const analysisId = getAnalysisId(selectedAnalysis);
      if (!analysisId) {
        console.error('Nie można znaleźć ID analizy:', selectedAnalysis);
        return;
      }

      setLoading(true);
      await onDelete(analysisId);
      setLoading(false);
      handleClose();
      resetAnimation(); // Reset animacji po usunięciu
    }
  };

  // Wczytywanie analizy
  const handleLoad = async (analysis) => {
    const analysisId = getAnalysisId(analysis);
    if (!analysisId) {
      console.error('Nie można znaleźć ID analizy:', analysis);
      return;
    }

    setLoading(true);
    await onLoad(analysisId);
    setLoading(false);
  };

  // Funkcja resetująca animację
  const resetAnimation = () => {
    setKey(prevKey => prevKey + 1);
  };

  // Formatowanie daty
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Określanie ikony dla typu analizy
  const getAnalysisTypeIcon = (type) => {
    switch (type) {
      case 'obesity_vs_health_expenditure':
        return <ShowChartIcon sx={{ color: '#FF7043' }} />;
      case 'gdp_vs_physical_activity':
        return <ShowChartIcon sx={{ color: '#4CAF50' }} />;
      case 'death_probability_vs_urbanization':
        return <ShowChartIcon sx={{ color: '#2196F3' }} />;
      case 'diabetes_vs_gini_index':
        return <ShowChartIcon sx={{ color: '#9C27B0' }} />;
      default:
        return <AnalyticsIcon sx={{ color: '#9C27B0' }} />;
    }
  };

  // Pobieranie koloru chipu na podstawie typu analizy
  const getAnalysisTypeColor = (type) => {
    switch (type) {
      case 'obesity_vs_health_expenditure':
        return '#FF7043';
      case 'gdp_vs_physical_activity':
        return '#4CAF50';
      case 'death_probability_vs_urbanization':
        return '#2196F3';
      case 'diabetes_vs_gini_index':
        return '#9C27B0';
      default:
        return '#9C27B0';
    }
  };

  // Pobieranie nazwy typu analizy z mapy lub wyświetlenie fallbacku
  const getAnalysisTypeName = (type) => {
    return analysisTypesMap[type] || "Nieznany typ";
  };

  const handleImportSuccess = () => {
  // Powiadom komponent nadrzędny, że import się powiódł
  onUpdate(); // Wywołujemy bez parametrów, aby zasygnalizować potrzebę odświeżenia listy
  resetAnimation(); // Opcjonalnie resetujemy animację
};


  return (
    <Box sx={{ width: '100%' }}>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress sx={{ color: '#4CAF50' }} />
        </Box>
      )}

      {!loading && analyses.length === 0 ? (
        <motion.div
          key={`empty-state-${key}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Box
            sx={{
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              border: '1px dashed #4CAF50',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2,
            }}
          >

            <Typography variant="h6" gutterBottom>
              Nie masz jeszcze żadnych zapisanych analiz
            </Typography>
            <Typography variant="body1">
              Utwórz nową analizę, aby zobaczyć ją tutaj.
            </Typography>

            <AnalysesImportExport
              analysisId={null}
              onImportSuccess={handleImportSuccess}
            />
          </Box>
        </motion.div>
      ) : (
        <AnimatePresence>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3, gap: 2 }}>
            <AnalysesImportExport
              analysisId={null}
              onImportSuccess={handleImportSuccess}
            />
          </Box>
          <Grid container spacing={3} key={`analyses-grid-${key}`}>
            {analyses.map((analysis, index) => (
              <Grid item xs={12} sm={6} md={4} key={`${getAnalysisId(analysis) || index}-${key}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '5px',
                        height: '100%',
                        backgroundColor: getAnalysisTypeColor(analysis.analysisType),
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {getAnalysisTypeIcon(analysis.analysisType)}
                        <Tooltip title={analysis.name} placement="top">
                          <Typography
                            variant="h6"
                            component="div"
                            sx={{
                              ml: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              lineHeight: '1.2',
                              maxHeight: '2.4em'
                            }}
                          >
                            {analysis.name}
                          </Typography>
                        </Tooltip>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Chip
                          label={getAnalysisTypeName(analysis.analysisType)}
                          size="small"
                          sx={{
                            backgroundColor: getAnalysisTypeColor(analysis.analysisType),
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                          }}
                        />
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        Kraj: {analysis.country?.name || analysis.countryName || 'Brak danych'}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        Okres: {analysis.period?.start || analysis.periodStart} - {analysis.period?.end || analysis.periodEnd}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                        <EventIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(analysis.createdAt)}
                        </Typography>
                      </Box>
                    </CardContent>

                    <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                      <Box>
                        <Tooltip title="Zmień nazwę">
                          <IconButton
                            size="small"
                            onClick={() => handleEditOpen(analysis)}
                            sx={{ color: '#2196F3' }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Usuń">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteOpen(analysis)}
                            sx={{ color: '#F44336' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      <Box sx={{ ml: 1 }}>
                        <AnalysesImportExport
                          analysisId={getAnalysisId(analysis)}
                          showImport={false}
                          onImportSuccess={handleImportSuccess}
                        />
                      </Box>

                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleLoad(analysis)}
                        sx={{
                          color: '#4CAF50',
                          borderColor: '#4CAF50',
                          '&:hover': {
                            borderColor: '#2E7D32',
                            backgroundColor: 'rgba(76, 175, 80, 0.1)',
                          },
                        }}
                      >
                        Wczytaj
                      </Button>
                    </CardActions>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </AnimatePresence>
      )}

      {/* Dialog edycji nazwy */}
      <Dialog open={editDialogOpen} onClose={handleClose}>
        <DialogTitle>Zmień nazwę analizy</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nazwa analizy"
            type="text"
            fullWidth
            variant="outlined"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Anuluj</Button>
          <Button
            onClick={handleUpdateName}
            variant="contained"
            color="primary"
            disabled={!newName.trim()}
          >
            Zapisz
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog potwierdzenia usunięcia */}
      <Dialog open={deleteDialogOpen} onClose={handleClose}>
        <DialogTitle>Potwierdzenie usunięcia</DialogTitle>
        <DialogContent>
          <Typography>
            Czy na pewno chcesz usunąć analizę "{selectedAnalysis?.name}"? Tej operacji nie można cofnąć.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Anuluj</Button>
          <Button
            onClick={handleDelete}
            sx={{ color: '#F44336' }}
            autoFocus
          >
            Usuń
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SavedAnalyses;