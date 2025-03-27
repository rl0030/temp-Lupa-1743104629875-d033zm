import {useMutation} from '@tanstack/react-query';
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import {db} from '../../services/firebase';

// TODO:
interface NotificationData {
  userUid: string;
  trainerUid: string;
  type: string;
  message: string;
}

const useCreateSessionNotification = () => {
  const createNotification = async (notificationData: NotificationData) => {
    try {
      const notificationRef = doc(collection(db, 'notifications'));

      await setDoc(notificationRef, {
        id: notificationRef.id,
        client_uid: notificationData.userUid,
        trainer_uid: notificationData.trainerUid,
        type: notificationData.type,
        message: notificationData.message,
        createdAt: serverTimestamp(),
        isRead: false,
      });
    } catch (error) {}
  };

  return useMutation<void, Error, NotificationData>({
    mutationKey: ['user_create_notification'],
    mutationFn: notificationData => createNotification(notificationData),
  });
};

export {useCreateSessionNotification};
