import { supabase } from './index';
import { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeSubscription = {
  channel: RealtimeChannel;
  unsubscribe: () => void;
};

export const subscribeToTable = (
  table: string,
  callback: (payload: any) => void,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*' = '*',
  filter?: string
): RealtimeSubscription => {
  let channel = supabase.channel(`public:${table}`);
  
  if (filter) {
    channel = channel.on(
      'postgres_changes',
      {
        event,
        schema: 'public',
        table,
        filter,
      },
      callback
    );
  } else {
    channel = channel.on(
      'postgres_changes',
      {
        event,
        schema: 'public',
        table,
      },
      callback
    );
  }
  
  channel.subscribe();
  
  return {
    channel,
    unsubscribe: () => {
      supabase.removeChannel(channel);
    },
  };
};

export const createRealtimeChannel = (channelName: string): RealtimeChannel => {
  return supabase.channel(channelName);
};

export const subscribeToChannel = (
  channel: RealtimeChannel,
  event: string,
  callback: (payload: any) => void
): RealtimeChannel => {
  return channel.on(event, callback);
};

export const broadcastMessage = async (
  channel: RealtimeChannel,
  event: string,
  payload: any
): Promise<void> => {
  await channel.send({
    type: 'broadcast',
    event,
    payload,
  });
};

export const removeChannel = (channel: RealtimeChannel): Promise<'ok' | 'error' | 'timed out'> => {
  return supabase.removeChannel(channel);
};