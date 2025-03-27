import { useQuery } from '@tanstack/react-query';
import { getPackScheduledEvents } from '../../../api';

export const usePackScheduledEvents = (packId: string) => {
  return useQuery({
    queryKey: ['pack_scheduled_events', packId],
    queryFn: () => getPackScheduledEvents(packId),
  });
};