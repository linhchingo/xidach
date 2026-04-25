import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Button, Grid, Chip, Paper, Divider,
  IconButton, Tooltip, CircularProgress, Alert
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import CancelIcon from '@mui/icons-material/Cancel';
import FlagIcon from '@mui/icons-material/Flag';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import StarIcon from '@mui/icons-material/Star';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { toast } from 'react-toastify';

import { fetchGame } from '../store/gamesSlice';
import { startRound, submitResult, endRound, cancelRound, changeHost, fetchRounds } from '../store/roundsSlice';
import { endGame, removePlayer, addPlayer } from '../store/gamesSlice';
import PlayerCard from '../components/PlayerCard';
import AddPlayerDialog from '../components/AddPlayerDialog';
import SelectHostDialog from '../components/SelectHostDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import RoundHistory from '../components/RoundHistory';
import BigWinDialog from '../components/BigWinDialog';
import PlayerHistoryDialog from '../components/PlayerHistoryDialog';
import LoadingScreen from '../components/LoadingScreen';
import PinVerifyDialog from '../components/PinVerifyDialog';
import NotFoundPage from './NotFoundPage';
import useGameSocket from '../hooks/useGameSocket.js';

export default function GamePage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentGame, loading, error } = useSelector((state) => state.games);
  const { activeRound, roundHistory } = useSelector((state) => state.rounds);

  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [selectHostOpen, setSelectHostOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [endRoundConfirmOpen, setEndRoundConfirmOpen] = useState(false);
  const [endGameConfirmOpen, setEndGameConfirmOpen] = useState(false);
  const [manualHostId, setManualHostId] = useState(null);
  const [selectHostMode, setSelectHostMode] = useState('start'); // 'start', 'change', or 'change_active'
  const [showHistory, setShowHistory] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [playerToRemove, setPlayerToRemove] = useState(null);
  const [bigWinDialogOpen, setBigWinDialogOpen] = useState(false);
  const [historyPlayer, setHistoryPlayer] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [pinVerified, setPinVerified] = useState(false);
  const [pinCheckReady, setPinCheckReady] = useState(false);

  // Track scroll to show/hide sticky action bar
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 460);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Kích hoạt socket hook
  useGameSocket(id, 'manager');

  useEffect(() => {
    dispatch(fetchGame(id));
    dispatch(fetchRounds(id));

    return () => {
      dispatch({ type: 'games/clearCurrentGame' });
      dispatch({ type: 'games/clearError' });
      dispatch({ type: 'rounds/clearActiveRound' });
    };
  }, [dispatch, id]);

  // Điều hướng sang trang kết quả khi cuộc chơi kết thúc
  useEffect(() => {
    if (currentGame && String(currentGame.id) === String(id) && currentGame.status === 'completed') {
      navigate(`/result/${id}`);
    }
  }, [currentGame, id, navigate]);

  // Check if there's an active round from the game data
  useEffect(() => {
    if (currentGame && currentGame.rounds) {
      const active = currentGame.rounds.find(r => r.status === 'active');
      if (active && !activeRound) {
        // Restore active round state
        dispatch({ type: 'rounds/startRound/fulfilled', payload: active });
      }
    }
  }, [currentGame]);

  const players = currentGame?.players || [];
  const hostId = activeRound?.host_player_id;
  const roundResults = activeRound?.results || [];

  // Lấy host của ván gần nhất trong lịch sử
  const lastCompletedRound = [...roundHistory]
    .filter(r => r.status === 'completed')
    .sort((a, b) => b.round_number - a.round_number)[0];

  const derivedDefaultHostId = lastCompletedRound?.host_player_id || null;
  const currentHostId = manualHostId || derivedDefaultHostId;
  const activePlayers = players.filter(p => p.is_active !== 0);
  const currentHostName = activePlayers.find(p => p.id === currentHostId)?.name;

  const getPlayerResult = (playerId) => {
    const result = roundResults.find(r => r.player_id === playerId);
    return result?.result || null;
  };

  const nonHostPlayers = activePlayers.filter(p => p.id !== hostId);
  const hasPay = roundResults.some(r => r.result === 'pay');
  // Round can end if: someone chose pay (instant end) OR all non-host active players submitted
  const allNonHostSubmitted = activeRound && (
    hasPay ||
    (nonHostPlayers.length > 0 && nonHostPlayers.every(p => roundResults.some(r => r.player_id === p.id)))
  );

  const handleSelectResult = async (playerId, result) => {
    if (!activeRound) return;

    // Check if clicking same result to toggle/deselect
    const currentResult = getPlayerResult(playerId);
    const resultToSubmit = currentResult === result ? null : result;

    try {
      await dispatch(submitResult({
        roundId: activeRound.id,
        playerId,
        result: resultToSubmit
      })).unwrap();
    } catch (err) {
      toast.error(err.error || 'Lỗi ghi nhận kết quả');
    }
  };

  const handleStartRoundClick = () => {
    if (currentHostId) {
      handleStartRound(currentHostId);
    } else {
      setSelectHostMode('start');
      setSelectHostOpen(true);
    }
  };

  const handleOpenChangeHost = () => {
    setSelectHostMode('change');
    setSelectHostOpen(true);
  };

  const handleOpenChangeHostDuringRound = () => {
    setSelectHostMode('change_active');
    setSelectHostOpen(true);
  };

  const handleHostSelected = (selectedId) => {
    if (selectHostMode === 'start') {
      handleStartRound(selectedId);
    } else if (selectHostMode === 'change_active') {
      handleChangeHostDuringRound(selectedId);
    } else {
      setManualHostId(selectedId);
      toast.info(`Đã đổi Host sang: ${players.find(p => p.id === selectedId)?.name}`);
    }
  };

  const handleStartRound = (hostPlayerId) => {
    dispatch(startRound({ gameId: parseInt(id), hostPlayerId }))
      .unwrap()
      .then(() => {
        toast.success('Đã bắt đầu ván mới!');
      })
      .catch((err) => {
        toast.error(err.error || 'Lỗi bắt đầu ván');
      });
  };

  const handleEndRound = async (defaultLosers = []) => {
    if (!activeRound) return;
    try {
      const hostPlayerId = activeRound.host_player_id;
      await dispatch(endRound({ roundId: activeRound.id, defaultLosers })).unwrap();
      toast.success(`Ván ${activeRound.round_number} đã kết thúc!`);

      // Auto-start next round with the same host
      handleStartRound(hostPlayerId);
    } catch (err) {
      toast.error(err.error || 'Lỗi kết thúc ván');
    }
  };

  // Branches on "Kết thúc ván" click: instant end if all submitted, else confirm dialog
  const handleEndRoundClick = () => {
    if (allNonHostSubmitted) {
      handleEndRound();
    } else {
      setEndRoundConfirmOpen(true);
    }
  };

  // Ends round early, assigning 'lose' to players who haven't submitted
  const handleEndRoundWithDefaults = () => {
    const missingPlayerIds = nonHostPlayers
      .filter(p => !roundResults.some(r => r.player_id === p.id))
      .map(p => p.id);
    handleEndRound(missingPlayerIds);
    setEndRoundConfirmOpen(false);
  };

  const handleChangeHostDuringRound = async (newHostId) => {
    if (!activeRound) return;
    try {
      await dispatch(changeHost({ roundId: activeRound.id, newHostId })).unwrap();
      // Persist the new host so it remains even after round cancel/end
      setManualHostId(newHostId);
      toast.info('Đã đổi Host. Tất cả kết quả trong ván đã được reset.');
    } catch (err) {
      toast.error(err.error || 'Lỗi đổi host');
    }
  };

  const handleCancelRound = async () => {
    if (!activeRound) return;
    try {
      await dispatch(cancelRound(activeRound.id)).unwrap();
      toast.info('Ván đã bị huỷ');
    } catch (err) {
      toast.error(err.error || 'Lỗi huỷ ván');
    }
    setCancelConfirmOpen(false);
  };

  const handleEndGame = async () => {
    try {
      const result = await dispatch(endGame(parseInt(id))).unwrap();
      if (result.deleted) {
        toast.info(result.message || 'Cuộc chơi chưa có ván nào nên đã được xoá');
        navigate('/');
      } else {
        toast.success('Cuộc chơi đã kết thúc!');
        // Socket.IO sẽ nhận event game_ended và tự redirect, nhưng phòng hờ cứ để navigate
        navigate(`/result/${id}`);
      }
    } catch (err) {
      toast.error(err.error || 'Lỗi kết thúc cuộc chơi');
    }
    setEndGameConfirmOpen(false);
  };

  const handleRemovePlayerClick = (playerId) => {
    if (activeRound && activePlayers.length <= 2) {
      toast.warning('Không thể xoá người chơi khi ván chưa kết thúc và chỉ còn 2 người');
      return;
    }
    setPlayerToRemove(playerId);
    setRemoveConfirmOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (!playerToRemove) return;
    try {
      await dispatch(removePlayer({ gameId: parseInt(id), playerId: playerToRemove })).unwrap();
      toast.info('Đã loại người chơi');
    } catch (err) {
      toast.error(err.error || 'Lỗi loại bỏ người chơi');
    }
    setRemoveConfirmOpen(false);
    setPlayerToRemove(null);
  };

  const handleRestorePlayer = async (name) => {
    try {
      await dispatch(addPlayer({ gameId: parseInt(id), name })).unwrap();
      toast.success(`Đã thêm lại: ${name}`);
    } catch (err) {
      toast.error(err.error || 'Lỗi thêm lại người chơi');
    }
  };

  const handleHostBigWin = async (selectedIds) => {
    if (!activeRound || selectedIds.length === 0) return;
    try {
      // Submit lose_big for each selected player sequentially
      for (const playerId of selectedIds) {
        await dispatch(submitResult({
          roundId: activeRound.id,
          playerId,
          result: 'lose_big'
        })).unwrap();
      }
      toast.success(`Đã đánh dấu ${selectedIds.length} người Thua x2!`);
    } catch (err) {
      toast.error(err.error || 'Lỗi ghi nhận Thắng x2');
    }
  };

  const handleShowHistory = (player) => {
    setHistoryPlayer(player);
    setHistoryOpen(true);
  };

  const isCorrectGameLoaded = currentGame && String(currentGame.id) === String(id);

  // PIN guard: check localStorage once game data is loaded
  useEffect(() => {
    if (!isCorrectGameLoaded) return;
    const savedPin = localStorage.getItem(`game_pin_${id}`);
    if (savedPin) {
      setPinVerified(true);
    }
    setPinCheckReady(true);
  }, [isCorrectGameLoaded, id]);

  if (error) {
    return <NotFoundPage />;
  }

  if (loading || !currentGame || !isCorrectGameLoaded) {
    return <LoadingScreen />;
  }

  if (currentGame && String(currentGame.id) === String(id) && currentGame.status === 'completed') {
    return null;
  }

  // Show PIN dialog if not verified
  if (pinCheckReady && !pinVerified) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <PinVerifyDialog
          open={true}
          onClose={() => navigate('/')}
          gameId={parseInt(id)}
          onVerified={() => setPinVerified(true)}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1.5, sm: 3 }, overflowX: 'hidden' }}>
      {/* Header (Sticky) */}
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
        transition: 'all 0.2s',
        gap: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <IconButton onClick={() => navigate(-1)} size="small" sx={{ color: 'text.secondary' }}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <SportsEsportsIcon sx={{ color: 'primary.main', display: { xs: 'none', sm: 'block' } }} />
            <Typography variant="h6" fontWeight={800} noWrap sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              {currentGame?.name}
            </Typography>
          </Box>
        </Box>
        <Chip
          label={`${parseInt(currentGame?.money_per_point || 0).toLocaleString('vi-VN')} VNĐ/đ`}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 700, fontSize: '0.7rem' }}
        />
      </Box>

      {/* Sticky Action Bar - visible on scroll */}
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        bgcolor: 'rgba(10, 14, 26, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(124, 77, 255, 0.2)',
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
        {activeRound ? (
          /* ── During Round ── */
          <>
            <Chip
              label={`Ván ${activeRound.round_number}`}
              size="small"
              sx={{ height: 32, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(124, 77, 255, 0.2)', color: '#b47cff' }}
            />
            <Chip
              label={`${roundResults.length}/${nonHostPlayers.length}`}
              size="small"
              sx={{ height: 32, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(0, 230, 118, 0.15)', color: '#00e676' }}
            />
            <Tooltip title={!allNonHostSubmitted ? 'Kết thúc ván sớm' : 'Kết thúc ván'} placement="bottom">
              <Button
                variant="contained"
                color="success"
                size="small"
                onClick={handleEndRoundClick}
                sx={{
                  minWidth: 0, px: 1.5, py: 1, fontSize: '0.7rem', lineHeight: 1.2, borderRadius: '8px',
                  ...(allNonHostSubmitted && {
                    animation: 'heartbeat 1.5s ease-in-out infinite',
                  }), '& .MuiButton-startIcon': { mr: '4px' }
                }}
                startIcon={<StopIcon sx={{ fontSize: '0.9rem !important' }} />}
              >
                Kết thúc ván
              </Button>
            </Tooltip>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setAddPlayerOpen(true)}
              sx={{ minWidth: 0, px: 1, py: 1, fontSize: '0.7rem', lineHeight: 1.2, borderRadius: '8px', '& .MuiButton-startIcon': { mr: '4px' } }}
              startIcon={<PersonAddIcon sx={{ fontSize: '0.9rem !important' }} />}
            >
              Thêm
            </Button>
          </>
        ) : (
          /* ── Outside Round ── */
          <>
            <Chip
              label={`${roundHistory.length} ván`}
              size="small"
              sx={{ height: 32, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(124, 77, 255, 0.2)', color: '#b47cff' }}
            />
            <Chip
              label={`${activePlayers.length} người`}
              size="small"
              sx={{ height: 32, fontSize: '0.7rem', fontWeight: 700, bgcolor: 'rgba(0, 229, 255, 0.15)', color: '#00e5ff' }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={() => setAddPlayerOpen(true)}
              sx={{ minWidth: 0, px: 1, py: 1, fontSize: '0.7rem', lineHeight: 1.2, borderRadius: '8px', '& .MuiButton-startIcon': { mr: '4px' } }}
              startIcon={<PersonAddIcon sx={{ fontSize: '0.85rem !important' }} />}
            >
              Thêm
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleStartRoundClick}
              disabled={activePlayers.length < 2}
              sx={{ minWidth: 0, px: 1, py: 1, fontSize: '0.7rem', lineHeight: 1.2, borderRadius: '8px', '& .MuiButton-startIcon': { mr: '4px' } }}
              startIcon={<PlayArrowIcon sx={{ fontSize: '0.85rem !important' }} />}
            >
              Start
            </Button>
            <Button
              variant="outlined"
              color="warning"
              size="small"
              onClick={handleOpenChangeHost}
              disabled={activePlayers.length < 2}
              sx={{ minWidth: 0, px: 1, py: 1, fontSize: '0.7rem', lineHeight: 1.2, borderRadius: '8px', '& .MuiButton-startIcon': { mr: '4px' } }}
              startIcon={<StarIcon sx={{ fontSize: '0.85rem !important' }} />}
            >
              Host
            </Button>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={() => setEndGameConfirmOpen(true)}
              sx={{ minWidth: 0, px: 1, py: 1, fontSize: '0.7rem', lineHeight: 1.2, borderRadius: '8px', borderStyle: 'dashed', '& .MuiButton-startIcon': { mr: '4px' } }}
              startIcon={<FlagIcon sx={{ fontSize: '0.85rem !important' }} />}
            >
              End
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={() => setShowHistory(!showHistory)}
              sx={{ minWidth: 0, px: 1, py: 1, fontSize: '0.7rem', lineHeight: 1.2, borderRadius: '8px', color: 'text.secondary', '& .MuiButton-startIcon': { mr: 0 } }}
              startIcon={<HistoryIcon sx={{ fontSize: '0.85rem !important' }} />}
            >
            </Button>
          </>
        )}
      </Box>

      <Box sx={{ width: '100%' }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid xs={6} sm={3}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Ván chơi</Typography>
              <Typography variant="h6" fontWeight={700}>{roundHistory.length}</Typography>
            </Paper>
          </Grid>
          <Grid xs={6} sm={3}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Người chơi</Typography>
              <Typography variant="h6" fontWeight={700}>{activePlayers.length}</Typography>
            </Paper>
          </Grid>
          <Grid xs={6} sm={3}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Host hiện tại</Typography>
              <Typography variant="h6" fontWeight={700} noWrap sx={{ fontSize: '0.9rem', pt: 0.5 }}>
                {currentHostName || 'Chưa chọn'}
              </Typography>
            </Paper>
          </Grid>
          <Grid xs={6} sm={3}>
            <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Mỗi điểm</Typography>
              <Typography variant="h6" fontWeight={700}>{parseInt(currentGame?.money_per_point || 0).toLocaleString('vi-VN')}đ</Typography>
            </Paper>
          </Grid>
        </Grid>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: '0.875rem' }}>
          {new Date(currentGame.game_date).toLocaleDateString('vi-VN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
        </Typography>
      </Box>

      {/* Active Round Banner */}
      {activeRound && (
        <Paper
          sx={{
            p: 2,
            mb: 3,
            mx: { xs: -1.5, sm: 0 },
            borderRadius: { xs: 0, sm: 2 },
            background: 'linear-gradient(135deg, rgba(124, 77, 255, 0.12), rgba(0, 229, 255, 0.08))',
            border: '1px solid rgba(124, 77, 255, 0.3)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PlayArrowIcon color="primary" fontSize="small" />
              <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Ván {activeRound.round_number}
              </Typography>
              <Chip
                icon={<StarIcon sx={{ fontSize: '0.9rem !important' }} />}
                label={`Host: ${activeRound.host_name}`}
                size="small"
                sx={{ bgcolor: 'rgba(255, 171, 64, 0.15)', color: '#ffab40', height: 24, fontSize: '0.75rem' }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-end', sm: 'flex-start' }, flexWrap: 'wrap' }}>
              <Tooltip
                title={!allNonHostSubmitted ? 'Một số người chơi chưa chọn — nhấn để kết thúc sớm' : 'Tất cả đã chọn xong!'}
                placement="top"
              >
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<StopIcon />}
                  onClick={handleEndRoundClick}
                  sx={{
                    ...(allNonHostSubmitted && {
                      animation: 'heartbeat 1.5s ease-in-out infinite',
                      outline: '2px solid',
                      outlineColor: 'success.main',
                      outlineOffset: '2px',
                    }),
                  }}
                >
                  Kết thúc ván
                </Button>
              </Tooltip>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<CancelIcon />}
                onClick={() => setCancelConfirmOpen(true)}
              >
                Huỷ ván
              </Button>
              <Button
                variant="outlined"
                color="warning"
                size="small"
                startIcon={<StarIcon />}
                onClick={handleOpenChangeHostDuringRound}
              >
                Đổi Host
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<FlagIcon />}
                onClick={() => setEndGameConfirmOpen(true)}
                sx={{ borderStyle: 'dashed' }}
              >
                Kết thúc
              </Button>
            </Box>
          </Box>
          {!allNonHostSubmitted && (
            <Alert severity="info" sx={{ mt: 1.5, bgcolor: 'rgba(124, 77, 255, 0.08)' }}>
              Chờ tất cả người chơi chọn kết quả ({roundResults.length}/{nonHostPlayers.length} đã chọn)
            </Alert>
          )}
        </Paper>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<PersonAddIcon />}
          onClick={() => setAddPlayerOpen(true)}
          sx={{ flex: { xs: '1 1 auto', sm: 'initial' } }}
        >
          Người chơi
        </Button>
        {!activeRound && (
          <>
            <Button
              variant="contained"
              size="small"
              startIcon={<PlayArrowIcon />}
              onClick={handleStartRoundClick}
              disabled={activePlayers.length < 2}
              sx={{ flex: { xs: '1 1 100%', sm: 'initial' } }}
            >
              Ván mới {currentHostName ? `(${currentHostName})` : ''}
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="warning"
              startIcon={<StarIcon />}
              onClick={handleOpenChangeHost}
              disabled={activePlayers.length < 2}
              sx={{ flex: { xs: '1 1 auto', sm: 'initial' } }}
            >
              Đổi Host
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<FlagIcon />}
              onClick={() => setEndGameConfirmOpen(true)}
              sx={{ flex: { xs: '1 1 auto', sm: 'initial' } }}
            >
              Kết thúc
            </Button>
          </>
        )}
        <Button
          variant="text"
          size="small"
          startIcon={<HistoryIcon />}
          onClick={() => setShowHistory(!showHistory)}
          sx={{ flex: { xs: '1 1 auto', sm: 'initial' } }}
        >
          {showHistory ? 'Ẩn lịch sử' : 'Lịch sử'}
        </Button>
      </Box>

      {activePlayers.length < 2 && !activeRound && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Cần tối thiểu 2 người chơi đang hoạt động để bắt đầu ván. Hiện có {activePlayers.length} người.
        </Alert>
      )}

      {/* Players Grid */}
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        Người chơi ({players.length})
      </Typography>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          sm: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(3, minmax(0, 1fr))',
          lg: 'repeat(4, minmax(0, 1fr))'
        },
        gap: { xs: 1, sm: 2 },
        mb: 4,
        alignItems: 'stretch'
      }}>
        {players
          .filter(p => p.is_active !== 0) // Chỉ hiện người đang chơi khi xem chính
          .map((player) => {
            // Tính số ván đã chơi cho mỗi người chơi
            const roundsPlayed = roundHistory.filter(r =>
              r.status === 'completed' &&
              (r.host_player_id === player.id || (r.results && r.results.some(res => res.player_id === player.id)))
            ).length;

            const isThisHost = activeRound ? player.id === hostId : player.id === currentHostId;
            return (
              <PlayerCard
                key={player.id}
                player={player}
                isHost={isThisHost}
                roundActive={!!activeRound}
                currentResult={getPlayerResult(player.id)}
                onSelectResult={handleSelectResult}
                moneyPerPoint={currentGame.money_per_point}
                roundsPlayed={roundsPlayed}
                onRemove={handleRemovePlayerClick}
                onRestore={handleRestorePlayer}
                onHostBigWin={isThisHost ? () => setBigWinDialogOpen(true) : undefined}
                onShowHistory={handleShowHistory}
                hasPay={hasPay}
              />
            );
          })}
      </Box>

      {/* Inactive Players Section (if any) */}
      {players.some(p => p.is_active === 0) && (
        <Box sx={{ mb: 4, opacity: 0.8 }}>
          <Typography variant="subtitle1" fontWeight={600} color="text.secondary" sx={{ mb: 2 }}>
            Đã rời đi ({players.filter(p => p.is_active === 0).length})
          </Typography>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              sm: 'repeat(2, minmax(0, 1fr))',
              md: 'repeat(4, minmax(0, 1fr))'
            },
            gap: { xs: 1, sm: 1.5 }
          }}>
            {players
              .filter(p => p.is_active === 0)
              .map((player) => {
                const roundsPlayed = roundHistory.filter(r =>
                  r.status === 'completed' &&
                  (r.host_player_id === player.id || (r.results && r.results.some(res => res.player_id === player.id)))
                ).length;

                return (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    isHost={false}
                    roundActive={false}
                    currentResult={null}
                    onSelectResult={() => { }}
                    moneyPerPoint={currentGame.money_per_point}
                    roundsPlayed={roundsPlayed}
                    onRemove={() => { }}
                    onRestore={handleRestorePlayer}
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

      {/* Dialogs */}
      <AddPlayerDialog
        open={addPlayerOpen}
        onClose={() => setAddPlayerOpen(false)}
        gameId={parseInt(id)}
      />
      <SelectHostDialog
        open={selectHostOpen}
        onClose={() => setSelectHostOpen(false)}
        players={
          selectHostMode === 'change_active'
            ? players.filter(p => p.id !== hostId)
            : selectHostMode === 'change'
              ? players.filter(p => p.id !== currentHostId)
              : players
        }
        onSelectHost={handleHostSelected}
        currentHostId={selectHostMode === 'start' ? currentHostId : null}
        disableRestoreFocus
      />
      <ConfirmDialog
        open={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        onConfirm={handleCancelRound}
        title="Huỷ ván chơi"
        message="Bạn có chắc muốn huỷ ván này? Điểm của ván này sẽ không được tính."
      />
      <ConfirmDialog
        open={endRoundConfirmOpen}
        onClose={() => setEndRoundConfirmOpen(false)}
        onConfirm={handleEndRoundWithDefaults}
        title="Kết thúc ván sớm"
        message={`Có ${nonHostPlayers.filter(p => !roundResults.some(r => r.player_id === p.id)).length} người chơi chưa chọn kết quả. Nếu tiếp tục, họ sẽ bị mặc định là “Thua”. Bạn có muốn tiếp tục?`}
        confirmText="Kết thúc ván"
        color="warning"
      />
      <ConfirmDialog
        open={endGameConfirmOpen}
        onClose={() => setEndGameConfirmOpen(false)}
        onConfirm={handleEndGame}
        title="Kết thúc cuộc chơi"
        message={activeRound
          ? 'Ván đang chơi sẽ bị XOÁ (không tính điểm). Bạn có chắc muốn kết thúc toàn bộ cuộc chơi?'
          : 'Bạn có chắc muốn kết thúc cuộc chơi? Kết quả sẽ được tổng hợp và không thể tiếp tục chơi.'}
        confirmText="Kết thúc"
        color="warning"
      />
      <ConfirmDialog
        open={removeConfirmOpen}
        onClose={() => setRemoveConfirmOpen(false)}
        onConfirm={handleConfirmRemove}
        title="Loại người chơi"
        message="Bạn có chắc muốn loại người chơi này khỏi cuộc chơi?"
        confirmText="Xác nhận"
        color="error"
      />
      <BigWinDialog
        open={bigWinDialogOpen}
        onClose={() => setBigWinDialogOpen(false)}
        onConfirm={handleHostBigWin}
        eligiblePlayers={nonHostPlayers.filter(p => !roundResults.some(r => r.player_id === p.id))}
      />
      <PlayerHistoryDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        player={historyPlayer}
        rounds={roundHistory}
      />
    </Container>
  );
}
