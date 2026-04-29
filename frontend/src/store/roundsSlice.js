import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';
import socket from '../socket/socketClient';

export const startRound = createAsyncThunk('rounds/startRound', async ({ gameId, hostPlayerId }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/games/${gameId}/rounds`, { host_player_id: hostPlayerId });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Lỗi bắt đầu ván' });
  }
});

export const submitResult = createAsyncThunk('rounds/submitResult', async ({ roundId, playerId, result }, { rejectWithValue }) => {
  return new Promise((resolve, reject) => {
    socket.emit('submit_result', { round_id: roundId, player_id: playerId, result }, (response) => {
      if (response && response.error) {
        reject(rejectWithValue({ error: response.error }));
      } else if (response && response.success) {
        resolve(response);
      } else {
        reject(rejectWithValue({ error: 'Không nhận được phản hồi từ server' }));
      }
    });
  });
});

export const endRound = createAsyncThunk('rounds/endRound', async ({ roundId, defaultLosers = [] }, { rejectWithValue }) => {
  try {
    const body = defaultLosers.length > 0 ? { default_losers: defaultLosers } : {};
    const res = await api.put(`/rounds/${roundId}/end`, body);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Lỗi kết thúc ván' });
  }
});

export const cancelRound = createAsyncThunk('rounds/cancelRound', async (roundId, { rejectWithValue }) => {
  try {
    const res = await api.put(`/rounds/${roundId}/cancel`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Lỗi huỷ ván' });
  }
});

export const changeHost = createAsyncThunk('rounds/changeHost', async ({ roundId, newHostId }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/rounds/${roundId}/change-host`, { new_host_id: newHostId });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Lỗi đổi host' });
  }
});

export const fetchRounds = createAsyncThunk('rounds/fetchRounds', async (gameId) => {
  const res = await api.get(`/games/${gameId}/rounds`);
  return res.data;
});

const roundsSlice = createSlice({
  name: 'rounds',
  initialState: {
    activeRound: null,
    roundHistory: [],
    loading: false,
    error: null,
    isNewRoundStarted: false, // Cờ hiệu để kích hoạt overlay ván mới
  },
  reducers: {
    clearActiveRound: (state) => {
      state.activeRound = null;
    },
    clearRoundError: (state) => {
      state.error = null;
    },
    onRoundStarted: (state, action) => {
      state.activeRound = action.payload;
      state.isNewRoundStarted = true; // Chỉ kích hoạt khi có sự kiện round_started thực tế
    },
    onResultSubmitted: (state, action) => {
      if (state.activeRound) {
        state.activeRound.results = action.payload.results;
      }
    },
    onRoundEnded: (state, action) => {
      state.activeRound = null;
      const existsIndex = state.roundHistory.findIndex(r => r.id === action.payload.round.id);
      if (existsIndex === -1) {
        state.roundHistory.push(action.payload.round);
      } else {
        state.roundHistory[existsIndex] = action.payload.round;
      }
    },
    onRoundCancelled: (state, action) => {
      state.activeRound = null;
    },
    onHostChanged: (state, action) => {
      state.activeRound = action.payload;
    },
    clearNewRoundFlag: (state) => {
      state.isNewRoundStarted = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Socket-first: state updates for round mutations are handled by socket events
      // startRound    → onRoundStarted (socket 'round_started')
      // submitResult  → onResultSubmitted (socket 'result_submitted')
      // endRound      → onRoundEnded (socket 'round_ended')
      // cancelRound   → onRoundCancelled (socket 'round_cancelled')
      // changeHost    → onHostChanged (socket 'host_changed')
      // removePlayer  → onPlayerRemoved (socket 'player_removed') in gamesSlice

      // fetchRounds — used by GameResultPage (no socket connection there)
      .addCase(fetchRounds.fulfilled, (state, action) => {
        const rounds = action.payload;
        state.activeRound = rounds.find(r => r.status === 'active') || null;
        state.roundHistory = rounds.filter(r => r.status !== 'active');
      })
      // socket event: syncGameState (from gamesSlice)
      .addCase('games/syncGameState', (state, action) => {
        const data = action.payload;
        state.activeRound = data.active_round || null;
        state.roundHistory = data.round_history || [];
      });
  },
});

export const { 
  clearActiveRound, 
  clearRoundError,
  onRoundStarted,
  onResultSubmitted,
  onRoundEnded,
  onRoundCancelled,
  onHostChanged,
  clearNewRoundFlag
} = roundsSlice.actions;
export default roundsSlice.reducer;
