import {useQuery, useMutation} from '@tanstack/react-query';
import {
  fetchTrainerAvailabilitySlot,
  fetchTrainerMetadata,
  getTrainerAvailability,
  getTrainerClients,
  updateTrainerAvailability,
} from '../../api';
import {
  LupaUser,
  Pack,
  TrainerAvailability,
  TrainerMetadata,
} from '../../types/user';
import {useEffect, useState} from 'react';
import {db} from '../../services/firebase';
import {collection, onSnapshot, query, where} from 'firebase/firestore';

export const useTrainerAvailabilitySlotsWithListener = (
  trainerUid: string,
  includeBookedSessions: boolean,
) => {
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);

  useEffect(() => {
    const availabilityRef = collection(db, 'trainer_availability');
    const q = query(
      availabilityRef,
      where('trainer_uid', '==', trainerUid),
      // where('isBooked', '==', false),
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const slots = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as TrainerAvailability),
      }));
      setAvailableSlots(slots);
    });

    return () => {
      unsubscribe();
    };
  }, [trainerUid, includeBookedSessions]);
  
  return availableSlots;
};

const useTrainerAvailability = (
  trainerUid: string,
  includeBookedSessions: boolean,
) => {
  return useQuery({
    queryKey: ['use_trainer_availability', trainerUid, includeBookedSessions],
    queryFn: () => getTrainerAvailability(trainerUid, includeBookedSessions),
  });
};

export const useFetchTrainerMetadata = () => {
  return useMutation({
    mutationKey: ['use_fetch_trainer_metadata'],
    mutationFn: (userUid: string) => fetchTrainerMetadata(userUid),
  });
};

const useTrainerMetadata = (userUid: string) => {
  return useQuery<any, Error, TrainerMetadata>({
    queryKey: ['use_trainer_metadata', userUid],
    queryFn: () => fetchTrainerMetadata(userUid),
    enabled: !!userUid,
  });
};

const useTrainerAvailabilitySlot = (uid: string) => {
  return useQuery<any, Error, TrainerAvailability>({
    queryKey: ['use_trainer_availability_slot', uid],
    queryFn: () => fetchTrainerAvailabilitySlot(uid),
    enabled: !!uid,
  });
};

const useTrainerClients = (trainerUid: string) => {
  return useQuery<any, Error, (LupaUser | Pack)[]>({
    queryKey: ['use_trainer_clients'],
    queryFn: () => getTrainerClients(trainerUid),
  });
};

export {
  useTrainerClients,
  useTrainerAvailability,
  useTrainerAvailabilitySlot,
  useTrainerMetadata,
};
