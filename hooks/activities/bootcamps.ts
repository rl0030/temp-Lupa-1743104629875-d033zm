import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {db} from '../../services/firebase';
import {TrainerMetadata, UserScheduledEvent} from '../../types/user';
import {useMutation, useQuery} from '@tanstack/react-query';
import {push, ref, update} from 'firebase/database';
import {realtime_db} from '../../services/firebase/realtime_database';
import {getUser} from '../../api';
import {
  Bootcamp,
  PurchaseBootcampVariables,
} from '../../types/activities/bootcamps';
import {isDate} from 'date-fns';
import { NotificationType } from '../../types/notifications';
import { calculateDistance } from '../../util/location';
import { useEffect, useState } from 'react'

export const useCreateBootcamp = () => {
  const createBootcamp = async (bootcampData: Omit<Bootcamp, 'id'>) => {
    try {
      const bootcampsCollection = collection(db, 'bootcamps');
      const bootcampRef = doc(bootcampsCollection);
      const newBootcamp: Bootcamp = {
        ...bootcampData,
        id: bootcampRef.id,
      };

      await setDoc(bootcampRef, newBootcamp);

      // Update trainer's calendar
      const trainerEvent: UserScheduledEvent = {
        date: newBootcamp.date,
        startTime: newBootcamp.start_time,
        endTime: newBootcamp.end_time,
        uid: bootcampRef.id,
        user_uid: newBootcamp.trainer_uid,
        type: 'Bootcamp',
        event_uid: bootcampRef.id,
        package_uid: null,
      };

      await addDoc(collection(db, 'user_scheduled_events'), trainerEvent);

      return newBootcamp;
    } catch (error) {
      console.error('Error creating bootcamp:', error);
      throw error;
    }
  };

  return useMutation({
    mutationFn: (bootcampData: Omit<Bootcamp, 'id'>) =>
      createBootcamp(bootcampData),
    mutationKey: ['create_bootcamp'],
  });
};

export const useDeleteBootcamp = () => {
  const deleteBootcamp = async (bootcampId: string) => {
    try {
      const bootcampRef = doc(db, 'bootcamps', bootcampId);
      const bootcampDoc = await getDoc(bootcampRef);

      if (!bootcampDoc.exists()) {
        throw new Error('Bootcamp not found');
      }

      const bootcampData = bootcampDoc.data() as Bootcamp;

      // Delete bootcamp
      await deleteDoc(bootcampRef);

      // Delete trainer's calendar event
      const trainerEventQuery = query(
        collection(db, 'user_scheduled_events'),
        where('uid', '==', bootcampId),
        where('user_uid', '==', bootcampData.trainer_uid),
      );
      const trainerEventQuerySnapshot = await getDocs(trainerEventQuery);

      trainerEventQuerySnapshot.forEach(async doc => {
        await deleteDoc(doc.ref);
      });

      // Delete participants' calendar events
      for (const participantUid of bootcampData?.user_slots) {
        const participantEventQuery = query(
          collection(db, 'user_scheduled_events'),
          where('event_uid', '==', bootcampId),
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
      console.error('Error deleting bootcamp:', error);
      throw error;
    }
  };

  return useMutation({
    mutationFn: deleteBootcamp,
    mutationKey: ['use_delete_bootcamp'],
  });
};

export const useGetBootcamp = (uid: string) => {
  const getBootcamp = async (bootcampId: string): Promise<Bootcamp | null> => {
    try {
      const bootcampDoc = await getDoc(doc(db, 'bootcamps', bootcampId));

      if (!bootcampDoc.exists()) {
        return null;
      }

      return bootcampDoc.data() as Bootcamp;
    } catch (error) {
      console.error('Error getting bootcamp:', error);
      throw error;
    }
  };

  return useQuery({
    queryFn: () => getBootcamp(uid),
    queryKey: ['use_get_bootcamp'],
    enabled: !!uid
  });
};

export const useGetTrainerBootcamps = () => {
  const getTrainerBootcamps = async (
    trainerUid: string,
  ): Promise<Bootcamp[]> => {
    try {
      const bootcampsQuery = query(
        collection(db, 'bootcamps'),
        where('trainer_uid', '==', trainerUid),
      );
      const bootcampsQuerySnapshot = await getDocs(bootcampsQuery);

      return bootcampsQuerySnapshot.docs.map(doc => doc.data() as Bootcamp);
    } catch (error) {
      console.error('Error getting trainer bootcamps:', error);
      throw error;
    }
  };
  return useQuery({
    queryFn: () => getTrainerBootcamps,
    queryKey: ['use_get_trainer_bootcamps'],
  });
};

export const useGetBootcampsByDate = (targetDate: Date) => {
  const getBootcampsByDate = async (date: Date): Promise<Bootcamp[]> => {
    try {
      const date_only = date.toISOString().split('T')[0];

      const bootcampsQuery = query(
        collection(db, 'bootcamps'),
        where('date_only', '==', date_only),
      );
      const bootcampsQuerySnapshot = await getDocs(bootcampsQuery);

      return bootcampsQuerySnapshot.docs.map(
        doc =>
          ({
            ...doc.data(),
            id: doc.id,
          } as Bootcamp),
      );
    } catch (error) {
      console.error('Error getting bootcamps by date:', error);
      throw error;
    }
  };


  return useQuery({
    queryFn: () => getBootcampsByDate(targetDate),
    queryKey: [
      'use_get_bootcamps_by_date',
      targetDate.toISOString().split('T')[0],
    ],
    enabled:
      !!targetDate &&
      targetDate instanceof Date &&
      !isNaN(targetDate.getTime()),
  });
};

export const useBootcampPurchase = () => {
  const purchaseBootcamp = async (userId: string, bootcampId: string) => {
    try {
      // Query the bootcamps collection for the bootcamp
      const bootcampRef = doc(db, 'bootcamps', bootcampId);
      const bootcampDoc = await getDoc(bootcampRef);

      if (!bootcampDoc.exists()) {
        throw new Error('Bootcamp is no longer available');
      }

      const bootcampData = bootcampDoc.data() as Bootcamp;

      if (bootcampData.user_slots.length === bootcampData.max_slots) {
        throw new Error('Bootcamp is sold out.');
      }

      await updateDoc(bootcampRef, {
        user_slots: arrayUnion(userId),
      });

      // Update the user's scheduled events
      const userScheduledEventRef = doc(
        collection(db, 'user_scheduled_events'),
      );
      const userScheduledEvent: UserScheduledEvent = {
        uid: userScheduledEventRef.id,
        date: bootcampData.date,
        startTime: bootcampData.start_time,
        endTime: bootcampData.end_time,
        user_uid: userId,
        package_uid: null,
        event_uid: bootcampId,
        type: 'Bootcamp',
      };
      await setDoc(userScheduledEventRef, userScheduledEvent);

      // Send a message from the trainer's account to the user's account
      const currentUserRef = ref(
        realtime_db,
        `privateChats/${bootcampData.trainer_uid}/${userId}`,
      );
      const otherUserRef = ref(
        realtime_db,
        `privateChats/${userId}/${bootcampData.trainer_uid}`,
      );
      const newMessageData = {
        text: `Thank you for joining my bootcamp "${bootcampData.name}". I look forward to meeting you!`,
        timestamp: Date.now(),
        sender: bootcampData.trainer_uid,
      };
      push(currentUserRef, newMessageData);
      push(otherUserRef, newMessageData);
      const conversationUpdates = {
        [`conversations/${bootcampData.trainer_uid}/${userId}/lastMessage`]:
          newMessageData,
        [`conversations/${userId}/${bootcampData.trainer_uid}/lastMessage`]:
          newMessageData,
      };
      update(ref(realtime_db), conversationUpdates);

      // Create notifications for the user and trainer
      const userNotificationRef = doc(collection(db, 'notifications'));
      await setDoc(userNotificationRef, {
        id: userNotificationRef.id,
        receiver: userId,
        type: NotificationType.BOOTCAMP_JOINED,
        title: 'Bootcamp Notification',
        message: `You have joined the bootcamp "${bootcampData.name}". Check your calendar.`,
        createdAt: serverTimestamp(),
        isRead: false,
      });

      const trainerNotificationRef = doc(collection(db, 'notifications'));
      await setDoc(trainerNotificationRef, {
        id: trainerNotificationRef.id,
        receiver: bootcampData.trainer_uid,
        type: NotificationType.BOOTCAMP_PARTICIPANT_ADDED,
        title: 'Bootcamp Notification',
        message: `A new participant has joined your bootcamp "${bootcampData.name}".`,
        createdAt: serverTimestamp(),
        isRead: false,
      });
    } catch (error) {
      throw error;
    }
  };

  return useMutation<any, Error, PurchaseBootcampVariables>({
    mutationFn: ({userId, bootcampId}) => purchaseBootcamp(userId, bootcampId),
    mutationKey: ['use_bootcamp_urchase'],
    retry: false,
  });
};


const MILES_TO_KM = 1.60934;

export const useNearbyBootcamps = (
  currentLat: number,
  currentLng: number,
  radiusInMiles: number,
  date?: string,
  limit: number = 10
) => {
  const [nearbyBootcamps, setNearbyBootcamps] = useState<Bootcamp[]>([]);

  useEffect(() => {
    let bootcampsQuery = query(collection(db, 'bootcamps'));

    if (date) {
      bootcampsQuery = query(bootcampsQuery, where('date_only', '==', date));
    }

    const unsubscribe = onSnapshot(bootcampsQuery, (snapshot) => {
      const bootcampsData = snapshot.docs.map(doc => ({
        ...(doc.data() as Bootcamp),
        id: doc.id,
      }));

      // Calculate distance between current location and bootcamps
      const bootcampsWithDistance = bootcampsData.map(bootcamp => {
        const distanceInKm = calculateDistance(
          currentLat,
          currentLng,
          bootcamp.location.lat,
          bootcamp.location.lng
        );
        const distanceInMiles = distanceInKm / MILES_TO_KM;
        return { ...bootcamp, distance: distanceInMiles };
      });

      // Filter bootcamps within the specified radius
      const nearbyBootcampsData = bootcampsWithDistance
        .filter(bootcamp => bootcamp.distance <= radiusInMiles)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);

      setNearbyBootcamps(nearbyBootcampsData);
    }, (error) => {
      console.error('Error fetching nearby bootcamps:', error);
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [currentLat, currentLng, radiusInMiles, date, limit]);

  return nearbyBootcamps;
};