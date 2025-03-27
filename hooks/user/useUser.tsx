// useUserData.tsx
import {useEffect} from 'react';
import {useRecoilState} from 'recoil';
import {userDataAtom} from '../../state/recoil/userState';
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { FirebaseDatabaseTypes } from '../../types/firebase';

export default function useUserDataWithListener(uid: string) {
  const [userData, setUserData] = useRecoilState(userDataAtom);

  useEffect(() => {
    if (uid) {
      const usersCollection = collection(db, FirebaseDatabaseTypes.LupaCollections.USERS);
      const userQuery = query(usersCollection, where('uid', '==', uid));

      const unsubscribe = onSnapshot(
        userQuery,
        snapshot => {
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const data = doc.data();
            setUserData(data);
          } else {
            console.log('User document not found');
          }
        },
        error => {
          console.error('Error fetching user data:', error);
        },
      );

      return () => unsubscribe();
    }
  }, [uid, db]);

  return userData;
}
