import React from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Divider,
  List,
  ListItem,
  Grid,
  Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import EventIcon from '@mui/icons-material/Event';

const TrainingPlanDetails = ({ plan }) => {
  if (!plan) return null;

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FitnessCenterIcon sx={{ fontSize: 30, color: '#4CAF50', mr: 2 }} />
        <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
          {plan.name}
        </Typography>
        {plan.isActive && (
          <Chip
            label="AKTYWNY"
            size="small"
            sx={{
              fontWeight: 'bold',
              backgroundColor: '#4CAF50',
              color: 'white'
            }}
          />
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
        {plan.description || 'Brak opisu'}
      </Typography>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Data utworzenia: {new Date(plan.dateCreated).toLocaleDateString()}
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Liczba dni treningowych: {plan.days?.length || 0}
        </Typography>
      </Box>

      {plan.days && plan.days.length > 0 ? (
        <>
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Dni treningowe:
          </Typography>

          {plan.days.map((day, index) => (
            <Accordion key={index} sx={{ mb: 1 }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ backgroundColor: 'rgba(76,175,80,0.05)' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EventIcon sx={{ mr: 1, color: '#4CAF50' }} />
                  <Typography variant="subtitle1">
                    Dzień {index + 1}: {day.name || `Trening ${index + 1}`}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {day.exercises && day.exercises.length > 0 ? (
                  <List disablePadding>
                    {day.exercises.map((exercise, exIndex) => (
                      <ListItem key={exIndex} disableGutters sx={{ mb: 2 }}>
                        <Paper
                          elevation={1}
                          sx={{
                            p: 2,
                            width: '100%',
                            borderRadius: 2,
                            backgroundColor: 'rgba(76,175,80,0.04)'
                          }}
                        >
                          <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={8}>
                              <Typography variant="subtitle1" fontWeight="bold">
                                #{exIndex + 1} {exercise.exerciseName || exercise.name}
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.5 }}>
                                {exercise.sets} seri{exercise.sets === 1 ? 'a' : 'e'} × {exercise.reps} powtórze{exercise.reps === 1 ? 'nie' : 'ń'}
                                {exercise.weight != null && `, ${exercise.weight} kg`}
                                {exercise.restTime != null && `, przerwa: ${exercise.restTime}s`}
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                                {exercise.bodyPart && <>Partia: {exercise.bodyPart}. </>}
                                {exercise.equipment && <>Sprzęt: {exercise.equipment}. </>}
                                {exercise.target && <>Cel: {exercise.target}. </>}
                              </Typography>
                            </Grid>
                            {exercise.gifUrl && (
                              <Grid item xs={12} sm={4}>
                                <Box
                                  sx={{
                                    textAlign: 'center',
                                    '& img': {
                                      width: '100%',
                                      maxHeight: '120px',
                                      objectFit: 'cover',
                                      borderRadius: 2,
                                      transition: 'transform 0.3s ease-in-out',
                                      '&:hover': {
                                        transform: 'scale(1.1)'
                                      }
                                    }
                                  }}
                                >
                                  <a
                                    href={exercise.gifUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <img
                                      src={exercise.gifUrl}
                                      alt={exercise.exerciseName || exercise.name}
                                    />
                                  </a>

                                </Box>
                              </Grid>
                            )}
                          </Grid>
                        </Paper>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Brak ćwiczeń dla tego dnia
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Ten plan nie zawiera jeszcze dni treningowych. Edytuj plan, aby dodać dni treningowe.
        </Typography>
      )}
    </Box>
  );
};

export default TrainingPlanDetails;
