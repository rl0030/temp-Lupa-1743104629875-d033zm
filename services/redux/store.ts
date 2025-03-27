import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import exerciseLibraryReducer from './exerciseLibrarySlice';

const store = configureStore({
  reducer: {
    user: userReducer,
    exerciseLibrary: exerciseLibraryReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;