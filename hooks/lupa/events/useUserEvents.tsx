import {useQuery} from '@tanstack/react-query';
import { getUserScheduledEvents } from '../../../api';

export const useUserScheduledEvents = (userUid: string) => {
  return useQuery({
    queryKey: ['user_scheduled_events', userUid],
    queryFn: () => getUserScheduledEvents(userUid),
  });
};
