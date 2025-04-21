import React from 'react';
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, Chip, Divider, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const DietPlanDetails = ({ plan }) => {
  if (!plan) return null;

  return (
    <Box sx={{ p: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <RestaurantMenuIcon sx={{ fontSize: 30, color: '#FF7043', mr: 2 }} />
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
          Liczba dni dietetycznych: {plan.days?.length || 0}
        </Typography>
      </Box>

      {plan.days && plan.days.length > 0 ? (
        <>
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Dni dietetyczne:
          </Typography>

          {plan.days.map((day, index) => (
            <Accordion key={index} sx={{ mb: 1 }}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ backgroundColor: 'rgba(255,112,67,0.05)' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EventIcon sx={{ mr: 1, color: '#FF7043' }} />
                  <Typography variant="subtitle1">
                    Dzień {index + 1}: {day.name || `Dieta ${index + 1}`}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {day.meals && day.meals.length > 0 ? (
                  <List disablePadding>
                    {day.meals.map((meal, mealIndex) => (
                      <ListItem key={mealIndex} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <CheckCircleIcon sx={{ fontSize: 20, color: '#FF7043' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={meal.title || 'Posiłek'}
                          secondary={
                            <>
                              {meal.calories && `Kalorie: ${meal.calories} kcal`}
                              {meal.protein != null && `, Białko: ${meal.protein} g`}
                              {meal.carbs != null && `, Węglowodany: ${meal.carbs} g`}
                              {meal.fat != null && `, Tłuszcze: ${meal.fat} g`}
                              <Box sx={{ mt: 0.5, fontSize: '0.85rem', color: 'text.secondary' }}>
                                {meal.image && <img src={meal.image} alt={meal.title} style={{ width: '50px', height: '50px', marginRight: '10px' }} />}
                              </Box>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Brak posiłków dla tego dnia
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Ten plan nie zawiera jeszcze dni dietetycznych. Edytuj plan, aby dodać dni dietetyczne.
        </Typography>
      )}
    </Box>
  );
};

export default DietPlanDetails;