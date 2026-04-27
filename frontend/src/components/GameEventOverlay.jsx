import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';

const GameEventOverlay = ({ type, roundNumber, show }) => {
  const [render, setRender] = useState(show);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (show) {
      setRender(true);
      setAnimationClass('event-overlay-enter');
    } else if (render) {
      setAnimationClass('event-overlay-exit');
      const timer = setTimeout(() => {
        setRender(false);
      }, 400); // Khớp với thời gian animation exit
      return () => clearTimeout(timer);
    }
  }, [show, render]);

  if (!render) return null;

  const config = {
    start: {
      text: roundNumber ? `Ván ${roundNumber}` : '',
      color: '#b47cff',
      shadow: 'rgba(124, 77, 255, 0.5)'
    }
  };

  const current = config[type] || config.start;

  return (
    <Box
      className={animationClass}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(10, 14, 26, 0.85)',
        backdropFilter: 'blur(12px)',
        pointerEvents: 'none',
      }}
    >
      <Box sx={{ textAlign: 'center', px: 3 }}>
        <Typography
          variant="h2"
          className="shimmer-text"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '2.5rem', sm: '4rem', md: '5rem' },
            letterSpacing: '0.1em',
            mb: 1,
            textTransform: 'uppercase',
          }}
        >
          {current.text}
        </Typography>
      </Box>

      {/* Decorative elements */}
      <Box sx={{
        position: 'absolute',
        width: '100%',
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${current.color}, transparent)`,
        top: '40%',
        opacity: 0.3,
      }} />
      <Box sx={{
        position: 'absolute',
        width: '100%',
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${current.color}, transparent)`,
        bottom: '40%',
        opacity: 0.3,
      }} />
    </Box>
  );
};

export default GameEventOverlay;
