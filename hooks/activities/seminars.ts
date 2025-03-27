import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {db} from '../../services/firebase';
import {UserScheduledEvent} from '../../types/user';
import {useMutation, useQuery} from '@tanstack/react-query';
import {push, ref, update} from 'firebase/database';
import {realtime_db} from '../../services/firebase/realtime_database';
import {
  Seminar,
  PurchaseSeminarVariables,
} from '../../types/activities/seminars';
import {isDate} from 'date-fns';
import {NotificationType} from '../../types/notifications';
import { calculateDistance } from '../../util/location';
import { useEffect, useState } from 'react';

export const useCreateSeminar = () => {
  const createSeminar = async (seminarData: Omit<Seminar, 'id'>) => {
    try {
      const seminarsCollection = collection(db, 'seminars');
      const seminarRef = doc(seminarsCollection);
      const newSeminar: Seminar = {
        ...seminarData,
        id: seminarRef.id,
      };

      await setDoc(seminarRef, newSeminar);

      // Update trainer's calendar
      const trainerEvent: UserScheduledEvent = {
        date: newSeminar.date,
        startTime: newSeminar.start_time,
        endTime: newSeminar.end_time,
        uid: seminarRef.id,
        user_uid: newSeminar.trainer_uid,
        type: 'Seminar',
        event_uid: seminarRef.id,
        package_uid: null,
      };

      await addDoc(collection(db, 'user_scheduled_events'), trainerEvent);

      return newSeminar;
    } catch (error) {
      console.error('Error creating seminar:', error);
      throw error;
    }
  };

  return useMutation({
    mutationFn: (seminarData: Omit<Seminar, 'id'>) =>
      createSeminar(seminarData),
    mutationKey: ['create_seminar'],
  });
};

export const useDeleteSeminar = () => {
  const deleteSeminar = async (seminarId: string) => {
    try {
      const seminarRef = doc(db, 'seminars', seminarId);
      const seminarDoc = await getDoc(seminarRef);

      if (!seminarDoc.exists()) {
        throw new Error('Seminar not found');
      }

      const seminarData = seminarDoc.data() as Seminar;

      // Delete seminar
      await deleteDoc(seminarRef);

      // Delete trainer's calendar event
      const trainerEventQuery = query(
        collection(db, 'user_scheduled_events'),
        where('uid', '==', seminarId),
        where('user_uid', '==', seminarData.trainer_uid),
      );
      const trainerEventQuerySnapshot = await getDocs(trainerEventQuery);

      trainerEventQuerySnapshot.forEach(async doc => {
        await deleteDoc(doc.ref);
      });

      // Delete participants' calendar events
      for (const participantUid of seminarData.user_slots) {
        const participantEventQuery = query(
          collection(db, 'user_scheduled_events'),
          where('event_uid', '==', seminarId),
          where('user_uid', '==', participantUid),
        );
        const participantEventQuerySnapshot = await getDocs(
          participantEventQuery,
        );

        participantEventQuerySnapshot.forEach(async doc => {
          await deleteDoc(doc.ref);
        });
      }
    } catch (error) {
      console.error('Error deleting seminar:', error);
      throw error;
    }
  };

  return useMutation({
    mutationFn: deleteSeminar,
    mutationKey: ['use_delete_seminar'],
  });
};

export const useGetSeminar = (seminarId: string) => {
  const getSeminar = async (): Promise<Seminar | null> => {
    try {
      const seminarDoc = await getDoc(doc(db, 'seminars', seminarId));

      if (!seminarDoc.exists()) {
        return null;
      }

      return {...seminarDoc.data(), id: seminarDoc.id} as Seminar;
    } catch (error) {
      console.error('Error getting seminar:', error);
      throw error;
    }
  };

  return useQuery({
    queryFn: getSeminar,
    queryKey: ['use_get_seminar', seminarId],
    enabled: !!seminarId,
  });
};

export const useGetTrainerSeminars = (trainerUid: string) => {
  const getTrainerSeminars = async (): Promise<Seminar[]> => {
    try {
      const seminarsQuery = query(
        collection(db, 'seminars'),
        where('trainer_uid', '==', trainerUid),
      );
      const seminarsQuerySnapshot = await getDocs(seminarsQuery);

      return seminarsQuerySnapshot.docs.map(
        doc => ({...doc.data(), id: doc.id} as Seminar),
      );
    } catch (error) {
      console.error('Error getting trainer seminars:', error);
      throw error;
    }
  };

  return useQuery({
    queryFn: getTrainerSeminars,
    queryKey: ['use_get_trainer_seminars', trainerUid],
    enabled: !!trainerUid,
  });
};

export const useGetSeminarsByDate = (targetDate: Date) => {
  const getSeminarsByDate = async (): Promise<Seminar[]> => {
    try {
      const date_only = targetDate.toISOString().split('T')[0];

      const seminarsQuery = query(
        collection(db, 'seminars'),
        where('date_only', '==', date_only),
      );
      const seminarsQuerySnapshot = await getDocs(seminarsQuery);

      return seminarsQuerySnapshot.docs.map(
        doc => ({...doc.data(), id: doc.id} as Seminar),
      );
    } catch (error) {
      console.error('Error getting seminars by date:', error);
      throw error;
    }
  };

  return useQuery({
    queryFn: getSeminarsByDate,
    queryKey: [
      'use_get_seminars_by_date',
      targetDate.toISOString().split('T')[0],
    ],
    enabled:
      !!targetDate &&
      targetDate instanceof Date &&
      !isNaN(targetDate.getTime()),
  });
};

export const useSeminarPurchase = () => {
  const purchaseSeminar = async (userId: string, seminarId: string) => {
    try {
      const seminarRef = doc(db, 'seminars', seminarId);
      const seminarDoc = await getDoc(seminarRef);

      if (!seminarDoc.exists()) {
        throw new Error('Seminar is no longer available');
      }

      const seminarData = seminarDoc.data() as Seminar;

      if (seminarData.user_slots.length === seminarData.max_slots) {
        throw new Error('Seminar is sold out.');
      }

      await updateDoc(seminarRef, {
        user_slots: arrayUnion(userId),
      });

      // Update the user's scheduled events
      const userScheduledEventRef = doc(
        collection(db, 'user_scheduled_events'),
      );
      const userScheduledEvent: UserScheduledEvent = {
        uid: userScheduledEventRef.id,
        date: seminarData.date,
        startTime: seminarData.start_time,
        endTime: seminarData.end_time,
        user_uid: userId,
        package_uid: null,
        event_uid: seminarId,
        type: 'Seminar',
      };
      await setDoc(userScheduledEventRef, userScheduledEvent);

      // Send a message from the trainer's account to the user's account
      const currentUserRef = ref(
        realtime_db,
        `privateChats/${seminarData.trainer_uid}/${userId}`,
      );
      const otherUserRef = ref(
        realtime_db,
        `privateChats/${userId}/${seminarData.trainer_uid}`,
      );
      const newMessageData = {
        text: `Thank you for joining my seminar "${seminarData.name}". I look forward to seeing you there!`,
        timestamp: Date.now(),
        sender: seminarData.trainer_uid,
      };
      push(currentUserRef, newMessageData);
      push(otherUserRef, newMessageData);
      const conversationUpdates = {
        [`conversations/${seminarData.trainer_uid}/${userId}/lastMessage`]:
          newMessageData,
        [`conversations/${userId}/${seminarData.trainer_uid}/lastMessage`]:
          newMessageData,
      };
      update(ref(realtime_db), conversationUpdates);

      // Create notifications for the user and trainer
      const userNotificationRef = doc(collection(db, 'notifications'));
      await setDoc(userNotificationRef, {
        id: userNotificationRef.id,
        receiver: userId,
        type: NotificationType.SEMINARS_JOINED,
        title: 'Seminar Notification',
        message: `You have joined the seminar "${seminarData.name}". Check your calendar.`,
        createdAt: serverTimestamp(),
        isRead: false,
      });

      const trainerNotificationRef = doc(collection(db, 'notifications'));
      await setDoc(trainerNotificationRef, {
        id: trainerNotificationRef.id,
        receiver: seminarData.trainer_uid,
        type: NotificationType.SEMINAR_PARTICIPANT_ADDED,
        title: 'Seminar Notification',
        message: `A new participant has joined your seminar "${seminarData.name}".`,
        createdAt: serverTimestamp(),
        isRead: false,
      });
    } catch (error) {
      throw error;
    }
  };

  return useMutation<any, Error, PurchaseSeminarVariables>({
    mutationFn: ({userId, seminarId}) => purchaseSeminar(userId, seminarId),
    mutationKey: ['use_seminar_purchase'],
    retry: false,
  });
};

const MILES_TO_KM = 1.60934;


export const useNearbySeminars = (
  currentLat: number,
  currentLng: number,
  radiusInMiles: number,
  date?: string,
  limit: number = 10
) => {
  const [nearbySeminars, setNearbySeminars] = useState<Seminar[]>([]);

  useEffect(() => {
    let seminarsQuery = query(collection(db, 'seminars'));

    if (date) {
      seminarsQuery = query(seminarsQuery, where('date_only', '==', date));
    }

    const unsubscribe = onSnapshot(seminarsQuery, (snapshot) => {
      const seminarsData = snapshot.docs.map(doc => ({
        ...(doc.data() as Seminar),
        id: doc.id,
      }));

      // Calculate distance between current location and seminars
      const seminarsWithDistance = seminarsData.map(seminar => {
        const distanceInKm = calculateDistance(
          currentLat,
          currentLng,
          seminar.location.lat,
          seminar.location.lng
        );
        const distanceInMiles = distanceInKm / MILES_TO_KM;
        return { ...seminar, distance: distanceInMiles };
      });

      // Filter seminars within the specified radius
      const nearbySeminarsData = seminarsWithDistance
        .filter(seminar => seminar.distance <= radiusInMiles)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);

      setNearbySeminars(nearbySeminarsData);
    }, (error) => {
      console.error('Error fetching nearby seminars:', error);
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [currentLat, currentLng, radiusInMiles, date, limit]);

  return nearbySeminars;
};