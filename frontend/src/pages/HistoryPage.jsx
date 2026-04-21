import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Card, CardContent, CardActionArea,
  Grid, Chip, TextField, InputAdornment, CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GroupIcon from '@mui/icons-material/Group';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import { Button } from '@mui/material';
import LoadingScreen from '../components/LoadingScreen';
import { fetchGames } from '../store/gamesSlice';

export default function HistoryPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list: games, loading } = useSelector((state) => state.games);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchGames('completed'));
  }, [dispatch]);

  const filteredGames = games.filter((game) =>
    game.status === 'completed' && game.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />} size="small">
          Trang chủ
        </Button>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1, mt: 2 }}>
        <HistoryIcon sx={{ fontSize: 36, color: 'secondary.main' }} />
        <Typography variant="h4" fontWeight={800}>
          Lịch sử cuộc chơi
        </Typography>
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Xem lại kết quả tất cả các cuộc chơi đã hoàn thành
      </Typography>

      {/* Search */}
      <TextField
        placeholder="Tìm kiếm cuộc chơi..."
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        slotProps={{
          input: {
            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
          },
        }}
        sx={{ mb: 3, maxWidth: 400 }}
      />

      {loading ? (
        <LoadingScreen />
      ) : filteredGames.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <HistoryIcon sx={{ fontSize: 72, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {search ? 'Không tìm thấy cuộc chơi nào' : 'Chưa có cuộc chơi nào kết thúc'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filteredGames.map((game) => (
            <Grid xs={12} sm={6} md={4} key={game.id}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 30px rgba(0, 229, 255, 0.15)',
                  },
                }}
              >
                <CardActionArea
                  onClick={() => navigate(`/result/${game.id}`)}
                  sx={{ height: '100%' }}
                >
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" fontWeight={700} sx={{ flex: 1, mr: 1 }}>
                        {game.name}
                      </Typography>
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Hoàn thành"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarTodayIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {new Date(game.game_date).toLocaleDateString('vi-VN')}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AttachMoneyIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {parseInt(game.money_per_point).toLocaleString('vi-VN')} VNĐ / điểm
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <GroupIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {game.player_count} người chơi · {game.round_count} ván
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
