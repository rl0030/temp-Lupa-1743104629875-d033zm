import { supabase } from '../../services/supabase';

export const getUserNotifications = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("No authenticated user found");
    }
    
    const now = new Date();
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('receiver', user.id)
      .lte('scheduled_for', now.toISOString())
      .order('created_at', { ascending: false });
      
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

export const markNotificationsAsRead = async (notificationIds: string[]) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', notificationIds);
      
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw error;
  }
};

export const createNotification = async (notification: any) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        ...notification,
        created_at: new Date(),
      })
      .select()
      .single();
      
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const deleteNotification = async (notificationId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);
      
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};