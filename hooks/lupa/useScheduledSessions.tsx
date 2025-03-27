import {useMutation, useQuery} from '@tanstack/react-query';
import {
  collection,
  query,
  where,
  getDocs,
  QuerySnapshot,
  DocumentData,
  or,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import {db} from '../../services/firebase';
import {LupaUser, ScheduledMeeting, TrainerMetadata} from '../../types/user';
import queryClient from '../../react-query';
import {useEffect, useState} from 'react';

export type ScheduledSessionData = {
  session: ScheduledMeeting;
  clientsData: Array<{uid: string; name: string; picture: string}>;
  trainersData: {
    uid: string;
    name: string;
    homeGymData: TrainerMetadata['home_gym'];
  };
};

const useScheduledSessions = (userId: string) => {
  const getScheduledSessions = async (): Promise<ScheduledSessionData[]> => {
    try {
      const scheduledSessionsRef = collection(db, 'scheduled_sessions');
      // TODO: Mitigate returning scheduled based on a status
      const q = query(
        scheduledSessionsRef,
        or(
          where('clients', 'array-contains', userId),
          where('trainer_uid', '==', userId),
        ),
      );

      const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

      const scheduledSessions = await Promise.all(
        querySnapshot.docs.map(async doc => {
          const sessionData = doc.data() as ScheduledMeeting;
          const sessionClients = sessionData.clients;

          const clientsData = await Promise.all(
            sessionClients.map(async clientUid => {
              const clientQuery = query(
                collection(db, 'users'),
                where('uid', '==', clientUid),
              );
              const clientQueryDoc = await getDocs(clientQuery).then(
                docs => docs.docs[0].data() as LupaUser,
              );
              return {
                uid: clientQueryDoc.uid,
                name: clientQueryDoc.name,
                picture: clientQueryDoc.picture,
              };
            }),
          );

          const trainersQuery = query(
            collection(db, 'users'),
            where('uid', '==', sessionData.trainer_uid),
          );
          const trainersQueryDoc = await getDocs(trainersQuery).then(
            docs => docs.docs[0].data() as LupaUser,
          );

          const trainersMetadataQuery = query(
            collection(db, 'trainer_metadata'),
            where('user_uid', '==', sessionData.trainer_uid),
          );
          const trainerMetadataDoc = await getDocs(trainersMetadataQuery).then(
            docs => docs.docs[0].data() as TrainerMetadata,
          );

          return {
            session: sessionData,
            clientsData: clientsData,
            trainersData: {
              picture: trainersQueryDoc.picture,
              uid: trainersQueryDoc.uid,
              name: trainersQueryDoc.name,
              homeGymData: trainerMetadataDoc?.home_gym,
            },
          };
        }),
      );

      return scheduledSessions;
    } catch (error) {
      console.error('Error getting scheduled sessions:', error);
      throw error;
    }
  };

  return useQuery<ScheduledSessionData[], Error>({
    queryKey: ['use_scheduled_sessions', userId],
    queryFn: getScheduledSessions,
  });
};

export const useScheduledSessionWithListener = (sessionUid: string) => {
  const [scheduledSession, setScheduledSession] =
    useState<ScheduledSessionData | null>(null);

  useEffect(() => {
    const getScheduledSession = async (): Promise<void> => {
      try {
        const scheduledSessionRef = collection(db, 'scheduled_sessions');
        const q = query(scheduledSessionRef, where('uid', '==', sessionUid));

        const unsubscribe = onSnapshot(
          q,
          async (querySnapshot: QuerySnapshot<DocumentData>) => {
            if (!querySnapshot.empty) {
              const doc = querySnapshot.docs[0];
              const sessionData = doc.data() as ScheduledMeeting;
              const sessionClients = sessionData.clients;
              const clientsData = await Promise.all(
                sessionClients.map(async clientUid => {
                  const clientQuery = query(
                    collection(db, 'users'),
                    where('uid', '==', clientUid),
                  );
                  const clientQueryDoc = await getDocs(clientQuery).then(
                    docs => docs.docs[0].data() as LupaUser,
                  );
                  return {
                    uid: clientQueryDoc.uid,
                    name: clientQueryDoc.name,
                    picture: clientQueryDoc.picture,
                  };
                }),
              );
              const trainersQuery = query(
                collection(db, 'users'),
                where('uid', '==', sessionData.trainer_uid),
              );
              const trainersQueryDoc = await getDocs(trainersQuery).then(
                docs => docs.docs[0].data() as LupaUser,
              );
              const trainersMetadataQuery = query(
                collection(db, 'trainer_metadata'),
                where('user_uid', '==', sessionData.trainer_uid),
              );
              const trainerMetadataDoc = await getDocs(
                trainersMetadataQuery,
              ).then(docs => docs.docs[0].data() as TrainerMetadata);
              const session: ScheduledSessionData = {
                unsubscribe,
                session: sessionData,
                clientsData: clientsData.flat(),
                trainersData: {
                  picture: trainersQueryDoc.picture,
                  uid: trainersQueryDoc.uid,
                  name: trainersQueryDoc.name,
                  homeGymData: trainerMetadataDoc?.home_gym,
                  hourly_rate: trainerMetadataDoc?.hourly_rate,
                },
              };
              setScheduledSession(session);
            } else {
              setScheduledSession(null);
            }
          },
        );

        return () => unsubscribe();
      } catch (error) {
        console.error('Error getting scheduled session:', error);
        throw error;
      }
    };

    getScheduledSession();
  }, [sessionUid]);

  return useQuery<ScheduledSessionData | null, Error>({
    queryKey: ['use_scheduled_session', sessionUid],
    queryFn: () => scheduledSession,
    enabled: !!scheduledSession,
  });
};

export const useScheduledSessionsWithListener = (userId: string) => {
  const [scheduledSessions, setScheduledSessions] = useState<
    ScheduledSessionData[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const scheduledSessionsRef = collection(db, 'scheduled_sessions');
    const q = query(
      scheduledSessionsRef,
      or(
        where('clients', 'array-contains', userId),
        where('trainer_uid', '==', userId),
      ),
    );

    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot: QuerySnapshot<DocumentData>) => {
        try {
          const sessions = (await Promise.all(
            querySnapshot.docs.map(async doc => {
              if (!doc.exists()) {
                return null;
              }
              const sessionData = doc.data() as ScheduledMeeting;
              if (sessionData?.uid == null) {
                return null
              }

              const sessionClients = sessionData.clients;

              const clientsData = await Promise.all(
                sessionClients.map(async clientUid => {
                  const clientQuery = query(
                    collection(db, 'users'),
                    where('uid', '==', clientUid),
                  );
                  const clientQueryDoc = await getDocs(clientQuery).then(
                    docs => {
                      if (docs.size > 0 && docs.docs[0].exists()) {
                        return docs.docs[0].data() as LupaUser;
                      }
                      return null;
                    },
                  );
                  if (!clientQueryDoc) return null;
                  return {
                    uid: clientQueryDoc.uid,
                    name: clientQueryDoc.name,
                    picture: clientQueryDoc.picture,
                  };
                }),
              );

              // If any client is null, skip this session
              if (clientsData.some(client => client === null)) {
                return null;
              }

              const trainersQuery = query(
                collection(db, 'users'),
                where('uid', '==', sessionData.trainer_uid),
              );
              const trainersQueryDoc = await getDocs(trainersQuery).then(
                docs => {
                  if (docs.size > 0 && docs.docs[0].exists()) {
                    return docs.docs[0].data() as LupaUser;
                  } else {
                    return null;
                  }
                },
              );

              if (!trainersQueryDoc) return null;

              const trainersMetadataQuery = query(
                collection(db, 'trainer_metadata'),
                where('user_uid', '==', sessionData.trainer_uid),
              );
              const trainerMetadataDoc = await getDocs(
                trainersMetadataQuery,
              ).then(docs => {
                if (docs.size > 0 && docs.docs[0].exists()) {
                  return docs.docs[0].data() as TrainerMetadata;
                } else {
                  return null;
                }
              });

              if (!trainerMetadataDoc) return null;

              return {
                session: sessionData,
                clientsData: clientsData.filter(Boolean),
                trainersData: {
                  picture: trainersQueryDoc.picture,
                  uid: trainersQueryDoc.uid,
                  name: trainersQueryDoc.name,
                  homeGymData: trainerMetadataDoc.home_gym,
                  hourly_rate: trainerMetadataDoc.hourly_rate,
                },
              };
            }),
          )) as ScheduledSessionData[];

          // Filter out any null sessions
          const validSessions = sessions.filter(session => session !== null);

          setScheduledSessions(validSessions);
          setIsLoading(false);
        } catch (err) {
          console.error('Error processing scheduled sessions:', err);
          setError(
            err instanceof Error ? err : new Error('An unknown error occurred'),
          );
          setIsLoading(false);
        }
      },
      err => {
        console.error('Error getting scheduled sessions:', err);
        setError(err);
        setIsLoading(false);
      },
    );

    // Cleanup function to unsubscribe from the listener when the component unmounts
    return () => unsubscribe();
  }, [userId]);

  return {scheduledSessions, isLoading, error};
};

const useScheduledMeetingWithUpdate = (meetingId: string | null) => {
  // Fetch the scheduled meeting
  // TODO: Update to fetch trainer and clients data (see above hook)
  // TODO: Fix doc lookup
  const fetchMeeting = async (): Promise<ScheduledMeeting | undefined> => {
    const meetingRef = doc(db, 'scheduled_sessions', meetingId);
    const meetingSnap = await getDoc(meetingRef);
    if (meetingSnap.exists()) {
      return meetingSnap.data() as ScheduledMeeting;
    }
    return undefined;
  };

  const {
    data: meeting,
    isLoading,
    error,
  } = useQuery<ScheduledMeeting | undefined, Error>({
    queryKey: ['use_schedule_meeting_with_update', meetingId],
    queryFn: fetchMeeting,
    enabled: !!meetingId
  });

  // Update a field in the scheduled meeting
  const updateMeetingField = async (
    field: keyof ScheduledMeeting,
    value: any,
    meetingIdIn: string,
  ): Promise<void> => {
    const scheduledSessionCollection = collection(db, 'scheduled_sessions');
    const scheduledSessionQuery = query(
      scheduledSessionCollection,
      where('uid', '==', meetingIdIn),
    );
    const scheduledSessionDocRef = await getDocs(scheduledSessionQuery).then(
      docs => docs.docs[0].ref,
    );
    await updateDoc(scheduledSessionDocRef, {[field]: value});
    await queryClient.invalidateQueries({
      queryKey: ['use_schedule_meeting_with_update', meetingIdIn],
    });
  };

  const useMutationResult = useMutation<
    void,
    Error,
    {field: keyof ScheduledMeeting; value: any; meetingIdIn: string}
  >({
    mutationFn: ({field, value, meetingIdIn}) =>
      updateMeetingField(field, value, meetingIdIn),
    mutationKey: ['update_meeting_key'],
  });

  return {
    meeting,
    isLoading: isLoading || useMutationResult.isPending,
    error: error || useMutationResult.error,
    updateMeetingField: useMutationResult.mutateAsync,
    isUpdating: useMutationResult.isPending,
    updateError: useMutationResult.error,
  };
};

export {useScheduledMeetingWithUpdate};
export default useScheduledSessions;
