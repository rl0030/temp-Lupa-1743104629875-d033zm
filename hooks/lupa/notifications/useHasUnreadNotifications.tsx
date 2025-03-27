import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../../../services/firebase';

export const useHasUnreadNotifications = () => {
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState<boolean>(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('receiver', '==', user.uid),
      where('isRead', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHasUnreadNotifications(!snapshot.empty);
    });
    

    return () => unsubscribe();
  }, []);

  return hasUnreadNotifications;
};