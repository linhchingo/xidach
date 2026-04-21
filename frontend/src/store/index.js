import { configureStore } from '@reduxjs/toolkit';
import gamesReducer from './gamesSlice';
import roundsReducer from './roundsSlice';

const store = configureStore({
  reducer: {
    games: gamesReducer,
    rounds: roundsReducer,
  },
});

export default store;
