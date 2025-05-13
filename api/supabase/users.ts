import { supabase } from '../../services/supabase';
import { LupaUser, TrainerMetadata } from '../../types/user';
import { getCurrentUser } from '../../services/supabase/auth';

export const getUser = async (uid: string): Promise<LupaUser> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('uid', uid)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error(`Unable to find Lupa User: ${uid}`);
    }

    return data as LupaUser;
  } catch (error) {
    console.error('Error in getUser:', error);
    throw error;
  }
};

export const getUsers = async (uids: Array<String>): Promise<Array<LupaUser>> => {
  try {
    if (Array.isArray(uids) && uids.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .in('uid', uids);

    if (error) {
      throw error;
    }

    return data as Array<LupaUser>;
  } catch (error) {
    console.error('Error in getUsers:', error);
    throw error;
  }
};

export const listUsers = async (): Promise<Array<LupaUser>> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) {
      throw error;
    }

    return data as Array<LupaUser>;
  } catch (error) {
    console.error('Error in listUsers:', error);
    throw error;
  }
};

export const putUser = async (
  user: LupaUser,
  trainerMetadata?: TrainerMetadata | null,
): Promise<string | undefined> => {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('uid', user.uid)
      .single();

    // Insert or update user
    const { data, error } = await supabase
      .from('users')
      .upsert({
        ...user,
        id: existingUser?.id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // If user is a trainer and trainerMetadata is provided, insert or update trainer metadata
    if (user.role === 'trainer' && trainerMetadata) {
      const { error: trainerError } = await supabase
        .from('trainer_metadata')
        .upsert({
          ...trainerMetadata,
          user_uid: user.uid,
        });

      if (trainerError) {
        throw trainerError;
      }
    }

    return user.uid;
  } catch (error) {
    console.error('Error in putUser:', error);
    throw error;
  }
};

export const createUser = async (
  email: string,
  password: string,
): Promise<string | undefined> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return JSON.stringify(data.user);
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const checkOnboardingStatus = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('is_onboarding_completed')
      .eq('uid', userId)
      .single();

    if (error) {
      throw error;
    }

    return data?.is_onboarding_completed || false;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

export const blockUser = async (
  referenceUserId: string,
  targetUserId: string,
): Promise<void> => {
  try {
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('settings')
      .eq('uid', referenceUserId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const blockedUsers = userData?.settings?.blocked_uids || [];
    
    const { error: updateError } = await supabase
      .from('users')
      .update({
        settings: {
          ...userData.settings,
          blocked_uids: [...blockedUsers, targetUserId],
        },
      })
      .eq('uid', referenceUserId);

    if (updateError) {
      throw updateError;
    }
  } catch (error) {
    console.error('Error blocking user:', error);
    throw error;
  }
};

export const unblockUser = async (
  referenceUserId: string,
  targetUserId: string,
): Promise<void> => {
  try {
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('settings')
      .eq('uid', referenceUserId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const blockedUsers = userData?.settings?.blocked_uids || [];
    const updatedBlockedUsers = blockedUsers.filter(uid => uid !== targetUserId);
    
    const { error: updateError } = await supabase
      .from('users')
      .update({
        settings: {
          ...userData.settings,
          blocked_uids: updatedBlockedUsers,
        },
      })
      .eq('uid', referenceUserId);

    if (updateError) {
      throw updateError;
    }
  } catch (error) {
    console.error('Error unblocking user:', error);
    throw error;
  }
};

export const isUserBlocked = async (
  referenceUserId: string,
  targetUserId: string,
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('settings')
      .eq('uid', referenceUserId)
      .single();

    if (error) {
      throw error;
    }

    const blockedUsers = data?.settings?.blocked_uids || [];
    return blockedUsers.includes(targetUserId);
  } catch (error) {
    console.error('Error checking if user is blocked:', error);
    return false;
  }
};

export default async function updateUserLocation(
  payload: {
    uid: string;
    position: {longitude: number; latitude: number};
  }
) {
  const { uid, position } = payload;

  try {
    const { error } = await supabase
      .from('users')
      .update({
        location: {
          longitude: position.longitude,
          latitude: position.latitude,
          timezone: 'America/New_York',
        },
      })
      .eq('uid', uid);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating user location:', error);
    throw error;
  }
}