import React, { useEffect, useState } from 'react';
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
import { startRound, submitResult, endRound, cancelRound, fetchRounds } from '../store/roundsSlice';
import { endGame, removePlayer, addPlayer } from '../store/gamesSlice';
import PlayerCard from '../components/PlayerCard';
import AddPlayerDialog from '../components/AddPlayerDialog';
import SelectHostDialog from '../components/SelectHostDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import RoundHistory from '../components/RoundHistory';
import BigWinDialog from '../components/BigWinDialog';
import PlayerHistoryDialog from '../components/PlayerHistoryDialog';
import LoadingScreen from '../components/LoadingScreen';

export default function GamePage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentGame, loading } = useSelector((state) => state.games);
  const { activeRound, roundHistory } = useSelector((state) => state.rounds);

  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [selectHostOpen, setSelectHostOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [endGameConfirmOpen, setEndGameConfirmOpen] = useState(false);
  const [manualHostId, setManualHostId] = useState(null);
  const [selectHostMode, setSelectHostMode] = useState('start'); // 'start' or 'change'
  const [showHistory, setShowHistory] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [playerToRemove, setPlayerToRemove] = useState(null);
  const [bigWinDialogOpen, setBigWinDialogOpen] = useState(false);
  const [historyPlayer, setHistoryPlayer] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchGame(id));
    dispatch(fetchRounds(id));
    
    return () => {
      dispatch({ type: 'games/clearCurrentGame' });
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

  const handleHostSelected = (selectedId) => {
    if (selectHostMode === 'start') {
      handleStartRound(selectedId);
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

  const handleEndRound = async () => {
    if (!activeRound) return;
    try {
      const result = await dispatch(endRound(activeRound.id)).unwrap();
      toast.success(`Ván ${activeRound.round_number} đã kết thúc!`);
      // Refresh game data to get updated points
      dispatch(fetchGame(id));
      dispatch(fetchRounds(id));
    } catch (err) {
      toast.error(err.error || 'Lỗi kết thúc ván');
    }
  };

  const handleCancelRound = async () => {
    if (!activeRound) return;
    try {
      await dispatch(cancelRound(activeRound.id)).unwrap();
      toast.info('Ván đã bị huỷ');
      dispatch(fetchGame(id));
      dispatch(fetchRounds(id));
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
        navigate(`/result/${id}`);
      }
    } catch (err) {
      toast.error(err.error || 'Lỗi kết thúc cuộc chơi');
    }
    setEndGameConfirmOpen(false);
  };

  const handleRemovePlayerClick = (playerId) => {
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

  if (loading || !isCorrectGameLoaded) {
    return <LoadingScreen />;
  }

  if (!currentGame) {
    return (
      <Container sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="error">Cuộc chơi không tồn tại</Typography>
        <Button onClick={() => navigate('/')} startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
          Về trang chủ
        </Button>
      </Container>
    );
  }

  if (currentGame && String(currentGame.id) === String(id) && currentGame.status === 'completed') {
    return null;
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 0, sm: 3 } }}>
      {/* Header (Sticky) */}
      <Box sx={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 1100, 
        bgcolor: 'background.default',
        py: { xs: 1.5, sm: 2 },
        px: { xs: 2, sm: 0 },
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

      <Box sx={{ px: { xs: 2, sm: 0 } }}>
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
            <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
              <Tooltip title={!allNonHostSubmitted ? 'Tất cả người chơi phải chọn kết quả' : ''}>
                <span>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<StopIcon />}
                    onClick={handleEndRound}
                    disabled={!allNonHostSubmitted}
                  >
                    Kết thúc ván
                  </Button>
                </span>
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
          xs: 'repeat(2, 1fr)', 
          sm: 'repeat(2, 1fr)', 
          md: 'repeat(3, 1fr)', 
          lg: 'repeat(4, 1fr)' 
        }, 
        gap: { xs: 1.5, sm: 2 }, 
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
              xs: 'repeat(2, 1fr)', 
              sm: 'repeat(2, 1fr)', 
              md: 'repeat(4, 1fr)' 
            }, 
            gap: 1.5 
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
                    onSelectResult={() => {}}
                    moneyPerPoint={currentGame.money_per_point}
                    roundsPlayed={roundsPlayed}
                    onRemove={() => {}}
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
          <RoundHistory rounds={roundHistory} onPlayerClick={(id, name) => handleShowHistory({id, name})} />
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
        players={players}
        onSelectHost={handleHostSelected}
        currentHostId={currentHostId}
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
        open={endGameConfirmOpen}
        onClose={() => setEndGameConfirmOpen(false)}
        onConfirm={handleEndGame}
        title="Kết thúc cuộc chơi"
        message="Bạn có chắc muốn kết thúc cuộc chơi? Kết quả sẽ được tổng hợp và không thể tiếp tục chơi."
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
