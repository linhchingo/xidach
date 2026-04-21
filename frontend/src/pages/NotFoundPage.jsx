import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import HomeIcon from '@mui/icons-material/Home';
import chibiImage from '../assets/404-chibi.png';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', py: 4 }}>
      <Box 
        component="img" 
        src={chibiImage} 
        alt="404 Chibi" 
        sx={{ 
          width: '100%', 
          maxWidth: 320, 
          mb: 3, 
          filter: 'drop-shadow(0 10px 30px rgba(255, 64, 129, 0.3))',
          animation: 'float 3s ease-in-out infinite',
          '@keyframes float': {
            '0%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-15px)' },
            '100%': { transform: 'translateY(0px)' }
          }
        }} 
      />
      
      <Typography 
        variant="h1" 
        fontWeight={900} 
        sx={{ 
          background: 'linear-gradient(135deg, #ff4081, #7c4dff)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent', 
          mb: 1,
          fontSize: { xs: '4rem', sm: '6rem' },
          textShadow: '0 0 40px rgba(255, 64, 129, 0.2)'
        }}
      >
        404
      </Typography>
      
      <Typography variant="h5" color="text.primary" fontWeight={600} sx={{ mb: 2 }}>
        Ôi không! Không tìm thấy trang này.
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 5, maxWidth: '80%' }}>
        Có vẻ như bạn đã đi lạc. Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
      </Typography>
      
      <Button 
        variant="contained" 
        size="large" 
        startIcon={<HomeIcon />} 
        onClick={() => navigate('/')}
        sx={{ 
          background: 'linear-gradient(135deg, #7c4dff, #00e5ff)', 
          px: 5, 
          py: 1.5, 
          borderRadius: 8,
          fontSize: '1.1rem',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: '0 8px 24px rgba(124, 77, 255, 0.4)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 12px 32px rgba(124, 77, 255, 0.6)'
          }
        }}
      >
        Quay lại Trang Chủ
      </Button>
    </Container>
  );
}
