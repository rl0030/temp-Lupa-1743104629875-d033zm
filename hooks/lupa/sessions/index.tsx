import {useMutation, useQuery} from '@tanstack/react-query';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import queryClient from '../../../react-query';
import {
  createPack,
  createSessionPackage,
  getSessionPackage,
} from '../../../api';
import {db} from '../../../services/firebase';
import {Pack, SessionPackage} from '../../../types/user';
import { ScheduledMeeting, ScheduledMeetingClientType, SessionPackageType } from '../../../types/session';
import { useState } from 'react';
import { UserScheduledEvent } from '../../../types/activities';
import { NotificationType } from '../../../types/notifications';
import { getUser } from '../../../api/user';

export const useSinglePackage = (packageUid: string) => {
  return useQuery({
    queryKey: ['package', packageUid],
    queryFn: async () => getSessionPackage(packageUid),
  });
};

export const useSessionPackages = (trainerUid: string) => {
  return useQuery({
    queryKey: ['use_packages', trainerUid],
    queryFn: async () => {
      const packageCollectionRef = collection(db, 'packages');
      const packageQuery = query(
        packageCollectionRef,
        where('trainer_uid', '==', trainerUid),
      );
      const packageDocsSnapshot = await getDocs(packageQuery);
      return packageDocsSnapshot.docs.map(doc => doc.data() as SessionPackage);
    },
  });
};

export const useCreateSessionPackageMutation = () => {
  return useMutation({
    mutationFn: createSessionPackage,
    mutationKey: ['user_create_session_package', variables.trainer_uid],
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['use_packages', variables.trainer_uid]);
    },
  });
};


// ========================== Refactor Starts Here ===================== 

export interface ScheduleSessionParams {
  trainer_uid: string;
  clients: string[];
  start_time: Date | string;
  end_time: Date | string;
  date: Date | string;
  programs: any[];
  availability_uid: string;
  price: number | null;
  session_note: string;
  clientType: ScheduledMeetingClientType;
  package_uid: string;
  type: SessionPackageType;
}

/**
 * Schedules a session that is a part of a purchased package.
 * TODO: Adapt function to work for packs
 * @returns 
 */
export const useSchedulePackageSession = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scheduleSession = async (params: ScheduleSessionParams) => {
    setLoading(true);
    setError(null);

    try {
      const result = await runTransaction(db, async transaction => {
        // Perform all reads first

        // Get a reference to the purchase package
        const packageRef = doc(db, 'purchased_packages', params.package_uid);
        const packageDoc = await transaction.get(packageRef);
        
        // Get the trainers data
        const trainerData = await getUser(params.clients[0]);

        // We fetch the user and pack data assuming one will fail due to
        // the document not existing
        // TODO: Add mechanism to detect client type
        // Get the clients data
        const userData = await getUser(params.clients[0]);
        // Get the pack data
        const packData = await (
          await getDoc(doc(db, 'packs', params.clients[0]))
        ).data();

        if (!packageDoc.exists()) {
          throw new Error(`Package with ID ${params.package_uid} not found`);
        }

        // Get a reference to the notifications collection
        const trainerNotificationRef = doc(collection(db, 'notifications'));
        const userNotificationRef = doc(collection(db, 'notifications'));

        // Query the trainer availability collection for the uid specified in the
        // package
        const trainerAvailabilityQuery = query(
          collection(db, 'trainer_availability'),
          where('uid', '==', params.availability_uid),
        );
        const trainerAvailabilityDocs = await getDocs(trainerAvailabilityQuery);
        if (trainerAvailabilityDocs.empty) {
          throw new Error('Trainer availability not found');
        }

        const trainerAvailabilityDoc = trainerAvailabilityDocs.docs[0];
        // 1. Create the new scheduled session
        const newSessionRef = doc(collection(db, 'scheduled_sessions'));
        const newSession: ScheduledMeeting = {
          uid: newSessionRef.id,
          trainer_uid: params.trainer_uid,
          clients: params.clients,
          start_time: params.start_time,
          end_time: params.end_time,
          date: params.date,
          programs: params.programs,
          status: 'scheduled',
          package_uid: params.package_uid,
          availability_uid: params.availability_uid,
          price: params.price,
          session_note: params.session_note,
          clientType: params.clientType,
          type: params.type
        };

        transaction.set(newSessionRef, newSession);

        const packageData = packageDoc.data();
        const currentScheduledMeetings =
          packageData?.scheduled_meeting_uids || [];
        transaction.update(packageRef, {
          scheduled_meeting_uids: [...currentScheduledMeetings, newSession.uid],
        });

        // Handle the client type if the session is for a pack
        if (params.clientType === ScheduledMeetingClientType.Pack) {
          for (const clientUid of packData?.members) {
            const userScheduledEventRef = doc(
              collection(db, 'user_scheduled_events'),
            );
            const userScheduledEvent: UserScheduledEvent = {
              date: params.date,
              startTime: params.start_time,
              endTime: params.end_time,
              uid: userScheduledEventRef.id,
              user_uid: clientUid,
              type: 'Session',
              event_uid: newSession.uid,
              package_uid: params.package_uid,
            };

            transaction.set(userScheduledEventRef, userScheduledEvent);

            // Create notification for the user
            await setDoc(userNotificationRef, {
              id: userNotificationRef.id,
              receiver: clientUid,
              type: NotificationType.SESSION_SCHEDULED,
              message: `A new session has been scheduled for ${packData?.name} with ${trainerData?.name}. Check your calendar.`,
              createdAt: serverTimestamp(),
              isRead: false,
              metadata: {
                trainerUid: params.trainer_uid,
                clientType: params.clientType,
                clients: params.clients,
                sessionUid: newSession.uid,
              },
            });

            await setDoc(trainerNotificationRef, {
              id: trainerNotificationRef.id,
              receiver: params?.trainer_uid,
              type: NotificationType.SESSION_SCHEDULED,
              message: `A new session has been scheduled with the pack ${packData?.name}`,
              createdAt: serverTimestamp(),
              isRead: false,
              metadata: {
                trainerUid: params.trainer_uid,
                clientType: params.clientType,
                clients: params.clients,
                sessionUid: newSession.uid,
              },
            });
          }
          // Handle the client type if the session if for a user
        } else if (params.clientType === ScheduledMeetingClientType.User) {
          // Claude work here
          const userScheduledEventRef = doc(
            collection(db, 'user_scheduled_events'),
          );
          const userScheduledEvent: UserScheduledEvent = {
            date: params.date,
            startTime: params.start_time,
            endTime: params.end_time,
            uid: userScheduledEventRef.id,
            user_uid: params.clients[0],
            type: 'Session',
            event_uid: newSession.uid,
            package_uid: params.package_uid,
          };

          transaction.set(userScheduledEventRef, userScheduledEvent);

          // Create notification for the user
          await setDoc(userNotificationRef, {
            id: userNotificationRef.id,
            receiver: params.clients[0],
            type: NotificationType.SESSION_SCHEDULED,
            message: `A new session has been scheduled with ${trainerData?.name}. Check your calendar.`,
            createdAt: serverTimestamp(),
            isRead: false,
            metadata: {
              trainerUid: params.trainer_uid,
              clientType: params.clientType,
              clients: params.clients,
              sessionUid: newSession.uid,
            },
          });

          // Create notification for the trainer
          await setDoc(trainerNotificationRef, {
            id: trainerNotificationRef.id,
            receiver: params?.trainer_uid,
            type: NotificationType.SESSION_SCHEDULED,
            message: `A new session has been scheduled with ${userData?.name}`,
            createdAt: serverTimestamp(),
            isRead: false,
            metadata: {
              trainerUid: params.trainer_uid,
              clientType: params.clientType,
              clients: params.clients,
              sessionUid: newSession.uid,
            },
          });
        }

        // 4. Update TrainerAvailability
        transaction.update(trainerAvailabilityDoc.ref, {
          isBooked: true,
          package_uid: params.package_uid,
          scheduled_meeting_uid: newSession.uid,
        });

        return newSession;
      });

      setLoading(false);
    } catch (err) {
      console.log(err)
      setError('Failed to schedule session');
      setLoading(false);
      throw err;
    }
  };

  return {scheduleSession, loading, error};
};
