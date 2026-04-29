import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';
import { onRoundEnded } from './roundsSlice';

// Async thunks
export const fetchGames = createAsyncThunk('games/fetchGames', async (status) => {
  const params = status ? { status } : {};
  const res = await api.get('/games', { params });
  return res.data;
});

export const fetchGame = createAsyncThunk('games/fetchGame', async (gameId) => {
  const res = await api.get(`/games/${gameId}`);
  return res.data;
});

export const createGame = createAsyncThunk('games/createGame', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/games', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Lỗi tạo cuộc chơi' });
  }
});

export const endGame = createAsyncThunk('games/endGame', async (gameId, { rejectWithValue }) => {
  try {
    const res = await api.put(`/games/${gameId}/end`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Lỗi kết thúc cuộc chơi' });
  }
});

export const fetchStatistics = createAsyncThunk('games/fetchStatistics', async (gameId) => {
  const res = await api.get(`/games/${gameId}/statistics`);
  return res.data;
});

export const addPlayer = createAsyncThunk('games/addPlayer', async ({ gameId, name }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/games/${gameId}/players`, { name });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Lỗi thêm người chơi' });
  }
});

export const removePlayer = createAsyncThunk('games/removePlayer', async ({ gameId, playerId }, { rejectWithValue }) => {
  try {
    const res = await api.delete(`/games/${gameId}/players/${playerId}`);
    return { playerId, ...res.data };
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Lỗi xóa người chơi' });
  }
});

export const deleteGame = createAsyncThunk('games/deleteGame', async (gameId, { rejectWithValue }) => {
  try {
    const res = await api.delete(`/games/${gameId}`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Lỗi xoá cuộc chơi' });
  }
});

const gamesSlice = createSlice({
  name: 'games',
  initialState: {
    list: [],
    currentGame: null,
    statistics: null,
    loading: false,
    error: null,
    filters: {
      search: '',
      tab: 0,
      sortOrder: 'desc'
    }
  },
  reducers: {
    clearCurrentGame: (state) => {
      state.currentGame = null;
    },
    clearStatistics: (state) => {
      state.statistics = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    syncGameState: (state, action) => {
      // Nhận data full từ server (game, players, active_round, roundHistory)
      const data = action.payload;
      const allRounds = [...data.round_history];
      if (data.active_round) {
        allRounds.push(data.active_round);
      }
      
      state.currentGame = {
        ...data.game,
        players: data.players,
        rounds: allRounds,
      };
      state.loading = false;
      state.error = null;
    },
    onPlayerAdded: (state, action) => {
      if (state.currentGame) {
        const existingIndex = state.currentGame.players.findIndex(p => p.id === action.payload.id);
        if (existingIndex !== -1) {
          state.currentGame.players[existingIndex] = action.payload;
        } else {
          state.currentGame.players.push(action.payload);
        }
      }
    },
    onPlayerRemoved: (state, action) => {
      if (state.currentGame) {
        if (action.payload.deactivated) {
          const player = state.currentGame.players.find(p => p.id === action.payload.playerId);
          if (player) player.is_active = 0;
        } else {
          state.currentGame.players = state.currentGame.players.filter(p => p.id !== action.payload.playerId);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchGames
      .addCase(fetchGames.pending, (state) => { state.loading = true; })
      .addCase(fetchGames.fulfilled, (state, action) => {
        state.loading = false;
        state.list = Array.isArray(action.payload) ? action.payload : [];
        state.error = Array.isArray(action.payload) ? null : 'Dữ liệu nhận được không đúng định dạng';
      })
      .addCase(fetchGames.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // fetchGame
      .addCase(fetchGame.pending, (state) => { state.loading = true; })
      .addCase(fetchGame.fulfilled, (state, action) => {
        state.loading = false;
        state.currentGame = action.payload;
      })
      .addCase(fetchGame.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // createGame
      .addCase(createGame.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      // endGame
      .addCase(endGame.fulfilled, (state, action) => {
        state.statistics = action.payload;
        if (state.currentGame) {
          state.currentGame.status = 'completed';
        }
      })
      // fetchStatistics
      .addCase(fetchStatistics.pending, (state) => { state.loading = true; })
      .addCase(fetchStatistics.fulfilled, (state, action) => {
        state.loading = false;
        state.statistics = action.payload;
      })
      .addCase(fetchStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // addPlayer — state update via socket 'player_added' (onPlayerAdded)
      // removePlayer — state update via socket 'player_removed' (onPlayerRemoved)

      // deleteGame
      .addCase(deleteGame.fulfilled, (state, action) => {
        state.list = state.list.filter(g => g.id !== action.payload.game_id);
      })
      // socket event: onRoundEnded
      .addCase(onRoundEnded, (state, action) => {
        if (state.currentGame && action.payload.players) {
          state.currentGame.players = action.payload.players;
        }
      });
  },
});

export const { 
  clearCurrentGame, 
  clearStatistics, 
  clearError, 
  setFilters,
  syncGameState,
  onPlayerAdded,
  onPlayerRemoved
} = gamesSlice.actions;

export default gamesSlice.reducer;
