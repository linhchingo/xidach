import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Button, Paper, Divider, Chip, CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import HistoryIcon from '@mui/icons-material/History';

import { fetchStatistics } from '../store/gamesSlice';
import { fetchRounds } from '../store/roundsSlice';
import GameStats from '../components/GameStats';
import RoundHistory from '../components/RoundHistory';
import PlayerHistoryDialog from '../components/PlayerHistoryDialog';
import LoadingScreen from '../components/LoadingScreen';

export default function GameResultPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { statistics, loading } = useSelector((state) => state.games);
  const { roundHistory } = useSelector((state) => state.rounds);
  const [historyPlayer, setHistoryPlayer] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchStatistics(id));
    dispatch(fetchRounds(id));
  }, [dispatch, id]);

  // Show loading until data for THIS specific game has arrived
  const isDataReady = statistics && String(statistics.game?.id) === String(id);

  if (loading || !isDataReady) {
    return <LoadingScreen />;
  }

  const game = statistics?.game;
  const stats = statistics?.statistics || [];

  const handlePlayerClick = (playerId, playerNameFallback) => {
    const sId = String(playerId);
    const player = (statistics?.players || []).find(p => String(p.id) === sId) || 
                   stats.find(s => String(s.player_id) === sId);
    
    setHistoryPlayer({
      id: playerId,
      name: player ? (player.name || player.player_name) : playerNameFallback
    });
    setHistoryOpen(true);
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 } }}>
      {/* Header (Sticky) */}
      <Box sx={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 1100, 
        bgcolor: 'background.default',
        py: 2,
        mx: { xs: -1.5, sm: -3 },
        px: { xs: 1.5, sm: 3 },
        mb: 2,
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />} size="small">
          Trang chủ
        </Button>
      </Box>

      {/* Title Section */}
      <Paper
        sx={{
          p: { xs: 2, sm: 4 },
          mb: 4,
          textAlign: 'center',
          background: 'linear-gradient(135deg, rgba(124, 77, 255, 0.1), rgba(0, 229, 255, 0.08))',
          border: '1px solid rgba(124, 77, 255, 0.2)',
        }}
      >
        <EmojiEventsIcon sx={{ fontSize: { xs: 40, sm: 56 }, color: '#ffd700', mb: 1 }} />
        <Typography variant="h5" fontWeight={800} gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          {game?.name || 'Kết quả cuộc chơi'}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          {game && (
            <>
              <Chip
                icon={<CalendarTodayIcon />}
                label={new Date(game.game_date).toLocaleDateString('vi-VN')}
                variant="outlined"
              />
              <Chip
                icon={<AttachMoneyIcon />}
                label={`${parseInt(game.money_per_point).toLocaleString('vi-VN')} VNĐ/điểm`}
                variant="outlined"
              />
              <Chip
                icon={<SportsScoreIcon />}
                label={`${statistics?.total_rounds || 0} ván${statistics?.cancelled_rounds ? ` (${statistics.cancelled_rounds} huỷ)` : ''}`}
                variant="outlined"
              />
            </>
          )}
        </Box>
      </Paper>

      {/* Statistics Table */}
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <EmojiEventsIcon sx={{ color: '#ffd700' }} />
        Bảng xếp hạng
      </Typography>
      <Box sx={{ mb: 4 }}>
        <GameStats 
          statistics={stats} 
          moneyPerPoint={game?.money_per_point || 1000} 
          onPlayerClick={handlePlayerClick}
        />
      </Box>

      {/* Round History */}
      <Divider sx={{ mb: 3 }} />
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <HistoryIcon color="secondary" />
        Chi tiết các ván
      </Typography>
      <RoundHistory rounds={roundHistory} onPlayerClick={handlePlayerClick} />

      <PlayerHistoryDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        player={historyPlayer}
        rounds={roundHistory}
      />
    </Container>
  );
}
