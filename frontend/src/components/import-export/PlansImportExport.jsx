import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Alert,
  AlertTitle,
  CircularProgress,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useSnackbar } from '../../contexts/SnackbarContext';
import api from '../../services/api';

const PlansImportExport = ({ planType, planId, onImportSuccess, showImport = true, showExport = true }) => {
  // planType powinno być 'training' lub 'diet'

  const [importDialog, setImportDialog] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [exportFormat, setExportFormat] = useState('json');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [duplicateStrategy, setDuplicateStrategy] = useState('prefix');

  const { showSnackbar } = useSnackbar();

  // Funkcja do otwierania okna dialogowego importu
  const handleOpenImport = () => {
    setImportDialog(true);
    setError(null);
    setSuccess(null);
    setSelectedFile(null);
    setDuplicateStrategy('prefix');
  };

  // Funkcja do otwierania okna dialogowego eksportu
  const handleOpenExport = () => {
    setExportDialog(true);
    setError(null);
  };

  // Funkcja do zamykania okna dialogowego importu
  const handleCloseImport = () => {
    setImportDialog(false);
    setSelectedFile(null);
    setError(null);
    setSuccess(null);
  };

  // Funkcja do zamykania okna dialogowego eksportu
  const handleCloseExport = () => {
    setExportDialog(false);
    setError(null);
  };

  // Obsługa zmiany pliku
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Sprawdź rozszerzenie pliku
      const fileExt = file.name.split('.').pop().toLowerCase();
      const validExtensions = ['json', 'xml', 'yaml', 'yml'];

      if (!validExtensions.includes(fileExt)) {
        showSnackbar(`Nieprawidłowy format pliku. Obsługujemy formaty: ${validExtensions.join(', ')}`, 'error');
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };

  // Funkcja do importowania planu
  const handleImport = async () => {
    if (!selectedFile) {
      showSnackbar('Proszę wybrać plik do importu', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('duplicateStrategy', duplicateStrategy);

      // Ustalenie odpowiedniego endpointu
      const endpoint = planType === 'training'
        ? '/training-plans/import'
        : '/diet-plans/import';

      // Dodaj timeout dla żądania
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000  // 30 sekund timeout
      });

      showSnackbar('Plan został pomyślnie zaimportowany!', 'success');

      // Informujemy komponent nadrzędny o potrzebie odświeżenia listy planów
      if (onImportSuccess) {
        setTimeout(() => {
          onImportSuccess();
          handleCloseImport();
        }, 1000); // Zamknij okno po krótkim opóźnieniu
      }
    } catch (error) {
      console.error('Błąd importu:', error);

      let errorMessage;
      if (error.code === 'ECONNABORTED' || !error.response) {
        errorMessage = 'Serwer nie odpowiada lub połączenie zostało przerwane. Spróbuj ponownie.';
      } else {
        errorMessage = error.response?.data?.error || 'Wystąpił błąd podczas importu planu';
      }

      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Funkcja do eksportowania planu
  const handleExport = async () => {
    if (!planId) {
      showSnackbar('Nie można eksportować planu. Brak ID planu.', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Ustalenie odpowiedniego endpointu
      const endpoint = planType === 'training'
        ? `/training-plans/${planId}/export`
        : `/diet-plans/${planId}/export`;

      // Wykonanie zapytania GET z parametrem formatu
      const response = await api.get(`${endpoint}?format=${exportFormat}`, {
        responseType: 'blob' // Ważne dla pobierania plików
      });

      // Tworzenie URL dla pobranego pliku
      const fileURL = window.URL.createObjectURL(new Blob([response.data]));

      // Określ prefiks nazwy pliku w zależności od typu planu
      const filePrefix = planType === 'training'
        ? 'training-plan'
        : 'diet-plan';

      // Pobierz nazwę pliku z nagłówków lub użyj domyślnej
      let filename = `${filePrefix}-export`;
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=(.+)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      if (!filename.includes(`.${exportFormat}`)) {
        filename += `.${exportFormat}`;
      }

      // Upewnij się, że nazwa zaczyna się od odpowiedniego prefiksu
      if (!filename.startsWith(filePrefix)) {
        filename = `${filePrefix}-${filename}`;
      }

      // Tworzenie tymczasowego elementu <a> do pobrania pliku
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      // Czyszczenie
      document.body.removeChild(link);
      window.URL.revokeObjectURL(fileURL);

      showSnackbar('Plan został pomyślnie wyeksportowany!', 'success');

      // Zamknij okno po krótkim opóźnieniu
      setTimeout(() => {
        handleCloseExport();
      }, 1000);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Wystąpił błąd podczas eksportu planu';
      showSnackbar(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Przyciski do otwierania okien dialogowych */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        {showImport && (
          <Button
            variant="contained"  // Zmiana z outlined na contained dla lepszej widoczności
            startIcon={<UploadFileIcon />}
            onClick={handleOpenImport}
            size="small"
            sx={{
              backgroundColor: '#4CAF50',
              color: 'white',
              '&:hover': {
                backgroundColor: '#388E3C',
              },
              fontWeight: 'bold',  // Pogrubiona czcionka dla lepszej widoczności
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',  // Dodanie cienia
            }}
          >
            Import
          </Button>
        )}

        {showExport && planId && (
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleOpenExport}
            size="small"
            sx={{
              borderColor: planType === 'training' ? '#FFA000' : '#1976D2',
              color: planType === 'training' ? '#FFA000' : '#1976D2',
              '&:hover': {
                borderColor: planType === 'training' ? '#FF8F00' : '#1565C0',
                backgroundColor: planType === 'training'
                  ? 'rgba(255, 160, 0, 0.1)'
                  : 'rgba(25, 118, 210, 0.1)',
              },
            }}
          >
            Eksport
          </Button>
        )}
      </Box>

      {/* Dialog importu */}
      <Dialog open={importDialog} onClose={handleCloseImport} maxWidth="sm" fullWidth>
        <DialogTitle>Import planu {planType === 'training' ? 'treningowego' : 'dietetycznego'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Błąd</AlertTitle>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <AlertTitle>Sukces</AlertTitle>
              {success}
            </Alert>
          )}

          <Box sx={{ mb: 3, mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Wybierz plik planu w formacie JSON, XML lub YAML do zaimportowania.
              Format pliku zostanie wykryty automatycznie.
            </Typography>

            <input
              accept=".json,.xml,.yaml,.yml"
              style={{ display: 'none' }}
              id="raised-button-file"
              type="file"
              onChange={handleFileChange}
              disabled={loading}
            />
            <label htmlFor="raised-button-file">
              <Button
                variant="contained"
                component="span"
                sx={{ mt: 2, mb: 2 }}
                disabled={loading}
              >
                Wybierz plik
              </Button>
            </label>

            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Wybrany plik: {selectedFile.name}
              </Typography>
            )}
          </Box>

          {/* Opcje obsługi duplikatów */}
          <Box sx={{ mb: 2, mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Co zrobić gdy plan o takiej nazwie już istnieje?
            </Typography>

            <RadioGroup
              value={duplicateStrategy}
              onChange={(e) => setDuplicateStrategy(e.target.value)}
            >
              <FormControlLabel
                value="prefix"
                control={<Radio />}
                label="Dodaj prefix do nazwy (np. 'Kopia - Mój Plan')"
                disabled={loading}
              />
              <FormControlLabel
                value="reject"
                control={<Radio />}
                label="Odrzuć import"
                disabled={loading}
              />
              <FormControlLabel
                value="replace"
                control={<Radio />}
                label="Zastąp istniejący plan"
                disabled={loading}
              />
            </RadioGroup>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImport} disabled={loading}>
            Anuluj
          </Button>
          <Button
            onClick={handleImport}
            variant="contained"
            color="primary"
            disabled={!selectedFile || loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Importowanie...' : 'Importuj'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog eksportu */}
      <Dialog open={exportDialog} onClose={handleCloseExport} maxWidth="sm" fullWidth>
        <DialogTitle>Eksport planu {planType === 'training' ? 'treningowego' : 'dietetycznego'}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Błąd</AlertTitle>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3, mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Wybierz format, w którym chcesz wyeksportować plan.
            </Typography>
          </Box>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="export-format-label">Format eksportu</InputLabel>
            <Select
              labelId="export-format-label"
              value={exportFormat}
              label="Format eksportu"
              onChange={(e) => setExportFormat(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="json">JSON</MenuItem>
              <MenuItem value="xml">XML</MenuItem>
              <MenuItem value="yaml">YAML</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseExport} disabled={loading}>
            Anuluj
          </Button>
          <Button
            onClick={handleExport}
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Eksportowanie...' : 'Eksportuj'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PlansImportExport;