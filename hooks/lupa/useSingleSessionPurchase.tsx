import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {useState} from 'react';
import {db} from '../../services/firebase';
import {
  PackScheduledEvent,
  ScheduledMeeting,
  ScheduledMeetingClientType,
  TrainerMetadata,
  UserScheduledEvent,
} from '../../types/user';
import uuid from 'react-native-uuid';
import {useMutation, useQuery} from '@tanstack/react-query';
import {push, ref, update} from 'firebase/database';
import {realtime_db} from '../../services/firebase/realtime_database';
import { getPack, getUser } from '../../api';

type PurchaseSingleSessionVariables = {
  userId: string;
  availabilityUid: string;
  clientType: ScheduledMeetingClientType;
};

const useSingleSessionPurchase = () => {
  const purchaseSingleSession = async (
    userId: string,
    availabilityUid: string,
    clientType: ScheduledMeetingClientType,
  ) => {
    try {
      // Query the trainer_availability collection for the availability slot
      const availabilityCollectionRef = collection(db, 'trainer_availability');
      const availabilityQuery = query(
        availabilityCollectionRef,
        where('uid', '==', availabilityUid),
      );
      const availabilityDocsSnapshot = await getDocs(availabilityQuery);

      if (availabilityDocsSnapshot.empty) {
        throw new Error('Session is no longer available');
      }

      const availabilityDoc = availabilityDocsSnapshot.docs[0];

      // Obtain the availability slot data
      const {
        date,
        startTime,
        endTime,
        price,
        trainer_uid,
        uid: availability_uid,
      } = availabilityDoc.data();

      // Create a new document in the scheduled_sessions collection
      // The new scheduled session
      const scheduledSessionsRef = doc(collection(db, 'scheduled_sessions'));

      const newScheduledSession: ScheduledMeeting = {
        uid: null,
        trainer_uid,
        clients: [userId],
        start_time: startTime,
        end_time: endTime,
        date,
        status: 'scheduled',
        programs: [],
        package_uid: null,
        availability_uid,
        price: null,
        session_note: '',
        clientType: ScheduledMeetingClientType.User,
      };

      setDoc(scheduledSessionsRef, {
        ...newScheduledSession,
        id: scheduledSessionsRef.id,
        uid: scheduledSessionsRef.id,
      });

      addDoc(collection(db, 'scheduled_sessions'), newScheduledSession);

      // Update the trainer_availability document
      const availabilitySlotDocRef = doc(
        db,
        'trainer_availability',
        availabilityDoc.id,
      );
      updateDoc(availabilitySlotDocRef, {
        isBooked: true,
        scheduled_meeting_uid: newScheduledSession.uid,
      });

      // TODO: Check the trainer metadata document to see if the user is already a client.
      // If not add the user as a client as the `userId`
      const trainerMetadataCollectionRef = collection(db, 'trainer_metadata');
      const trainerMetadataQuery = query(
        trainerMetadataCollectionRef,
        where('user_uid', '==', trainer_uid),
      );
      const trainerMetadataDocsSnapshot = await getDocs(trainerMetadataQuery);

      if (!trainerMetadataDocsSnapshot.empty) {
        const trainerMetadataDocRef = trainerMetadataDocsSnapshot.docs[0].ref;
        const trainerMetadata =
          trainerMetadataDocsSnapshot.docs[0].data() as TrainerMetadata;

        if (!trainerMetadata.clients.find((client => client?.data?.uid == userId))) {
          // User is not a client, add them to the clients array
          await updateDoc(trainerMetadataDocRef, {
            clients: arrayUnion({
              type: clientType,
              data: clientType === ScheduledMeetingClientType.Pack ? await getPack(userId) : await getUser(userId),
              programs: []
            }),
          });
        }
      }

      if (clientType === ScheduledMeetingClientType.User) {
        // Update the user's scheduled events
        const userScheduledEventRef = doc(
          collection(db, 'user_scheduled_events'),
        );
        const userScheduledEvent: UserScheduledEvent = {
          uid: userScheduledEventRef.id,
          date,
          startTime,
          endTime,
          user_uid: userId,
          package_uid: null,
          event_uid: scheduledSessionsRef.id,
          type: 'Session',
        };
        await setDoc(userScheduledEventRef, userScheduledEvent);

        // Send a message from the trainer's account to the user's account
        const currentUserRef = ref(
          realtime_db,
          `privateChats/${trainer_uid}/${userId}`,
        );
        const otherUserRef = ref(
          realtime_db,
          `privateChats/${userId}/${trainer_uid}`,
        );
        const newMessageData = {
          text: 'Thank you for making an appointment with me.',
          timestamp: Date.now(),
          sender: trainer_uid,
        };
        push(currentUserRef, newMessageData);
        push(otherUserRef, newMessageData);
        const conversationUpdates = {
          [`conversations/${trainer_uid}/${userId}/lastMessage`]:
            newMessageData,
          [`conversations/${userId}/${trainer_uid}/lastMessage`]:
            newMessageData,
        };
        update(ref(realtime_db), conversationUpdates);
      } else if (clientType === ScheduledMeetingClientType.Pack) {
        // Get the pack document
        const packRef = doc(db, 'packs', userId);
        const packDoc = await getDoc(packRef);
        const packDocData = packDoc.data();

        // Create scheduled event for each pack member
        for (const member of packDocData?.members) {
          const memberScheduledEventRef = doc(
            collection(db, 'user_scheduled_events'),
          );
          const memberScheduledEvent: UserScheduledEvent = {
            uid: memberScheduledEventRef.id,
            date,
            startTime,
            endTime,
            user_uid: member,
            package_uid: null,
            event_uid: scheduledSessionsRef.id,
            type: 'Session',
          };
          await setDoc(memberScheduledEventRef, memberScheduledEvent);
        }

        // Send a message to the pack chat
        const packChatRef = ref(realtime_db, `packChats/${packDoc.id}`);
        const newMessageData = {
          text: 'Thank you for purchasing my package. Lets get your sessions scheduled.',
          timestamp: Date.now(),
          sender: trainer_uid,
        };
        push(packChatRef, newMessageData).then(() => {
          // Update the last message in the pack conversation
          const packConversationRef = ref(
            realtime_db,
            `packConversations/${trainer_uid}/${packDoc.id}/lastMessage`
          );
          update(packConversationRef, newMessageData);
        });
      
      }

      // Create notifications for the user and trainer
      // Create and set user notification
      const notificationRef = doc(collection(db, 'notifications'));
      // Create and set trainer notification
      await setDoc(notificationRef, {
        id: notificationRef.id,
        receiver: trainer_uid,
        type: 'SESSION_SCHEDULED',
        title: 'Session Notification',
        message: 'A new session has been scheduled. Check your calendar',
        createdAt: serverTimestamp(),
        isRead: false,
      });

      // If the client type is Pack, create notifications for each pack member
      if (clientType === ScheduledMeetingClientType.Pack) {
        const packRef = doc(db, 'packs', userId);
        const packDoc = await getDoc(packRef);
        const packDocData = packDoc.data();

        // Create notifications for each pack member
        for (const member of packDocData?.members) {
          const packMemberNotificationRef = doc(
            collection(db, 'notifications'),
          );
          await setDoc(packMemberNotificationRef, {
            id: packMemberNotificationRef.id,
            receiver: member,
            type: 'SESSION_SCHEDULED',
            title: 'Session Notification',
            message:
              'A new session has been scheduled for your pack. Check your calendar.',
            createdAt: serverTimestamp(),
            isRead: false,
          });
        }
      } else if (clientType === ScheduledMeetingClientType.User) {
        await setDoc(notificationRef, {
          id: notificationRef.id,
          receiver: userId,
          type: 'SESSION_SCHEDULED',
          title: 'Session Notification',
          message: 'Your session has been scheduled. Check your calendar.',
          createdAt: serverTimestamp(),
          isRead: false,
        });
      }
    } catch (error) {
      throw error;
    }
  };

  return useMutation<any, Error, PurchaseSingleSessionVariables>({
    mutationFn: ({userId, availabilityUid, clientType}) =>
      purchaseSingleSession(userId, availabilityUid, clientType),
    mutationKey: ['purchase_single_session'],
    retry: false,
  });
};

export default useSingleSessionPurchase;
