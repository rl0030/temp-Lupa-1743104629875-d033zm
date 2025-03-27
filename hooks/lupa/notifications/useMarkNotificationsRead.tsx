import { useCallback } from 'react';
import { collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../../services/firebase';

export const useMarkNotificationsRead = () => {
  const markAllAsRead = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) return;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('receiver', '==', user.uid),
      where('isRead', '==', false)
    );

    const querySnapshot = await getDocs(q);
    const updatePromises = querySnapshot.docs.map(doc =>
      updateDoc(doc.ref, { isRead: true })
    );

    await Promise.all(updatePromises);
  }, []);

  return { markAllAsRead };
};