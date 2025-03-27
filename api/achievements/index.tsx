// api/achievements.ts


import { functionsInstance } from '../../services/firebase/functions';
import { httpsCallable } from 'firebase/functions';
import { ref, runTransaction } from 'firebase/database';
import { realtime_db } from '../../services/firebase/realtime_database';
import { Achievement, UserAchievementProgress } from '../../types/achievements';
import { ExerciseCategory } from '../../types/program';

export const incrementExerciseAchievementSet = async (userId: string, category: ExerciseCategory): Promise<void> => {
  const dbRef = ref(realtime_db, `/userExerciseSets/${userId}/${category}`)
  runTransaction(dbRef, (currentValue) => (currentValue || 0) + 1)
};

export const getAchievements = async (
  userId: string,
  category?: ExerciseCategory | null,
  limit: number = 10,
  lastAchievementId?: string
): Promise<Achievement[]> => {
  const getAchievementsFunc = httpsCallable(functionsInstance, 'getAchievements');
  
  const result = await getAchievementsFunc({ userId, category, limit, lastAchievementId });
  return result.data as Achievement[]
};

export const getUserAchievementProgress = async (
  userId: string,
  category: ExerciseCategory
): Promise<UserAchievementProgress> => {
  const getUserAchievementProgressFunc = httpsCallable(functionsInstance, 'getUserAchievementProgress');
  
  const result = await getUserAchievementProgressFunc({ userId, category });
  return result.data as UserAchievementProgress;
};

export const getRecentAchievements = async (userId: string, limit: number = 5): Promise<Achievement[]> => {
  return getAchievements(userId, undefined, limit);
};

export const getAchievementsByCategory = async (
  userId: string,
  category: ExerciseCategory,
  limit: number = 10
): Promise<Achievement[]> => {
  return getAchievements(userId, category, limit);
};

export const getCurrentTierForCategory = async (
  userId: string,
  category: ExerciseCategory
): Promise<UserAchievementProgress> => {
  return getUserAchievementProgress(userId, category);
};