import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axios';

export const startRound = createAsyncThunk('rounds/startRound', async ({ gameId, hostPlayerId }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/games/${gameId}/rounds`, { host_player_id: hostPlayerId });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Lỗi bắt đầu ván' });
  }
});

export const submitResult = createAsyncThunk('rounds/submitResult', async ({ roundId, playerId, result }, { rejectWithValue }) => {
  try {
    const res = await api.put(`/rounds/${roundId}/result`, { player_id: playerId, result });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data || { error: 'Lỗi ghi nhận kết quả' });
  }
});

export const endRound = createAsyncThunk('rounds/endRound', async (roundId, { rejectWithValue }) => {
  try {
    const res = await api.put(`/rounds/${roundId}/end`);
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
  },
  reducers: {
    clearActiveRound: (state) => {
      state.activeRound = null;
    },
    clearRoundError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // startRound
      .addCase(startRound.fulfilled, (state, action) => {
        state.activeRound = action.payload;
      })
      // submitResult
      .addCase(submitResult.fulfilled, (state, action) => {
        if (state.activeRound) {
          state.activeRound.results = action.payload.results;
        }
      })
      // endRound
      .addCase(endRound.fulfilled, (state, action) => {
        state.activeRound = null;
        // The round is now completed
      })
      // cancelRound
      .addCase(cancelRound.fulfilled, (state) => {
        state.activeRound = null;
      })
      // fetchRounds
      .addCase(fetchRounds.fulfilled, (state, action) => {
        state.roundHistory = action.payload;
      });
  },
});

export const { clearActiveRound, clearRoundError } = roundsSlice.actions;
export default roundsSlice.reducer;
