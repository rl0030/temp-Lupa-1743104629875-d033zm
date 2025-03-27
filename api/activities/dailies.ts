// api.ts

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import {Exercise} from '../../types/program';
import {db} from '../../services/firebase';
import {UID} from '../../types/common';
import {Daily} from '../../types/activities/dailies';
import {DailyState} from '../../pages/Dailies/CreateDaily';

export const createDaily = async (state: DailyState): Promise<string> => {
  if (state.items.length > 3) {
    throw new Error('A daily can have a maximum of 3 exercises');
  }

  const dailyRef = await addDoc(collection(db, 'dailies'), {
    ...state,
    date: Timestamp.now(),
    date_utc: Timestamp.now().toDate().toUTCString(),
    date_only: Timestamp.now().toDate().toISOString().split('T')[0],
  });

  updateDoc(dailyRef, {
    id: dailyRef.id,
    uid: dailyRef.id,
  });

  return dailyRef.id;
};

export const getTrainerDailies = async (
  trainerUid: string,
): Promise<Daily[]> => {
  const dailiesQuery = query(
    collection(db, 'dailies'),
    where('trainer_uid', '==', trainerUid),
  );

  const querySnapshot = await getDocs(dailiesQuery);
  return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as Daily));
};
