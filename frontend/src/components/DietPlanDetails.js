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
  Button,
  Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import EventIcon from '@mui/icons-material/Event';

const DietPlanDetails = ({ plan }) => {
  if (!plan) return null;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <RestaurantMenuIcon sx={{ fontSize: 30, color: '#FF7043', mr: 2 }} />
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          {plan.name}
        </Typography>
        {plan.isActive && (
          <Chip
          label="AKTYWNY"
          size="small"
          sx={{
            fontWeight: 'bold',
            backgroundColor: '#FF7043',
            color: 'white'
          }}
        />        
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="body1" sx={{ mb: 2 }}>
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

      {plan.days?.length ? (
        <>
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Dni dietetyczne:
          </Typography>

          {plan.days.map((day, index) => (
            <Accordion key={index} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: '#FFF3E0' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EventIcon sx={{ mr: 1, color: '#FF7043' }} />
                  <Typography variant="subtitle1">
                    Dzień {index + 1}: {day.name || `Dieta ${index + 1}`}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {day.meals?.length ? (
                  <List disablePadding>
                    {day.meals.map((meal, mealIndex) => (
                      <ListItem
                        key={mealIndex}
                        disableGutters
                        sx={{ mb: 2, display: 'block' }}
                      >
                        <Paper elevation={2} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                          {meal.image && (
                            <img
                              src={meal.image}
                              alt={meal.title}
                              style={{
                                width: 70,
                                height: 70,
                                objectFit: 'cover',
                                borderRadius: 8
                              }}
                            />
                          )}
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {`#${mealIndex + 1} ${meal.title || 'Posiłek'}`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {meal.calories && `Kalorie: ${meal.calories} kcal`}
                              {meal.protein != null && ` | Białko: ${meal.protein} g`}
                              {meal.carbs != null && ` | Węglowodany: ${meal.carbs} g`}
                              {meal.fat != null && ` | Tłuszcze: ${meal.fat} g`}
                            </Typography>
                            {meal.recipeUrl && (
                              <Button
                                variant="outlined"
                                color="warning"
                                size="small"
                                href={meal.recipeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{ mt: 1, textTransform: 'none', borderRadius: 2 }}
                              >
                                Zobacz przepis
                              </Button>
                            )}
                          </Box>
                        </Paper>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Brak posiłków dla tego dnia.
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
