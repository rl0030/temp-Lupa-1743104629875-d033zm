import {useQuery} from '@tanstack/react-query';
import {getTrainersNearUser} from '../../api';
import {useEffect, useState} from 'react';
import {calculateDistance} from '../../util/location';
import {LupaUser, TrainerMetadata} from '../../types/user';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  where,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import {db} from '../../services/firebase';

type UseNearbyTrainersHookOptions = {
  radius: number;
};

export default function useNearbyTrainersBasedOnGeoRadius(
  options: UseNearbyTrainersHookOptions,
) {
  const {radius} = options;
  const queryResult = useQuery({
    queryKey: ['nearby_trainers', radius],
    queryFn: () => getTrainersNearUser(radius),
  });
  const {status, error, isError, isSuccess, data} = queryResult;

  useEffect(() => {
    if (status === 'error') {
      console.error(error);
    }
    if (status === 'success') {
      console.debug('Successfully fetched nearby trainers');
    }
  }, [status]);

  return queryResult;
}

type AvailabilitySlot = {
  date: string;
  startTime: string;
  endTime: string;
};

type TrainerWithAvailability = {
  trainer: LupaUser;
  // metadata: TrainerMetadata;
  availabilitySlots: AvailabilitySlot[];
};

export const useNearbyTrainersBasedOnHaversine = (currentUser: LupaUser, limit = 4) => {
  const [nearbyTrainers, setNearbyTrainers] = useState([]);

  useEffect(() => {
    const fetchNearbyTrainers = async (): Promise<
      TrainerWithAvailability[]
    > => {
      try {
        const trainersQuery = query(
          collection(db, 'users'),
          where('role', '==', 'trainer'),
        );

        const trainersSnapshot = await getDocs(trainersQuery);
        const trainersData = trainersSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        }));

        // Calculate distance between current user and trainers
        const trainersWithDistance = trainersData.map(trainerData => {
          const distance = calculateDistance(
            currentUser.location.latitude,
            currentUser.location.longitude,
            trainerData.location.latitude,
            trainerData.location.longitude,
          );
          return {...trainerData, distance};
        });

        // Sort trainers by distance in ascending order
        const sortedTrainers = trainersWithDistance.sort(
          (a, b) => a.distance - b.distance,
        );

        // Fetch trainer user data and availability slots for the closest trainers
        const nearbyTrainersData: TrainerWithAvailability[] = await Promise.all(
          sortedTrainers.slice(0, limit).map(async trainerData => {
            const trainerUserDoc = doc(db, 'users', trainerData.id);
            const trainerUser = (await getDoc(trainerUserDoc)).data();
            const currentDate = new Date();
            const startOfDay = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              currentDate.getDate(),
            );
            const endOfDay = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              currentDate.getDate() + 1,
            );

            const availabilitySlotsQuery = query(
              collection(db, 'trainer_availability'),
              where('trainer_uid', '==', trainerUser.uid),
            );

            const availabilitySlotsSnapshot = await getDocs(
              availabilitySlotsQuery,
            );

            const filteredSlots = availabilitySlotsSnapshot.docs.filter(doc => {
              const data = doc.data();
              const slotDate = new Date(data.date);

              return (
                !data.isBooked && slotDate >= startOfDay && slotDate < endOfDay
              );
            });

            const availabilitySlots = filteredSlots.map(doc => doc.data());

            return {
              trainer: trainerUser,
              availabilitySlots,
            };
          }),
        );

        setNearbyTrainers(nearbyTrainersData);
      } catch (error) {
        console.log('Error fetching nearby trainers:', error);
        return [];
      }
    };

    fetchNearbyTrainers();
  }, [currentUser?.location?.latitude, currentUser?.location?.longitude, limit]);

  return nearbyTrainers;
};
