import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LupaUser, TrainerMetadata, TrainingLocation } from '../../types/user';
import { PlaceResult } from '../../pages/Settings/UpdateHomeGym';
import { getUser } from '../../api/user';

// Define the state shape
interface UserState {
  userData: LupaUser | null;
  trainerMetadata: TrainerMetadata | null;
}

const initialState: UserState = {
  userData: null,
  trainerMetadata: null,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserData: (state, action: PayloadAction<LupaUser>) => {
      state.userData = action.payload;
    },
    setTrainerMetadata: (state, action: PayloadAction<TrainerMetadata>) => {
      state.trainerMetadata = action.payload;
    },
    updateUserField: (state, action: PayloadAction<{ field: keyof LupaUser; value: any }>) => {
      if (state.userData) {
        state.userData[action.payload.field] = action.payload.value;
      }
    },
    updateTrainerField: (state, action: PayloadAction<{ field: keyof TrainerMetadata; value: any }>) => {
      if (state.trainerMetadata) {
        state.trainerMetadata[action.payload.field] = action.payload.value;
      }
    },
    updateUserNestedField: (state, action: PayloadAction<{ path: string[]; value: any }>) => {
      if (state.userData) {
        let current: any = state.userData;
        for (let i = 0; i < action.payload.path.length - 1; i++) {
          current = current[action.payload.path[i]];
        }
        current[action.payload.path[action.payload.path.length - 1]] = action.payload.value;
      }
    },
    updateTrainerNestedField: (state, action: PayloadAction<{ path: string[]; value: any }>) => {
      if (state.trainerMetadata) {
        let current: any = state.trainerMetadata;
        for (let i = 0; i < action.payload.path.length - 1; i++) {
          current = current[action.payload.path[i]];
        }
        current[action.payload.path[action.payload.path.length - 1]] = action.payload.value;
      }
    },
    refreshUserState: (state, action: PayloadAction<LupaUser>) => {
      state.userData = action.payload;
    },
    refreshTrainerState: (state, action: PayloadAction<TrainerMetadata>) => {
      state.trainerMetadata = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(refreshUserData.pending, (state) => {
        // TODO: Set a loading state
      })
      .addCase(refreshUserData.fulfilled, (state, action) => {
        state.userData = action.payload;
      })
      .addCase(refreshUserData.rejected, (state, action) => {
        // TODO: Handle the error state
      });
  },
});

// Export actions
export const {
  setUserData,
  setTrainerMetadata,
  updateUserField,
  updateTrainerField,
  updateUserNestedField,
  updateTrainerNestedField,
  refreshUserState,
  refreshTrainerState,
} = userSlice.actions;

// Export reducer
export default userSlice.reducer;

// Utility functions for updating specific fields
export const updateUserBiography = (biography: string) => 
  updateUserField({ field: 'biography', value: biography });

export const updateUserInterests = (interests: string[]) => 
  updateUserField({ field: 'interest', value: interests });

export const updateUserTrainingLocations = (locations: TrainingLocation[]) => 
  updateUserField({ field: 'training_locations', value: locations });

export const updateUserLocation = (longitude: number, latitude: number) => 
  updateUserNestedField({ path: ['location'], value: { longitude, latitude } });

export const updateUserBlockedUids = (blockedUids: number) => 
  updateUserNestedField({ path: ['settings', 'blocked_uids'], value: blockedUids });

export const updateUserFavorites = (favorites: any[]) => 
  updateUserNestedField({ path: ['interactions', 'favorites'], value: favorites });

export const updateUserLanguagesSpoken = (languages: string[]) => 
  updateUserNestedField({ path: ['fitness_profile', 'languages_spoken'], value: languages });

export const updateUserMedicalConditions = (conditions: string[]) => 
  updateUserNestedField({ path: ['fitness_profile', 'medical_conditions'], value: conditions });

export const updateTrainerHourlyRate = (rate: number) => 
  updateTrainerField({ field: 'hourly_rate', value: rate });

export const updateTrainerHomeGym = (homeGym: PlaceResult) => 
  updateTrainerField({ field: 'home_gym', value: homeGym });

export const updateTrainerVerificationStatus = (isVerified: boolean) => 
  updateTrainerField({ field: 'is_verified', value: isVerified });

export const updateTrainerCheckStatus = (isChecked: boolean) => 
  updateTrainerField({ field: 'is_checked', value: isChecked });

// Thunk for refreshing both user and trainer data
export const refreshAllUserData = (userData: LupaUser, trainerMetadata: TrainerMetadata | null) => (dispatch: any) => {
  dispatch(refreshUserState(userData));
  if (trainerMetadata) {
    dispatch(refreshTrainerState(trainerMetadata));
  }
};

export const refreshUserData = createAsyncThunk(
  'user/refreshUserData',
  async (userId: string) => {
    const userData = await getUser(userId);
    return userData;
  }
);