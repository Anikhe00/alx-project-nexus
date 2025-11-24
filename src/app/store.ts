import { configureStore } from "@reduxjs/toolkit";
import pollsReducer from "../features/polls/pollsSlice";
import votesReducer from "../features/votes/votesSlice";
import analyticsReducer from "../features/analytics/analyticsSlice";
import authReducer from "../features/auth/authSlice"; // <-- add this

export const store = configureStore({
  reducer: {
    polls: pollsReducer,
    votes: votesReducer,
    analytics: analyticsReducer,
    auth: authReducer,
  },
});

// Types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
