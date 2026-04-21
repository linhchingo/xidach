import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';

export default function LoadingScreen() {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bgcolor: '#0a0e17', // Dark background for premium feel
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        transition: 'opacity 0.5s ease',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
        }}
      >
        {/* Animated Background Glow */}
        <Box
          sx={{
            position: 'absolute',
            width: 100,
            height: 100,
            bgcolor: 'primary.main',
            filter: 'blur(50px)',
            opacity: 0.2,
            borderRadius: '50%',
            animation: 'pulse 2s infinite ease-in-out',
            '@keyframes pulse': {
              '0%': { transform: 'scale(0.8)', opacity: 0.1 },
              '50%': { transform: 'scale(1.2)', opacity: 0.3 },
              '100%': { transform: 'scale(0.8)', opacity: 0.1 },
            },
          }}
        />
        
        <SportsEsportsIcon sx={{ fontSize: 64, color: 'primary.main', zIndex: 1 }} />
      </Box>

      <Typography
        variant="h5"
        fontWeight={800}
        sx={{
          mb: 4,
          background: 'linear-gradient(135deg, #7c4dff, #00e5ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Xì Dách Tracker
      </Typography>

      <CircularProgress
        size={40}
        thickness={5}
        sx={{
          color: '#00e5ff',
          '& .MuiCircularProgress-circle': {
            strokeLinecap: 'round',
          },
        }}
      />
    </Box>
  );
}
