import {useMutation, useQuery, UseQueryResult} from '@tanstack/react-query';
import {createDaily, getTrainerDailies} from '../../api/activities/dailies';
import {Exercise} from '../../types/program';
import {Daily} from '../../types/activities/dailies';
import {DailyState} from '../../pages/Dailies/CreateDaily';
import {collection, query, where, getDocs} from 'firebase/firestore';
import {useState, useEffect} from 'react';
import {db} from '../../services/firebase';
import {Alert} from 'react-native';

/**
 * Creates a new daily for a given trainer
 * @returns
 */
export const useCreateDaily = () => {
  return useMutation({
    mutationFn: (daily: DailyState) => createDaily(daily),
  });
};

/**
 * Returns dailies for a given trainer
 * @param trainerUid
 * @returns
 */
export const useTrainerDailies = (
  trainerUid: string,
): UseQueryResult<Daily[], Error> => {
  return useQuery({
    queryKey: ['trainerDailies', trainerUid],
    queryFn: () => getTrainerDailies(trainerUid),
  });
};


export const useGetDailiesByDate = (date: Date = new Date()) => {
  const [dailies, setDailies] = useState<Daily[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchDailies = async () => {
      setLoading(true);
      setError(null);
      try {
        const now = date;
        const dateOnly = `${now.getFullYear()}-${String(
          now.getMonth() + 1,
        ).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        const dailiesRef = collection(db, 'dailies');
        const q = query(dailiesRef, where('date_only', '==', dateOnly));

        const querySnapshot = await getDocs(q);
        const fetchedDailies: Daily[] = [];

        querySnapshot.forEach(doc => {
          fetchedDailies.push({id: doc.id, ...doc.data()} as Daily);
        });

        setDailies(fetchedDailies);
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error('An unknown error occurred'),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDailies();
  }, []);

  return {dailies, loading, error};
};

/**
 * Returns dailies for a given trainer_uid
 * @param trainer_uid
 * @returns
 */
export const useGetDailiesByTrainerUid = (
  trainer_uid: string,
): UseQueryResult<Daily[], Error> => {
  return useQuery({
    queryKey: ['dailiesByTrainerUid', trainer_uid],
    queryFn: async (): Promise<Daily[]> => {
      try {
        const dailiesRef = collection(db, 'dailies');
        
        const q = query(dailiesRef, where('trainer_uid', '==', trainer_uid));

        const querySnapshot = await getDocs(q);
        const fetchedDailies: Daily[] = [];

        querySnapshot.forEach(doc => {
          fetchedDailies.push({id: doc.id, ...doc.data()} as Daily);
        });

        return fetchedDailies;
      } catch (err) {
        throw err instanceof Error
          ? err
          : new Error('An unknown error occurred');
      }
    },
    enabled: !!trainer_uid,
  });
};
