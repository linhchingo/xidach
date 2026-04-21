import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Button, Card, CardContent, CardActionArea,
  Grid, Chip, Fab, Skeleton, TextField, InputAdornment, Tabs, Tab, IconButton
} from '@mui/material';
import { toast } from 'react-toastify';
import AddIcon from '@mui/icons-material/Add';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import GroupIcon from '@mui/icons-material/Group';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import SortIcon from '@mui/icons-material/Sort';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useLocation } from 'react-router-dom';
import CreateGameDialog from '../components/CreateGameDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingScreen from '../components/LoadingScreen';
import { fetchGames, setFilters, deleteGame } from '../store/gamesSlice';

export default function HomePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list: games, loading, filters } = useSelector((state) => state.games);
  const { search, tab, sortOrder } = filters;
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);
  const location = useLocation();

  // Load games on mount
  useEffect(() => {
    dispatch(fetchGames());
  }, [dispatch]);

  // Handle manual scroll restoration after data loads
  useEffect(() => {
    if (!loading && games.length > 0) {
      const savedScroll = sessionStorage.getItem('homeScrollPos');
      if (savedScroll) {
        const timer = setTimeout(() => {
          window.scrollTo({
            top: parseInt(savedScroll),
            behavior: 'instant'
          });
          sessionStorage.removeItem('homeScrollPos');
        }, 50);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, games.length]);

  const handleSetFilters = (newFilters) => {
    dispatch(setFilters(newFilters));
  };

  const safeGames = Array.isArray(games) ? games : [];

  const filteredGames = safeGames.filter((game) => {
    const name = game?.name || '';
    const matchSearch = name.toLowerCase().includes(search.toLowerCase());
    if (tab === 1) return matchSearch && game.status === 'active';
    if (tab === 2) return matchSearch && game.status === 'completed';
    return matchSearch;
  });

  const sortedGames = [...filteredGames].sort((a, b) => {
    const dateA = new Date(a.game_date).getTime();
    const dateB = new Date(b.game_date).getTime();
    
    if (dateA !== dateB) {
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    }
    
    return sortOrder === 'desc' ? b.id - a.id : a.id - b.id;
  });

  const handleDeleteClick = (e, gameId) => {
    e.stopPropagation();
    setGameToDelete(gameId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!gameToDelete) return;
    try {
      await dispatch(deleteGame(gameToDelete)).unwrap();
      toast.success('Đã xoá cuộc chơi thành công');
    } catch (err) {
      toast.error(err.payload?.error || 'Lỗi xoá cuộc chơi');
    }
    setDeleteConfirmOpen(false);
    setGameToDelete(null);
  };

  const handleGameClick = (id, status) => {
    // Save scroll position before navigating away
    sessionStorage.setItem('homeScrollPos', window.scrollY.toString());
    navigate(status === 'completed' ? `/result/${id}` : `/game/${id}`);
  };

  if (loading) return <LoadingScreen />;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 }, minHeight: '101vh' }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 5 } }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, mb: 1 }}>
          <SportsEsportsIcon sx={{ fontSize: { xs: 32, sm: 48 }, color: 'primary.main' }} />
          <Typography
            variant="h3"
            fontWeight={800}
            sx={{
              background: 'linear-gradient(135deg, #7c4dff, #00e5ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '1.75rem', sm: '3rem' }
            }}
          >
            Xì Dách Tracker
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" fontWeight={400} sx={{ fontSize: { xs: '0.85rem', sm: '1.25rem' } }}>
          Lưu trữ và thống kê kết quả cuộc chơi xì dách
        </Typography>
      </Box>

      {/* Search & Filters (Sticky) */}
      <Box sx={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 1100, 
        bgcolor: 'background.default',
        py: 2,
        mb: 1,
        display: 'flex', 
        gap: 2, 
        flexWrap: 'wrap', 
        alignItems: 'center', 
        flexDirection: { xs: 'column', sm: 'row' },
        boxShadow: '0 8px 16px -8px rgba(0,0,0,0.5)',
        mx: { xs: -1.5, sm: -3 },
        px: { xs: 1.5, sm: 3 },
      }}>
        <TextField
          placeholder="Tìm kiếm..."
          size="small"
          value={search}
          onChange={(e) => handleSetFilters({ search: e.target.value })}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
              ),
              sx: { fontSize: '0.875rem' }
            },
          }}
          sx={{ flex: { xs: 'none', sm: 1 }, width: { xs: '100%', sm: 'auto' } }}
        />
        <Tabs 
          value={tab} 
          onChange={(_, v) => handleSetFilters({ tab: v })} 
          sx={{ 
            minHeight: 40, 
            width: { xs: '100%', sm: 'auto' },
            '& .MuiTabs-flexContainer': { justifyContent: { xs: 'center', sm: 'flex-start' } }
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Tất cả" sx={{ minHeight: 40, py: 0, fontSize: '0.8rem' }} />
          <Tab label="Đang chơi" sx={{ minHeight: 40, py: 0, fontSize: '0.8rem' }} />
          <Tab label="Xong" sx={{ minHeight: 40, py: 0, fontSize: '0.8rem' }} />
        </Tabs>

        <Box sx={{ ml: { xs: 0, sm: 'auto' }, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {sortOrder === 'desc' ? 'Mới nhất' : 'Cũ nhất'}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={() => handleSetFilters({ sortOrder: sortOrder === 'desc' ? 'asc' : 'desc' })}
            startIcon={<SortIcon />}
            endIcon={sortOrder === 'desc' ? <ArrowDownwardIcon sx={{ fontSize: '0.9rem !important' }} /> : <ArrowUpwardIcon sx={{ fontSize: '0.9rem !important' }} />}
            sx={{ 
              borderRadius: 2, 
              fontSize: '0.75rem', 
              py: 0.5,
              borderColor: 'rgba(255,255,255,0.1)',
              color: 'text.primary',
              '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(124, 77, 255, 0.05)' }
            }}
          >
            Sắp xếp
          </Button>
        </Box>
      </Box>

      {/* Games Grid */}
      {loading ? (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, 
          gap: 2 
        }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={180} sx={{ borderRadius: 3, width: '100%' }} />
          ))}
        </Box>
      ) : filteredGames.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <SportsEsportsIcon sx={{ fontSize: 72, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {search ? 'Không tìm thấy cuộc chơi nào' : 'Chưa có cuộc chơi nào'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateOpen(true)}
            sx={{ mt: 2 }}
          >
            Tạo cuộc chơi mới
          </Button>
        </Box>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(2, 1fr)', 
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)' 
          }, 
          gap: 2,
          alignItems: 'stretch'
        }}>
          {sortedGames.map((game) => (
            <Card
              key={game.id}
              sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: game.status === 'active'
                    ? '0 12px 30px rgba(124, 77, 255, 0.2)'
                    : '0 12px 30px rgba(0, 229, 255, 0.15)',
                },
              }}
            >
              <CardActionArea
                onClick={() => handleGameClick(game.id, game.status)}
                sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
              >
                  <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" fontWeight={700} sx={{ flex: 1, mr: 1, lineHeight: 1.2 }}>
                        {game.name}
                      </Typography>
                      <Chip
                        icon={game.status === 'active' ? <PlayArrowIcon /> : <CheckCircleIcon />}
                        label={game.status === 'active' ? 'Đang chơi' : 'Đã kết thúc'}
                        size="small"
                        color={game.status === 'active' ? 'primary' : 'default'}
                        variant={game.status === 'active' ? 'filled' : 'outlined'}
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

              {/* Delete Button — outside CardActionArea to avoid nested <button> */}
              {game.status === 'completed' && (
                <IconButton
                  size="small"
                  onClick={(e) => handleDeleteClick(e, game.id)}
                  sx={{
                    position: 'absolute',
                    bottom: 12,
                    right: 12,
                    zIndex: 10,
                    color: 'text.secondary',
                    opacity: 0.4,
                    transition: 'all 0.2s',
                    '&:hover': {
                      color: 'error.main',
                      bgcolor: 'rgba(211, 47, 47, 0.08)',
                      opacity: 1,
                      transform: 'scale(1.1)'
                    }
                  }}
                >
                  <DeleteIcon sx={{ fontSize: '1.1rem' }} />
                </IconButton>
              )}
            </Card>
          ))}
        </Box>
      )}

      {/* FAB */}
      <Fab
        color="primary"
        onClick={() => setCreateOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          boxShadow: '0 6px 20px rgba(124, 77, 255, 0.4)',
        }}
      >
        <AddIcon />
      </Fab>

      <CreateGameDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xoá cuộc chơi"
        message="Bạn có chắc chắn muốn xoá cuộc chơi này và toàn bộ dữ liệu liên quan? Hành động này không thể hoàn tác."
        confirmText="Xoá vĩnh viễn"
      />
    </Container>
  );
}
