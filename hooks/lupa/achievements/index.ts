// hooks/useAchievements.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAchievements, getUserAchievementProgress, getRecentAchievements, getAchievementsByCategory, getCurrentTierForCategory } from '../../../api/achievements';
import { Achievement, UserAchievementProgress } from '../../../types/achievements';
import { ExerciseCategory } from '../../../types/program';

// Types for hook parameters and return values
type IncrementExerciseSetParams = {
  userId: string;
  category: ExerciseCategory;
};

type GetAchievementsParams = {
  userId: string;
  category?: ExerciseCategory | null;
  limit?: number;
  lastAchievementId?: string;
};

type GetUserAchievementProgressParams = {
  userId: string;
  category: ExerciseCategory;
};

type GetRecentAchievementsParams = {
  userId: string;
  limit?: number;
};

type GetAchievementsByCategoryParams = {
  userId: string;
  category: ExerciseCategory;
  limit?: number;
};

// Hook for incrementing exercise set
export const useIncrementExerciseSet = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, IncrementExerciseSetParams>(
    ({ userId, category }) => incrementExerciseSet(userId, category),
    {
      onSuccess: (_: any, { userId, category }: any) => {
        queryClient.invalidateQueries(['userAchievementProgress', userId, category]);
        queryClient.invalidateQueries(['achievements', userId]);
      },
    }
  );
};

// Hook for getting achievements
export const useGetAchievements = ({ userId, category = null, limit = 10, lastAchievementId }: GetAchievementsParams) => {
  return useQuery<Achievement[], Error>({
    queryKey: ['achievements', userId, category, limit, lastAchievementId],
    queryFn: () => getAchievements(userId, category, limit, lastAchievementId),
});
};

// Hook for getting user achievement progress
export const useGetUserAchievementProgress = ({ userId, category }: GetUserAchievementProgressParams) => {
  return useQuery<UserAchievementProgress, Error>({
    queryKey: ['userAchievementProgress', userId, category],
    queryFn: () => getUserAchievementProgress(userId, category)
});
};

// Hook for getting recent achievements
export const useGetRecentAchievements = ({ userId, limit = 5 }: GetRecentAchievementsParams) => {
  return useQuery<Achievement[], Error>({
    queryKey: ['recentAchievements', userId, limit],
    queryFn: () => getRecentAchievements(userId, limit)
});
};

// Hook for getting achievements by category
export const useGetAchievementsByCategory = ({ userId, category, limit = 10 }: GetAchievementsByCategoryParams) => {
  return useQuery<Achievement[], Error>({
    queryKey: ['achievementsByCategory', userId, category, limit],
    queryFn: () => getAchievementsByCategory(userId, category, limit)
});
};

// Hook for getting current tier for category
export const useGetCurrentTierForCategory = ({ userId, category }: GetUserAchievementProgressParams) => {
  return useQuery<UserAchievementProgress, Error>({
    queryKey: ['currentTierForCategory', userId, category],
    queryFn: () => getCurrentTierForCategory(userId, category)
});
};