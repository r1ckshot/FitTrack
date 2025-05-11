import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import FavoriteIcon from '@mui/icons-material/Favorite';
import SportsGymnasticsIcon from '@mui/icons-material/SportsGymnastics';
import EmojiFoodBeverageIcon from '@mui/icons-material/EmojiFoodBeverage';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';

const BackgroundIcons = () => {
  const [backgroundIcons, setBackgroundIcons] = useState([]);

  useEffect(() => {
    const icons = [
      <FitnessCenterIcon fontSize="inherit" />,
      <RestaurantIcon fontSize="inherit" />,
      <CalendarTodayIcon fontSize="inherit" />,
      <TrendingUpIcon fontSize="inherit" />,
      <FavoriteIcon fontSize="inherit" />,
      <SportsGymnasticsIcon fontSize="inherit" />,
      <EmojiFoodBeverageIcon fontSize="inherit" />,
      <SelfImprovementIcon fontSize="inherit" />,
    ];
    const generatedIcons = Array.from({ length: 33 }).map(() => ({
      icon: icons[Math.floor(Math.random() * icons.length)],
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 50 + 30}px`,
      opacity: Math.random() * 0.3 + 0.1,
    }));
    setBackgroundIcons(generatedIcons);
  }, []);

  return (
    <>
      {backgroundIcons.map((item, index) => (
        <Box
          key={index}
          sx={{
            position: 'absolute',
            top: item.top,
            left: item.left,
            fontSize: item.size,
            color: `rgba(255, 255, 255, ${item.opacity})`,
            animation: `float ${10 + (index % 5)}s infinite ease-in-out`,
            zIndex: 0, // Ikonki w tle mają niski z-index
            '@keyframes float': {
              '0%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(20px)' },
              '100%': { transform: 'translateY(0px)' },
            },
          }}
        >
          {item.icon}
        </Box>
      ))}
    </>
  );
};

export default BackgroundIcons;