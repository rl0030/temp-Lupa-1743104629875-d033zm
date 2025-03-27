import {addDoc, collection, doc, setDoc, updateDoc} from 'firebase/firestore';
import {useState} from 'react';
import {TrainerAvailability} from '../../../types/user';
import {db} from '../../../services/firebase';

export const useCreateTrainerAvailability = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAvailability = async (availability: TrainerAvailability) => {
    setLoading(true);
    setError(null);

    try {
      const newAvailabilityRef = await addDoc(
        collection(db, 'trainer_availability'),
        {
          ...availability,
        },
      );

      updateDoc(newAvailabilityRef, {
        uid: newAvailabilityRef.id,
      });

      setLoading(false);
      return newAvailabilityRef.id;
    } catch (err) {
      setError('Failed to create trainer availability');
      setLoading(false);
      throw err;
    }
  };

  return {createAvailability, loading, error};
};
