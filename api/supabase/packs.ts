import { supabase } from '../../services/supabase';
import { Pack, PackScheduledEvent } from '../../types/user';
import { NotificationType } from '../../types/notifications';

export const getPacks = async (
  uids: Array<string>,
): Promise<Array<Pack>> => {
  try {
    if (uids.length === 0) {
      return [];
    }

    const { data, error } = await supabase
      .from('packs')
      .select('*')
      .in('uid', uids);

    if (error) {
      throw error;
    }

    return data as Array<Pack>;
  } catch (error) {
    console.error("Error in getPacks:", error);
    throw error;
  }
};

export const getPackScheduledEvents = async (
  packId: string,
): Promise<PackScheduledEvent[]> => {
  try {
    if (!packId) {
      throw new Error("Invalid input: packId is required");
    }

    const { data, error } = await supabase
      .from('pack_scheduled_events')
      .select('*')
      .eq('pack_uid', packId);

    if (error) {
      throw error;
    }

    return data as PackScheduledEvent[];
  } catch (error) {
    console.error("Error in getPackScheduledEvents:", error);
    throw error;
  }
};

export const getAllPacks = async () => {
  try {
    const { data, error } = await supabase
      .from('packs')
      .select('*');

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in getAllPacks:", error);
    throw error;
  }
};

export const createPack = async (pack: Pack) => {
  try {
    if (!pack) {
      throw new Error("Invalid input: pack object is required");
    }

    const { data, error } = await supabase
      .from('packs')
      .insert({
        ...pack,
        created_at: new Date(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in createPack:", error);
    throw error;
  }
};

export const getUserPacks = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("No authenticated user found");
    }

    const { data, error } = await supabase
      .from('packs')
      .select('*')
      .or(`members.cs.{${user.id}},owner.eq.${user.id}`);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in getUserPacks:", error);
    throw error;
  }
};

export const getPack = async (uid: string): Promise<Pack | null> => {
  try {
    if (!uid) {
      throw new Error("Invalid input: packUid is required");
    }

    const { data, error } = await supabase
      .from('packs')
      .select('*')
      .eq('uid', uid)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data as Pack;
  } catch (error) {
    console.error("Error in getPack:", error);
    throw error;
  }
};

export const acceptPackInvitation = async ({packId}: {packId: string}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("No authenticated user found");
    }
    
    // Start a transaction using RPC
    const { data, error } = await supabase.rpc('accept_pack_invitation', {
      p_pack_id: packId,
      p_user_id: user.id
    });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error in acceptPackInvitation:", error);
    throw error;
  }
};

export const declinePackInvitation = async ({packId}: {packId: string}) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("No authenticated user found");
    }
    
    const { data: pack, error: packError } = await supabase
      .from('packs')
      .select('pending_invites')
      .eq('id', packId)
      .single();
      
    if (packError) {
      throw packError;
    }
    
    const pendingInvites = pack.pending_invites.filter((uid: string) => uid !== user.id);
    
    const { error } = await supabase
      .from('packs')
      .update({ pending_invites: pendingInvites })
      .eq('id', packId);
      
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error("Error in declinePackInvitation:", error);
    throw error;
  }
};