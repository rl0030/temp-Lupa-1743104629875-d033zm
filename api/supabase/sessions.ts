import { supabase } from '../../services/supabase';
import { ScheduledMeeting, UserScheduledEvent } from '../../types/user';

export const getUserScheduledEvents = async (
  userUid: string,
): Promise<UserScheduledEvent[]> => {
  try {
    const { data, error } = await supabase
      .from('user_scheduled_events')
      .select('*')
      .eq('user_uid', userUid);

    if (error) {
      throw error;
    }

    return data as UserScheduledEvent[];
  } catch (error) {
    console.error('Error getting user scheduled events:', error);
    throw error;
  }
};

export const getScheduledMeetingById = async (scheduledMeetingUid: string) => {
  try {
    const { data, error } = await supabase
      .from('scheduled_sessions')
      .select('*')
      .eq('uid', scheduledMeetingUid)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching scheduled meeting:', error);
    return null;
  }
};

export const getTrainerAvailability = async (
  trainerUid: string,
  includeBookedSessions: boolean,
) => {
  try {
    let query = supabase
      .from('trainer_availability')
      .select('*')
      .eq('trainer_uid', trainerUid);

    if (!includeBookedSessions) {
      query = query.eq('is_booked', false);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting trainer availability:', error);
    throw error;
  }
};

export const updateTrainerAvailability = async (
  trainerUid: string,
  newSlots: any[],
) => {
  try {
    // Insert all new slots in a single operation
    const { error } = await supabase
      .from('trainer_availability')
      .insert(
        newSlots.map(slot => ({
          ...slot,
          trainer_uid: trainerUid,
        }))
      );

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating trainer availability:', error);
    throw error;
  }
};

export const getClientPurchasedPackages = async (clientId: string) => {
  try {
    const { data, error } = await supabase
      .from('purchased_packages')
      .select('*')
      .eq('client', clientId);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting client purchased packages:', error);
    throw error;
  }
};

export const createPackage = async (packageData: any) => {
  try {
    const { data, error } = await supabase
      .from('packages')
      .insert({
        ...packageData,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error creating package:', error);
    throw error;
  }
};

export const getSessionPackage = async (packageUid: string) => {
  try {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('uid', packageUid)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting session package:', error);
    throw error;
  }
};

export const getTrainerPackages = async (trainerUid: string) => {
  try {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('trainer_uid', trainerUid);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting trainer packages:', error);
    throw error;
  }
};