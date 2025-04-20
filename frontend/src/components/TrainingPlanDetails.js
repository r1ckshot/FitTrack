import React from 'react';
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, Chip, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

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
            color="success" 
            size="small" 
            sx={{ fontWeight: 'bold' }}
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
                      <ListItem key={exIndex} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircleIcon sx={{ fontSize: 20, color: '#4CAF50' }} />
                        </ListItemIcon>
                          <ListItemText
                            primary={`${exercise.exerciseName || exercise.name}`}
                            secondary={
                              <>
                                {exercise.sets} seri{exercise.sets === 1 ? 'a' : 'e'} × {exercise.reps} powtórze{exercise.reps === 1 ? 'nie' : 'ń'}
                                {exercise.weight != null && `, ${exercise.weight} kg`}
                                {exercise.restTime != null && `, przerwa: ${exercise.restTime}s`}
                                <Box sx={{ mt: 0.5, fontSize: '0.85rem', color: 'text.secondary' }}>
                                  {exercise.bodyPart && <>Partia: {exercise.bodyPart}. </>}
                                  {exercise.equipment && <>Sprzęt: {exercise.equipment}. </>}
                                  {exercise.target && <>Cel: {exercise.target}. </>}
                                </Box>
                              </>
                            }
                          />
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