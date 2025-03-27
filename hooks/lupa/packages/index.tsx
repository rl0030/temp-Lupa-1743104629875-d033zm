import {useState, useEffect} from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  runTransaction,
  increment,
  query,
  where,
  getDocs,
  Timestamp,
  orderBy,
  limit,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  DocumentData,
  QuerySnapshot,
  deleteDoc,
  arrayRemove,
} from 'firebase/firestore';
import {db} from '../../../services/firebase';
import {
  LupaUser,
  Pack,
  PurchasedSessionPackage,
  ScheduledMeeting,
  ScheduledMeetingClientType,
  UserScheduledEvent,
} from '../../../types/user';
import {useQuery} from '@tanstack/react-query';
import {NotificationType} from '../../../types/notifications';
import {getUser, getUsers} from '../../../api';
import uuid from 'react-native-uuid';
import { SessionPackageType } from '../sessions/useSessionPackagePurchase';

export const useRemainingPackageSessions = (
  packageUid: string,
  clientUid: string,
) => {
  const [remainingSessions, setRemainingSessions] = useState<number | null>(
    null,
  );
  const [totalSessions, setTotalSessions] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRemainingSessions = async () => {
      try {
        const purchasedPackageRef = collection(db, 'purchased_packages');
        const packageQuery = query(
          purchasedPackageRef,
          where('uid', '==', packageUid),
          where('client', '==', clientUid),
        );

        const packageSnapshot = await getDocs(packageQuery);
        if (packageSnapshot.empty) {
          setError('Package not found');
          setLoading(false);
          return;
        }

        const packageData =
          packageSnapshot.docs[0].data() as PurchasedSessionPackage;

        const scheduledSessionsRef = collection(db, 'scheduled_sessions');
        const sessionsQuery = query(
          scheduledSessionsRef,
          where('package_uid', '==', packageUid),
          where('clients', 'array-contains', clientUid),
          where('status', 'in', ['scheduled', 'completed']),
        );

        const sessionsSnapshot = await getDocs(sessionsQuery);
        const completedSessions = sessionsSnapshot.docs.length;

        setRemainingSessions(packageData.num_sessions - completedSessions);
        setTotalSessions(packageData.num_sessions);
        setLoading(false);
      } catch (err) {
        setError('Error fetching remaining sessions');
        setLoading(false);
      }
    };

    fetchRemainingSessions();
  }, [packageUid, clientUid]);

  return {remainingSessions, totalSessions, loading, error};
};

export const useCurrentPackageSession = (
  packageUid: string,
  clientUid: string,
) => {
  const [currentSession, setCurrentSession] = useState<ScheduledMeeting | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentSession = async () => {
      try {
        const now = Timestamp.now();
        const scheduledSessionsRef = collection(db, 'scheduled_sessions');
        const sessionsQuery = query(
          scheduledSessionsRef,
          where('package_uid', '==', packageUid),
          where('clients', 'array-contains', clientUid),
          where('status', '==', 'scheduled'),
          where('start_time', '>=', now),
          orderBy('start_time'),
          limit(1),
        );

        const sessionsSnapshot = await getDocs(sessionsQuery);
        if (!sessionsSnapshot.empty) {
          setCurrentSession(
            sessionsSnapshot.docs[0].data() as ScheduledMeeting,
          );
        } else {
          setCurrentSession(null);
        }
        setLoading(false);
      } catch (err) {
        setError('Error fetching current session');
        setLoading(false);
      }
    };

    fetchCurrentSession();
  }, [packageUid, clientUid]);

  return {currentSession, loading, error};
};

interface IPackClientData extends Omit<Pack, 'members'> {
   members: LupaUser[]
}

interface IUserClientData extends LupaUser {

}
interface ClientData {
  type: string;
  data: IPackClientData | IUserClientData;
}


interface ClientWithPendingSessions {
  clientData: ClientData;
  packageUid: string;
  packageName: string;
  remainingSessions: number;
  packageType: SessionPackageType;
}

export const useTrainerClientsWithPendingSessions = (trainerUid: string) => {
  const [clients, setClients] = useState<ClientWithPendingSessions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClientsWithPendingSessions = async () => {
    setLoading(true);
    setError(null);

    try {
      const packagesRef = collection(db, 'purchased_packages');
      const packagesQuery = query(
        packagesRef,
        where('trainer_uid', '==', trainerUid),
        where('status', '==', 'incomplete'),
      );

      const packagesSnapshot = await getDocs(packagesQuery);
      const clientsWithPendingSessions: ClientWithPendingSessions[] = [];

      for (const packageDoc of packagesSnapshot.docs) {
        const packageData = packageDoc.data() as PurchasedSessionPackage;

        const sessionsRef = collection(db, 'scheduled_sessions');
        const sessionsQuery = query(
          sessionsRef,
          where('package_uid', '==', packageData.uid),
          where('status', 'in', ['scheduled', 'completed']),
        );

        const sessionsSnapshot = await getDocs(sessionsQuery);
        const completedSessions = sessionsSnapshot.docs.length;
        const remainingSessions =
          packageData.num_sessions - completedSessions;

        if (remainingSessions > 0) {
          // Fetch client data
          let clientData: ClientData | null = null;

          // Try to fetch from users collection
          const usersRef = collection(db, 'users');
          const userQuery = query(
            usersRef,
            where('uid', '==', packageData.client),
          );
          const userSnapshot = await getDocs(userQuery);

          if (!userSnapshot.empty) {
            const userData = userSnapshot.docs[0].data();
            clientData = {
              id: userSnapshot.docs[0].id,
              ...userData,
              type: 'user',
            };
          } else {
            // If not found in users, try to fetch from packs collection
            const packRef = doc(db, 'packs', packageData.client);
            const packSnapshot = await getDoc(packRef);
            

            if (packSnapshot.exists()) {
              const packData: Pack = packSnapshot.data() as Pack
              const packMembers: LupaUser[] = getUsers(packData.members)
              clientData = {
                id: packSnapshot.id,
                type: 'pack',
                ...{...packData, members: packMembers},
              };
            }
          }

          if (clientData) {
            clientsWithPendingSessions.push({
              clientData,
              packageUid: packageData.uid,
              packageName: packageData.name,
              packageType: packageData.packageType,
              remainingSessions,
            });
          }
        }
      }

      setClients(clientsWithPendingSessions);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching clients with pending sessions:', err);
      setError('Failed to fetch clients with pending sessions');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientsWithPendingSessions();
  }, [trainerUid]);

  const refresh = () => {
    fetchClientsWithPendingSessions();
  };

  return { clients, loading, error, refresh };
};

export type UID = string;

export type SessionPackage = {
  name: string;
  num_sessions: number;
  status: 'complete' | 'incomplete';
  scheduled_meeting_uids: Array<UID>;
};

const fetchPackages = async (): Promise<SessionPackage[]> => {
  const packagesRef = collection(db, 'packages');
  const packagesSnapshot: QuerySnapshot<DocumentData> = await getDocs(
    packagesRef,
  );
  return packagesSnapshot.docs.map(doc => ({
    id: doc.id,
    uid: doc.uid,
    name: doc.data().name,
    num_sessions: doc.data().num_sessions,
    status: doc.data().status,
    scheduled_meeting_uids: doc.data().scheduled_meeting_uids,
  }));
};

export const usePackages = () => {
  return useQuery<SessionPackage[], Error>({
    queryKey: ['packages'],
    queryFn: fetchPackages,
    retry: false,
  });
};

const fetchPackPrograms = async (): Promise<SessionPackage[]> => {
  const packProgramsRef = collection(db, 'pack_programs');
  const packProgramsSnapshot: QuerySnapshot<DocumentData> = await getDocs(
    packProgramsRef,
  );
  return packProgramsSnapshot.docs.map(doc => ({
    id: doc.id,
    uid: doc.uid,
    name: doc.data().name,
    num_sessions: doc.data().num_sessions,
    status: doc.data().status,
    scheduled_meeting_uids: doc.data().scheduled_meeting_uids,
  }));
};

export const usePackPrograms = () => {
  return useQuery<SessionPackage[], Error>({
    queryKey: ['use_pack_programs'],
    queryFn: fetchPackPrograms,
    retry: false,
  });
};

// Session Invite
export interface SessionInviteParams {
  trainer_uid: string;
  clients: Array<UID>;
  clientType: ScheduledMeetingClientType;
  start_time: Date;
  end_time: Date;
  date: Date;
  package_uid: UID | null;
  availability_uid: UID;
  session_note: string;
  packageType: SessionPackageType;
}

export const useSendSessionInvite = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendSessionInvite = async (params: SessionInviteParams) => {
    setLoading(true);
    setError(null);

    try {
      const {
        availability_uid,
        session_note,
        trainer_uid,
        clients,
        start_time,
        end_time,
        date,
        package_uid,
        clientType,
        packageType
      } = params;

      const trainerData = await getUser(trainer_uid);
      const userData = await getUser(clients[0]);
      const packData = await (
        await getDoc(doc(db, 'packs', clients[0]))
      ).data();

      // Create notification for the user
      if (clientType === ScheduledMeetingClientType.User) {
        const userNotificationRef = doc(collection(db, 'notifications'));
        await setDoc(userNotificationRef, {
          id: userNotificationRef.id,
          receiver: clients[0],
          type: NotificationType.USER_SESSION_PACKAGE_INVITE,
          message: `${trainerData?.name} has invited you to join a training session.`,
          createdAt: serverTimestamp(),
          isRead: false,
          metadata: {
            trainer_uid,
            clients,
            clientType,
            start_time,
            end_time,
            date,
            package_uid,
            availability_uid,
            session_note,
            packageType
          } as SessionInviteParams,
        });
      } else if (clientType === ScheduledMeetingClientType.Pack) {
        for (const uid of packData?.members) {
          const userNotificationRef = doc(collection(db, 'notifications'));
          await setDoc(userNotificationRef, {
            id: userNotificationRef.id,
            receiver: uid,
            type: NotificationType.USER_SESSION_PACKAGE_INVITE,
            message: `${trainerData?.name} has invited you to join a training session.`,
            createdAt: serverTimestamp(),
            isRead: false,
            metadata: {
              trainer_uid,
              clients,
              clientType,
              start_time,
              end_time,
              date,
              package_uid,
              packageType
            } as SessionInviteParams,
          });
        }
      }

      setLoading(false);
    } catch (err) {
      setError('Failed to send session invite');
      setLoading(false);
      throw err;
    }
  };

  return {sendSessionInvite, loading, error};
};

export const useCancelSession = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelSession = async (sessionData: {
    uid: string;
    availability_uid: string;
    package_uid: string;
    trainer_uid: string;
    clients: string[];
  }) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Delete the scheduled session document
      await deleteDoc(doc(db, 'scheduled_sessions', sessionData.uid))

      // 2. Update the trainer availability document
      const trainerAvailabilityQuery = query(
        collection(db, 'trainer_availability'),
        where('uid', '==', sessionData.availability_uid),
      );
      const trainerAvailabilitySnapshot = await getDocs(
        trainerAvailabilityQuery,
      );
      if (!trainerAvailabilitySnapshot.empty) {
        const trainerAvailabilityRef = trainerAvailabilitySnapshot.docs[0].ref;
        await updateDoc(trainerAvailabilityRef, {
          isBooked: false,
          package_uid: null,
          scheduled_meeting_uid: null,
        });
      }

      // 3. Remove the session UID from the purchased package document
      const packageRef = doc(db, 'purchased_packages', sessionData.package_uid);
      const packageDoc = await getDoc(packageRef);
      const currentScheduledMeetings =
        packageDoc.data()?.scheduled_meeting_uids || [];
      await updateDoc(packageRef, {
        scheduled_meeting_uids: arrayRemove(sessionData.uid),
      });

      setLoading(false);
    } catch (err) {
      console.log(err)
      setError('Failed to cancel session');
      setLoading(false);
      throw err;
    }
  };

  return {cancelSession, loading, error};
};
