// useTrainerMetadata.js
import {useEffect} from 'react';
import {useRecoilState} from 'recoil';
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import {trainerMetadataAtom} from '../../../state/recoil/trainerMetadataState';
import { db } from '../../../services/firebase';

export default function useTrainerMetadataWithListener(uid: string) {
  const [trainerMetadata, setTrainerMetadata] =
    useRecoilState(trainerMetadataAtom);

  useEffect(() => {
    if (uid) {
      const trainerMetadataCollection = collection(db, 'trainer_metadata');
      const trainerMetadataQuery = query(
        trainerMetadataCollection,
        where('user_uid', '==', uid),
      );

      const unsubscribe = onSnapshot(
        trainerMetadataQuery,
        snapshot => {
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const data = doc.data();
            setTrainerMetadata(data);
          } else {
            console.log('Trainer metadata not found');
          }
        },
        error => {
          console.error('Error fetching trainer metadata:', error);
        },
      );

      return () => unsubscribe();
    }
  }, [uid, db]);

  return trainerMetadata;
}
