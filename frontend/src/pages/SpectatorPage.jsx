import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Button, Grid, Chip, Paper, Divider,
  IconButton, Alert, Tooltip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import StarIcon from '@mui/icons-material/Star';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StopIcon from '@mui/icons-material/Stop';

import { fetchGame } from '../store/gamesSlice';
import { fetchRounds, clearNewRoundFlag } from '../store/roundsSlice';
import SpectatorPlayerCard from '../components/SpectatorPlayerCard';
import RoundHistory from '../components/RoundHistory';
import PlayerHistoryDialog from '../components/PlayerHistoryDialog';
import LoadingScreen from '../components/LoadingScreen';
import NotFoundPage from './NotFoundPage';
import useGameSocket from '../hooks/useGameSocket.js';
import GameEventOverlay from '../components/GameEventOverlay';

export default function SpectatorPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentGame, loading, error } = useSelector((state) => state.games);
  const { activeRound, roundHistory, isNewRoundStarted } = useSelector((state) => state.rounds);

  const [showHistory, setShowHistory] = useState(false);
  const [historyPlayer, setHistoryPlayer] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [eventOverlay, setEventOverlay] = useState({ show: false, type: 'start', roundNumber: null });
  const isFirstRender = useRef(true);
  // Xử lý hiệu ứng bắt đầu ván mới
  useEffect(() => {
    // Bỏ qua lần render đầu tiên để tránh hiện overlay do cờ hiệu cũ còn sót lại
    if (isFirstRender.current) {
      isFirstRender.current = false;
      if (isNewRoundStarted) {
        dispatch(clearNewRoundFlag());
      }
      return;
    }

    if (isNewRoundStarted && activeRound) {
      setEventOverlay({ show: true, type: 'start', roundNumber: activeRound.round_number });

      const timer = setTimeout(() => {
        setEventOverlay(prev => ({ ...prev, show: false }));
        dispatch(clearNewRoundFlag());
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isNewRoundStarted, activeRound, dispatch]);

  // Theo dõi cuộn trang để hiển thị thanh tác vụ dính
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Kích hoạt socket hook
  useGameSocket(id, 'spectator');

  useEffect(() => {
    dispatch(fetchGame(id));
    dispatch(fetchRounds(id));
    dispatch(clearNewRoundFlag()); // Xóa cờ khi vừa vào trang

    return () => {
      dispatch({ type: 'games/clearCurrentGame' });
      dispatch({ type: 'games/clearError' });
      dispatch({ type: 'rounds/clearActiveRound' });
      dispatch(clearNewRoundFlag()); // Xóa cờ khi rời khỏi trang
    };
  }, [dispatch, id]);

  // Redirect to result page when game ends
  useEffect(() => {
    if (currentGame && String(currentGame.id) === String(id) && currentGame.status === 'completed') {
      navigate(`/result/${id}`);
    }
  }, [currentGame, id, navigate]);



  const players = currentGame?.players || [];
  const hostId = activeRound?.host_player_id;
  const roundResults = activeRound?.results || [];
  const activePlayers = players.filter(p => p.is_active !== 0);

  // Last completed round for host info
  const lastCompletedRound = [...roundHistory]
    .filter(r => r.status === 'completed')
    .sort((a, b) => b.round_number - a.round_number)[0];
  const derivedDefaultHostId = lastCompletedRound?.host_player_id || null;
  const currentHostId = activeRound ? hostId : derivedDefaultHostId;
  const currentHostName = activePlayers.find(p => p.id === currentHostId)?.name;

  const nonHostPlayers = activePlayers.filter(p => p.id !== hostId);
  // Chỉ đếm những kết quả từ những người chơi hiện đang hoạt động và không phải là Host
  const submittedCount = roundResults.filter(r =>
    r.result !== null &&
    nonHostPlayers.some(p => p.id === r.player_id)
  ).length;

  const getPlayerResult = (playerId) => {
    const result = roundResults.find(r => r.player_id === playerId);
    return result?.result || null;
  };

  const handleShowHistory = (player) => {
    setHistoryPlayer(player);
    setHistoryOpen(true);
  };

  const isCorrectGameLoaded = currentGame && String(currentGame.id) === String(id);

  if (error) {
    return <NotFoundPage />;
  }

  if (loading || !currentGame || !isCorrectGameLoaded) {
    return <LoadingScreen />;
  }

  if (currentGame && String(currentGame.id) === String(id) && currentGame.status === 'completed') {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 }, overflowX: 'hidden' }}>
      <GameEventOverlay
        show={eventOverlay.show}
        type={eventOverlay.type}
        roundNumber={eventOverlay.roundNumber}
      />
      {/* Sticky Action Bar - Hiển thị khi cuộn trang */}
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        bgcolor: 'rgba(10, 14, 26, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0, 229, 255, 0.25)',
        px: { xs: 1, sm: 2 },
        py: 0.75,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: { xs: 0.5, sm: 1 },
        transform: showStickyBar ? 'translateY(0)' : 'translateY(-100%)',
        opacity: showStickyBar ? 1 : 0,
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease',
        pointerEvents: showStickyBar ? 'auto' : 'none',
        boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
      }}>
        <Chip
          label={activeRound ? `Ván ${activeRound.round_number}` : 'Đang dừng'}
          size="small"
          icon={activeRound ? <PlayArrowIcon style={{ fontSize: '0.9rem' }} /> : <StopIcon style={{ fontSize: '0.9rem' }} />}
          sx={{
            height: 32, fontSize: '0.7rem', fontWeight: 700,
            bgcolor: activeRound ? 'rgba(124, 77, 255, 0.2)' : 'rgba(255, 82, 82, 0.15)',
            color: activeRound ? '#b47cff' : '#ff5252'
          }}
        />
        {activeRound ? (
          <Chip
            label={`${submittedCount}/${nonHostPlayers.length}`}
            size="small"
            sx={{
              height: 32, fontSize: '0.7rem', fontWeight: 700,
              bgcolor: submittedCount === nonHostPlayers.length ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 171, 64, 0.15)',
              color: submittedCount === nonHostPlayers.length ? '#00e676' : '#ffab40'
            }}
          />
        ) : (
          <Chip
            label={`${activePlayers.length} người`}
            size="small"
            sx={{ height: 32, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(0, 229, 255, 0.12)', color: '#00e5ff' }}
          />
        )}
        <Chip
          label={`${parseInt(currentGame?.money_per_point || 0).toLocaleString('vi-VN')} đ`}
          size="small"
          sx={{ height: 32, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(255, 255, 255, 0.05)', color: 'text.secondary' }}
        />
        <Tooltip title="Xem lịch sử">
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory) {
                // Cuộn xuống phần lịch sử sau một khoảng trễ ngắn để UI cập nhật
                setTimeout(() => {
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }, 100);
              }
            }}
            sx={{
              minWidth: 0, px: 1, py: 1, fontSize: '0.7rem', borderRadius: '8px',
              color: showHistory ? 'primary.main' : 'text.secondary',
              borderColor: showHistory ? 'primary.main' : 'rgba(255,255,255,0.1)'
            }}
            startIcon={<HistoryIcon sx={{ fontSize: '0.9rem !important', mr: -0.5 }} />}
          >
          </Button>
        </Tooltip>
      </Box>

      {/* Header */}
      <Box sx={{
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        bgcolor: 'background.default',
        py: { xs: 1.5, sm: 2 },
        px: { xs: 1.5, sm: 3 },
        mx: { xs: -1.5, sm: -3 },
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        mb: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <IconButton onClick={() => navigate('/')} size="small" sx={{ color: 'text.secondary' }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <SportsEsportsIcon sx={{ color: 'primary.main', display: { xs: 'none', sm: 'block' } }} />
            <Typography variant="h6" fontWeight={800} noWrap sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              {currentGame?.name}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            icon={<VisibilityIcon sx={{ fontSize: '0.85rem !important' }} />}
            label="Xem"
            size="small"
            sx={{
              height: 26, fontSize: '0.7rem', fontWeight: 700,
              bgcolor: 'rgba(0, 229, 255, 0.12)', color: '#00e5ff',
              border: '1px solid rgba(0, 229, 255, 0.3)',
            }}
          />
          <Chip
            label={`${parseInt(currentGame?.money_per_point || 0).toLocaleString('vi-VN')} VNĐ/đ`}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
          />
        </Box>
      </Box>

      {/* Stats Grid */}
      <Box sx={{ width: '100%', mb: 3 }}>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: { xs: 0.75, sm: 2 },
        }}>
          {/* Ván chơi */}
          <Paper sx={{
            p: { xs: 0.75, sm: 1.5 },
            textAlign: 'center',
            bgcolor: activeRound ? 'rgba(124, 77, 255, 0.15)' : 'rgba(255,255,255,0.03)',
            borderRadius: 2,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            border: activeRound ? '1px solid rgba(124, 77, 255, 0.6)' : '1px solid transparent',
            boxShadow: activeRound ? '0 0 15px rgba(124, 77, 255, 0.3)' : 'none',
            transition: 'all 0.3s ease'
          }}>
            <Typography variant="caption" sx={{ display: 'block', fontSize: { xs: '0.6rem', sm: '0.75rem' }, lineHeight: 1.2, color: activeRound ? '#b47cff' : 'text.secondary', fontWeight: activeRound ? 600 : 400 }}>
              {activeRound ? 'Đang chơi' : 'Ván đã chơi'}
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' }, mt: 0.5, color: activeRound ? '#fff' : 'text.primary' }}>
              {activeRound ? `Ván ${activeRound.round_number}` : roundHistory.length}
            </Typography>
          </Paper>

          {/* Người chơi / Tiến độ */}
          <Paper sx={{
            p: { xs: 0.75, sm: 1.5 },
            textAlign: 'center',
            bgcolor: activeRound
              ? (submittedCount === nonHostPlayers.length ? 'rgba(0, 230, 118, 0.12)' : 'rgba(255, 171, 64, 0.12)')
              : 'rgba(255,255,255,0.03)',
            borderRadius: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center',
            border: activeRound
              ? (submittedCount === nonHostPlayers.length ? '1px solid rgba(0, 230, 118, 0.4)' : '1px solid rgba(255, 171, 64, 0.4)')
              : '1px solid transparent',
            transition: 'all 0.3s ease'
          }}>
            <Typography variant="caption" sx={{
              display: 'block', fontSize: { xs: '0.6rem', sm: '0.75rem' }, lineHeight: 1.2,
              color: activeRound ? (submittedCount === nonHostPlayers.length ? '#00e676' : '#ffab40') : 'text.secondary',
              fontWeight: activeRound ? 600 : 400
            }}>
              {activeRound ? 'Đã chọn' : 'Người chơi'}
            </Typography>
            <Typography variant="h6" fontWeight={700} sx={{
              fontSize: { xs: '0.9rem', sm: '1.25rem' }, mt: 0.5,
              color: activeRound ? (submittedCount === nonHostPlayers.length ? '#00e676' : '#ffab40') : 'text.primary'
            }}>
              {activeRound ? `${submittedCount}/${nonHostPlayers.length}` : activePlayers.length}
            </Typography>
          </Paper>

          {/* Host hiện tại */}
          <Paper sx={{ p: { xs: 0.75, sm: 1.5 }, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: { xs: '0.6rem', sm: '0.75rem' }, lineHeight: 1.2 }}>Host</Typography>
            <Typography variant="h6" fontWeight={700} noWrap sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' }, mt: 0.5 }}>
              {currentHostName || 'Chưa chọn'}
            </Typography>
          </Paper>

          {/* Lịch sử */}
          <Paper
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory) {
                setTimeout(() => {
                  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }, 100);
              }
            }}
            sx={{
              p: { xs: 0.75, sm: 1.5 },
              textAlign: 'center',
              bgcolor: showHistory ? 'rgba(0, 229, 255, 0.12)' : 'rgba(255,255,255,0.03)',
              borderRadius: 2,
              cursor: 'pointer',
              border: showHistory ? '1px solid rgba(0, 229, 255, 0.3)' : '1px solid transparent',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
              transition: 'all 0.2s',
              userSelect: 'none'
            }}
          >
            <HistoryIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' }, color: showHistory ? '#00e5ff' : 'text.secondary', mb: 0.5 }} />
            <Typography variant="caption" sx={{ display: 'block', fontSize: { xs: '0.6rem', sm: '0.75rem' }, lineHeight: 1.2, fontWeight: 600, color: showHistory ? '#00e5ff' : 'text.secondary' }}>
              Lịch sử
            </Typography>
          </Paper>
        </Box>
      </Box>

      {/* Players Grid — Spectator layout: 1 col mobile, 2 col desktop */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Người chơi ({activePlayers.length})
      </Typography>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
        },
        gap: { xs: 1.5, sm: 2 },
        mb: 4,
        alignItems: 'stretch'
      }}>
        {players
          .filter(p => p.is_active !== 0)
          .map((player) => {
            const roundsPlayed = roundHistory.filter(r =>
              r.status === 'completed' &&
              (r.host_player_id === player.id || (r.results && r.results.some(res => res.player_id === player.id)))
            ).length;

            const isThisHost = activeRound ? player.id === hostId : player.id === currentHostId;
            return (
              <SpectatorPlayerCard
                key={player.id}
                player={player}
                isHost={isThisHost}
                roundActive={!!activeRound}
                currentResult={getPlayerResult(player.id)}
                moneyPerPoint={currentGame.money_per_point}
                roundsPlayed={roundsPlayed}
                onShowHistory={handleShowHistory}
              />
            );
          })}
      </Box>

      {/* Inactive Players */}
      {players.some(p => p.is_active === 0) && (
        <Box sx={{ mb: 4, opacity: 0.8 }}>
          <Typography variant="subtitle1" fontWeight={600} color="text.secondary" sx={{ mb: 2 }}>
            Đã rời đi ({players.filter(p => p.is_active === 0).length})
          </Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
            },
            gap: { xs: 1.5, sm: 2 }
          }}>
            {players
              .filter(p => p.is_active === 0)
              .map((player) => {
                const roundsPlayed = roundHistory.filter(r =>
                  r.status === 'completed' &&
                  (r.host_player_id === player.id || (r.results && r.results.some(res => res.player_id === player.id)))
                ).length;

                return (
                  <SpectatorPlayerCard
                    key={player.id}
                    player={player}
                    isHost={false}
                    roundActive={false}
                    currentResult={null}
                    moneyPerPoint={currentGame.money_per_point}
                    roundsPlayed={roundsPlayed}
                    onShowHistory={handleShowHistory}
                  />
                );
              })}
          </Box>
        </Box>
      )}

      {/* Round History */}
      {showHistory && (
        <Box sx={{ mb: 4 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon /> Lịch sử các ván
          </Typography>
          <RoundHistory rounds={roundHistory} onPlayerClick={(id, name) => handleShowHistory({ id, name })} />
        </Box>
      )}

      {/* Player History Dialog */}
      <PlayerHistoryDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        player={historyPlayer}
        rounds={roundHistory}
      />
    </Container>
  );
}
