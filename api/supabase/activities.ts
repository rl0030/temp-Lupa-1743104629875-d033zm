import { supabase } from '../../services/supabase';
import { Daily } from '../../types/activities/dailies';
import { Bootcamp } from '../../types/activities/bootcamps';
import { Seminar } from '../../types/activities/seminars';

// Dailies
export const createDaily = async (daily: Daily): Promise<string> => {
  try {
    if (daily.items.length > 3) {
      throw new Error('A daily can have a maximum of 3 exercises');
    }

    const now = new Date();
    const { data, error } = await supabase
      .from('dailies')
      .insert({
        ...daily,
        date: now,
        date_utc: now.toUTCString(),
        date_only: now.toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data.id;
  } catch (error) {
    console.error('Error creating daily:', error);
    throw error;
  }
};

export const getTrainerDailies = async (
  trainerUid: string,
): Promise<Daily[]> => {
  try {
    const { data, error } = await supabase
      .from('dailies')
      .select('*')
      .eq('trainer_uid', trainerUid);

    if (error) {
      throw error;
    }

    return data as Daily[];
  } catch (error) {
    console.error('Error getting trainer dailies:', error);
    throw error;
  }
};

// Bootcamps
export const createBootcamp = async (bootcampData: Omit<Bootcamp, 'id'>): Promise<Bootcamp> => {
  try {
    const { data, error } = await supabase
      .from('bootcamps')
      .insert(bootcampData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Create trainer event
    await supabase
      .from('user_scheduled_events')
      .insert({
        date: bootcampData.date,
        start_time: bootcampData.start_time,
        end_time: bootcampData.end_time,
        uid: data.id,
        user_uid: bootcampData.trainer_uid,
        type: 'Bootcamp',
        event_uid: data.id,
        package_uid: null,
      });

    return data as Bootcamp;
  } catch (error) {
    console.error('Error creating bootcamp:', error);
    throw error;
  }
};

export const getBootcamp = async (uid: string): Promise<Bootcamp | null> => {
  try {
    const { data, error } = await supabase
      .from('bootcamps')
      .select('*')
      .eq('uid', uid)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data as Bootcamp;
  } catch (error) {
    console.error('Error getting bootcamp:', error);
    throw error;
  }
};

// Seminars
export const createSeminar = async (seminarData: Omit<Seminar, 'id'>): Promise<Seminar> => {
  try {
    const { data, error } = await supabase
      .from('seminars')
      .insert(seminarData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Create trainer event
    await supabase
      .from('user_scheduled_events')
      .insert({
        date: seminarData.date,
        start_time: seminarData.start_time,
        end_time: seminarData.end_time,
        uid: data.id,
        user_uid: seminarData.trainer_uid,
        type: 'Seminar',
        event_uid: data.id,
        package_uid: null,
      });

    return data as Seminar;
  } catch (error) {
    console.error('Error creating seminar:', error);
    throw error;
  }
};

export const getSeminar = async (uid: string): Promise<Seminar | null> => {
  try {
    const { data, error } = await supabase
      .from('seminars')
      .select('*')
      .eq('uid', uid)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data as Seminar;
  } catch (error) {
    console.error('Error getting seminar:', error);
    throw error;
  }
};