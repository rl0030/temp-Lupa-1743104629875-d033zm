import { supabase } from '../../services/supabase';
import { Achievement, UserAchievementProgress } from '../../types/achievements';
import { ExerciseCategory } from '../../types/program';

export const incrementExerciseAchievementSet = async (userId: string, category: ExerciseCategory): Promise<void> => {
  try {
    // First, check if there's an entry for this user and category
    const { data, error } = await supabase
      .from('user_exercise_sets')
      .select('count')
      .eq('user_id', userId)
      .eq('exercise_category', category)
      .single();
      
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    if (data) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('user_exercise_sets')
        .update({ 
          count: data.count + 1,
          updated_at: new Date()
        })
        .eq('user_id', userId)
        .eq('exercise_category', category);
        
      if (updateError) {
        throw updateError;
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('user_exercise_sets')
        .insert({
          user_id: userId,
          exercise_category: category,
          count: 1
        });
        
      if (insertError) {
        throw insertError;
      }
    }
    
    // Now check if this increment should trigger a new achievement
    await checkAndCreateAchievement(userId, category);
    
  } catch (error) {
    console.error('Error incrementing exercise achievement set:', error);
    throw error;
  }
};

const checkAndCreateAchievement = async (userId: string, category: ExerciseCategory) => {
  // Get current progress
  const { data: progress } = await getUserAchievementProgress(userId, category);
  
  // If user has reached the next tier threshold
  if (progress && progress.setsToNextTier <= 0) {
    // Create a new achievement
    const { error } = await supabase
      .from('achievements')
      .insert({
        uid: `${userId}_${category}_${progress.nextTier}`,
        user_id: userId,
        exercise_category: category,
        tier: progress.nextTier,
        current_sets: progress.currentSets,
        achieved_at: new Date()
      });
      
    if (error) {
      console.error('Error creating achievement:', error);
    }
    
    // Update the user's progress
    await updateUserProgress(userId, category);
  }
};

const updateUserProgress = async (userId: string, category: ExerciseCategory) => {
  // This would calculate the new current tier, next tier, and sets to next tier
  // based on the user's current exercise count and achievement requirements
  const { data: userSets } = await supabase
    .from('user_exercise_sets')
    .select('count')
    .eq('user_id', userId)
    .eq('exercise_category', category)
    .single();
    
  if (!userSets) return;
  
  // Get the highest tier achievement for this category
  const { data: achievements } = await supabase
    .from('achievements')
    .select('tier')
    .eq('user_id', userId)
    .eq('exercise_category', category)
    .order('tier', { ascending: false })
    .limit(1);
    
  const currentTier = achievements && achievements.length > 0 ? achievements[0].tier : 0;
  const nextTier = currentTier + 1;
  
  // Get the requirements for the next tier
  // This would normally come from a requirements table or constant
  // For simplicity, let's assume the next tier requires currentTier * 25 sets
  const setsForNextTier = nextTier * 25;
  const setsToNextTier = setsForNextTier - userSets.count;
  
  // Update or insert the progress
  const { error } = await supabase
    .from('user_achievement_progress')
    .upsert({
      user_id: userId,
      exercise_category: category,
      current_tier: currentTier,
      current_sets: userSets.count,
      next_tier: nextTier,
      sets_to_next_tier: Math.max(0, setsToNextTier),
      updated_at: new Date()
    });
    
  if (error) {
    console.error('Error updating user progress:', error);
  }
};

export const getAchievements = async (
  userId: string,
  category?: ExerciseCategory | null,
  limit: number = 10,
  lastAchievementId?: string
): Promise<Achievement[]> => {
  try {
    let query = supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('achieved_at', { ascending: false })
      .limit(limit);
      
    if (category) {
      query = query.eq('exercise_category', category);
    }
    
    if (lastAchievementId) {
      // Get the achieved_at value for the last achievement
      const { data: lastAchievement } = await supabase
        .from('achievements')
        .select('achieved_at')
        .eq('uid', lastAchievementId)
        .single();
        
      if (lastAchievement) {
        query = query.lt('achieved_at', lastAchievement.achieved_at);
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data as Achievement[];
  } catch (error) {
    console.error('Error getting achievements:', error);
    throw error;
  }
};

export const getUserAchievementProgress = async (
  userId: string,
  category: ExerciseCategory
): Promise<UserAchievementProgress> => {
  try {
    const { data, error } = await supabase
      .from('user_achievement_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('exercise_category', category)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        // No progress record found, create a default one
        const { data: userSets } = await supabase
          .from('user_exercise_sets')
          .select('count')
          .eq('user_id', userId)
          .eq('exercise_category', category)
          .single();
          
        const count = userSets?.count || 0;
        const nextTier = 1; // Bronze
        const setsForNextTier = 5; // First tier requirement
        
        const progress: UserAchievementProgress = {
          userId,
          exerciseCategory: category,
          currentTier: 0,
          currentSets: count,
          nextTier,
          setsToNextTier: Math.max(0, setsForNextTier - count)
        };
        
        // Insert the default progress
        await supabase
          .from('user_achievement_progress')
          .insert({
            user_id: userId,
            exercise_category: category,
            current_tier: 0,
            current_sets: count,
            next_tier: nextTier,
            sets_to_next_tier: Math.max(0, setsForNextTier - count)
          });
          
        return progress;
      }
      throw error;
    }
    
    return {
      userId: data.user_id,
      exerciseCategory: data.exercise_category,
      currentTier: data.current_tier,
      currentSets: data.current_sets,
      nextTier: data.next_tier,
      setsToNextTier: data.sets_to_next_tier
    };
  } catch (error) {
    console.error('Error getting user achievement progress:', error);
    throw error;
  }
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