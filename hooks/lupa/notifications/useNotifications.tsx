import {useQuery} from '@tanstack/react-query';
import {auth} from '../../../services/firebase';
import {getUserNotifications} from '../../../api';

const useUserNotifications = () => {
  return useQuery({
    queryKey: ['user_notifications', auth?.currentUser?.uid],
    queryFn: getUserNotifications,
  });
};

export default useUserNotifications;
