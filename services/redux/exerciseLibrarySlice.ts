import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { fetchExerciseLibraryFromAPI } from '../../api/exerciseLibrary'; // You'll need to implement this
import { getExerciseLibrary } from '../../api/program/program';
import { auth } from '../firebase';

// Define the state shape
interface ExerciseLibraryState {
  data: Record<string, Exercise[]> | null;
  loading: boolean;
  error: string | null;
}

interface Exercise {
  name: string;
  uid: string;
  category: string;
  // Add other exercise properties as needed
}

const initialState: ExerciseLibraryState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchExerciseLibrary = createAsyncThunk(
  'exerciseLibrary/fetchExerciseLibrary',
  async () => {
    const data = await getExerciseLibrary(auth?.currentUser?.uid);
    return data;
  }
);

export const exerciseLibrarySlice = createSlice({
  name: 'exerciseLibrary',
  initialState,
  reducers: {
    // You can add more reducers here if needed
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExerciseLibrary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExerciseLibrary.fulfilled, (state, action: PayloadAction<Record<string, Exercise[]>>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchExerciseLibrary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'An error occurred';
      });
  },
});

// Export reducer
export default exerciseLibrarySlice.reducer;