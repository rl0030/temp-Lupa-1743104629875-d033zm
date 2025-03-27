import {useMutation} from '@tanstack/react-query';
import {
  addDoc,
  collection,
  getDoc,
  doc,
  serverTimestamp,
  setDoc,
  arrayUnion,
  updateDoc,
} from 'firebase/firestore';
import {db} from '../../../services/firebase';
import {Pack, ScheduledMeeting} from '../../../types/user';
import {UID} from '../../../types/common';
import { getUser } from '../../../api';

interface Notification {
  receiver: string;
  type: 'SESSION_COMPLETED' | 'SESSION_SCHEDULED' | 'SESSION_INVITE'
  message: string;
  metadata: Object;
}

interface SessionInvite {
  receiver: string;
  sender: string;
  sessionId: string;
  message: string;
  metadata?: Object;
}

const useCreateNotifications = () => {
  const createNotification = async (notification: Notification) => {
    const notificationRef = doc(collection(db, 'notifications'));
    await setDoc(notificationRef, {
      id: notificationRef.id,
      ...notification,
      createdAt: serverTimestamp(),
      isRead: false,
    });
  };

  const createSessionInviteNotification = useMutation({
    mutationFn: async (invite: SessionInvite) => {
      const notificationRef = doc(collection(db, 'notifications'));
      await setDoc(notificationRef, {
        id: notificationRef.id,
        receiver: invite.receiver,
        sender: invite.sender,
        type: 'SESSION_INVITE',
        message: invite.message,
        sessionId: invite.sessionId,
        createdAt: serverTimestamp(),
        isRead: false,
        metadata: {
          ...invite,
          ...invite?.metadata
        }
       
      });
    
    },
  });

  const createSessionCompletedNotifications = useMutation({
    mutationFn: async (meetingUid: string) => {

      // Fetch the scheduled meeting document
      const meetingRef = doc(db, 'scheduled_sessions', meetingUid);
      const meetingDoc = await getDoc(meetingRef);
      if (!meetingDoc.exists()) {
        throw new Error('Scheduled meeting not found');
      }
      const meeting = meetingDoc.data() as ScheduledMeeting;

      // TODO: Refactor for packs
      const trainer = await getUser(meeting?.trainer_uid)
      const client = await getUser(meeting?.clients[0])

      // Create notification for the user
      await createNotification({
        receiver: meeting.clients[0],
        type: 'SESSION_COMPLETED',
        message: `Your session with ${trainer?.name} been completed.`,
        metadata: {
          ...meeting,
          trainerUid: meeting?.trainer_uid
        }
      });

      // Create notification for the trainer
      await createNotification({
        receiver: meeting.trainer_uid,
        type: 'SESSION_COMPLETED',
        message: `The session with ${client?.name} has been completed.`,
        metadata: {
          ...meeting,
          trainerUid: meeting?.trainer_uid
        }
      });
    },
  });

  const createSessionScheduledNotifications = useMutation({
    mutationFn: async (newMeeting: ScheduledMeeting) => {
      // TODO: Refactor for packs
      const trainer = await getUser(newMeeting?.trainer_uid)
      const client = await getUser(newMeeting?.clients[0])

      // Create notification for the user
      await createNotification({
        receiver: newMeeting.clients[0],
        type: 'SESSION_SCHEDULED',
        message: `Your session with ${trainer?.name} been completed.`,
        metadata: {
          ...newMeeting,
          trainerUid: newMeeting?.trainer_uid
        }
      });

      // Create notification for the trainer
      await createNotification({
        receiver: newMeeting.trainer_uid,
        type: 'SESSION_SCHEDULED',
        message: `The session with ${client?.name} has been scheduled.`,
        metadata: {
          ...newMeeting,
          trainerUid: newMeeting?.trainer_uid
        }
      });
    },
  });

  interface PackInvite {
    sender: string;
    packUid: string;
    userUids: Array<UID>;
    message: string;
  }

  const createPackInviteNotifications = useMutation({
    mutationFn: async (invite: PackInvite) => {
      const packRef = doc(db, 'packs', invite.packUid);
      const packDocSnapshot = await getDoc(packRef);
      const packData: Pack = packDocSnapshot.data() as Pack;

      // Filter out users that are already invited or are already a member.
      const invitedUsers = invite.userUids.filter(
        uid => !packData.members.includes(uid),
      );

      await updateDoc(packRef, {
        pending_invites: arrayUnion(...invitedUsers),
      });

      // Create notifications for the invited users
      const notificationPromises = invitedUsers.map(async userId => {
        const notificationRef = doc(collection(db, 'notifications'));
        await setDoc(notificationRef, {
          id: notificationRef.id,
          receiver: userId,
          sender: invite.sender,
          type: 'PACK_INVITE',
          message: invite.message,
          metadata: {
            packUid: invite.packUid,
            invitedUsers: invite.userUids
          },
          packUid: invite.packUid,
          createdAt: serverTimestamp(),
          isRead: false,
        });
      });

      await Promise.all(notificationPromises);
    },
  });

  return {
    createPackInviteNotifications,
    createSessionInviteNotification,
    createSessionCompletedNotifications,
    createSessionScheduledNotifications,
  };
};

export default useCreateNotifications;
