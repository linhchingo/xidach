import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import socket from '../socket/socketClient';
import { 
  syncGameState, 
  onPlayerAdded, 
  onPlayerRemoved 
} from '../store/gamesSlice';
import { 
  onRoundStarted, 
  onResultSubmitted, 
  onRoundEnded, 
  onRoundCancelled, 
  onHostChanged 
} from '../store/roundsSlice';

export default function useGameSocket(gameId, role = 'spectator') {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!gameId) return;

    // Connect và gửi auth info
    socket.auth = { game_id: gameId, role };
    socket.connect();

    const handleConnect = () => {
      console.log('[Socket.IO] Connected');
      socket.emit('join_game', { game_id: gameId, role });
    };

    const handleDisconnect = () => {
      console.log('[Socket.IO] Disconnected');
    };

    // Listen events
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    
    // Server gửi state hiện tại khi join phòng
    socket.on('game_state_sync', (data) => {
      dispatch(syncGameState(data));
    });

    // Game events
    socket.on('player_added', (player) => dispatch(onPlayerAdded(player)));
    socket.on('player_removed', (data) => dispatch(onPlayerRemoved(data)));
    socket.on('game_ended', (data) => {
      if (String(data.game_id) === String(gameId)) {
        navigate(data.redirect_url);
      }
    });

    // Round events
    socket.on('round_started', (round) => dispatch(onRoundStarted(round)));
    socket.on('result_submitted', (data) => dispatch(onResultSubmitted(data)));
    socket.on('round_ended', (data) => dispatch(onRoundEnded(data)));
    socket.on('round_cancelled', (data) => dispatch(onRoundCancelled(data)));
    socket.on('host_changed', (round) => dispatch(onHostChanged(round)));

    return () => {
      socket.emit('leave_game', { game_id: gameId });
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('game_state_sync');
      socket.off('player_added');
      socket.off('player_removed');
      socket.off('game_ended');
      socket.off('round_started');
      socket.off('result_submitted');
      socket.off('round_ended');
      socket.off('round_cancelled');
      socket.off('host_changed');
      socket.disconnect();
    };
  }, [gameId, role, dispatch, navigate]);

  return socket;
}
