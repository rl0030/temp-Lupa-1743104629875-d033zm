import {useState} from 'react';
import {collection, doc, setDoc, serverTimestamp} from 'firebase/firestore';
import {db} from '../../../services/firebase';
import {NotificationType} from '../../../types/notifications';

interface InviteParams {
  trainerUid: string;
  packageUid: string;
  packageName: string;
}

// Hook for inviting a pack
export const useInvitePackToPackage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invitePack = async (packUid: string, params: InviteParams) => {
    setLoading(true);
    setError(null);

    try {
      const notificationRef = doc(collection(db, 'notifications'));

      await setDoc(notificationRef, {
        id: notificationRef.id,
        receiver: packUid,
        type: NotificationType.SESSION_PACKAGE_INVITE,
        message: `Your pack has been invited to join the "${params.packageName}" package.`,
        createdAt: serverTimestamp(),
        isRead: false,
        metadata: {
          trainerUid: params.trainerUid,
          packageUid: params.packageUid,
          clientType: 'pack',
        },
      });

      setLoading(false);
    } catch (err) {
      console.error('Error inviting pack to package:', err);
      setError('Failed to invite pack to package');
      setLoading(false);
    }
  };

  return {invitePack, loading, error};
};

// Hook for inviting a user
export const useInviteUserToPackage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inviteUser = async (userUid: string, params: InviteParams) => {
    setLoading(true);
    setError(null);

    try {
      const notificationRef = doc(collection(db, 'notifications'));

      await setDoc(notificationRef, {
        id: notificationRef.id,
        receiver: userUid,
        type: NotificationType.SESSION_PACKAGE_INVITE,
        message: `You have been invited to join the "${params.packageName}" package.`,
        createdAt: serverTimestamp(),
        isRead: false,
        metadata: {
          trainerUid: params.trainerUid,
          packageUid: params.packageUid,
          clientType: 'user',
        },
      });

      setLoading(false);
    } catch (err) {
      console.error('Error inviting user to package:', err);
      setError('Failed to invite user to package');
      setLoading(false);
    }
  };

  return {inviteUser, loading, error};
};
