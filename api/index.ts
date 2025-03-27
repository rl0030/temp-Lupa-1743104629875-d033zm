// Note: Collections using id as uid: SessionPackages, purchased packages, and Packs, UserScheduledEvents and PackScheduledEvents

import {
  GeoPoint,
  Timestamp,
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  getDoc,
  getDocs,
  query,
  runTransaction,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  limit,
  DocumentData,
} from 'firebase/firestore';
import app, {auth, db} from '../services/firebase';
import {Auth, createUserWithEmailAndPassword} from '@firebase/auth';
import {
  ClientProgram,
  LupaUser,
  Pack,
  PackScheduledEvent,
  ScheduledMeeting,
  ScheduledMeetingClientType,
  SessionPackage,
  Studio,
  TrainerAvailability,
  TrainerMetadata,
  UserScheduledEvent,
} from '../types/user';
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
  uploadString,
} from '@firebase/storage';
import {ensureBase64ImageString} from '../util/media';
import {Persona} from '../constant/persona';
import getLocation, {getGeoBounds} from '../util/location';
import {Program, ProgramDetailsWithTrainerName} from '../types/program';
import {UID} from '../types/common';
import queryClient from '../react-query';
import {Alert} from 'react-native';
import {MessageType, sendPackMessage} from '../util/messages';
import useCreateNotifications from '../hooks/lupa/notifications/useManagedNotifications';
import {updateUserDocumentWithFCMToken} from '../pages/Lupa';
import { FirebaseDatabaseTypes } from '../types/firebase';

// Firebase error codes
// See https://firebase.google.com/docs/reference/js/auth?hl=es-419#autherrorcodes

export const checkExternalInvitations = async (
  email: string,
  phone: string,
) => {
  const packsRef = collection(db, FirebaseDatabaseTypes.LupaCollections.PACKS);
  const q = query(
    packsRef,
    where('externalInvites', 'array-contains', {email, status: 'pending'}),
    where('externalInvites', 'array-contains', {phone, status: 'pending'}),
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => ({
    packId: doc.id,
    packName: doc.data().name,
  }));
};

async function createUser(
  email: string,
  password: string,
  authInstance: Auth = auth,
): Promise<string | undefined> {
  try {
    // Create the user
    const userCredential = await createUserWithEmailAndPassword(
      authInstance,
      email,
      password,
    );

    const newUserUid = userCredential.user.uid;
    console.debug(`New user uid: `, newUserUid)
    return JSON.stringify(userCredential.user.toJSON());
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}
async function listUsers(): Promise<Array<LupaUser>> {
  try {
    const usersCollection = collection(db, FirebaseDatabaseTypes.LupaCollections.USERS);
    const usersSnapshot = await getDocs(usersCollection);
    const users = usersSnapshot.docs.map(doc => { 
      const data = doc.data();
      return {
      id: doc.data(),
      ...data
      }
    }) 
    return users as unknown as Array<LupaUser>
  } catch (error) {
    throw error;
  }
}

const queryExternalInvites = async (user: LupaUser) => {
  const packsRef = collection(db, FirebaseDatabaseTypes.LupaCollections.USERS);

  // Query for email
  const emailQuery = query(
    packsRef,
    where('externalInvites', 'array-contains', {
      email: user.email.toLowerCase(),
      status: 'pending',
    }),
  );

  // Query for phone
  const phoneQuery = query(
    packsRef,
    where('externalInvites', 'array-contains', {
      phone: user.number.toLowerCase(),
      status: 'pending',
    }),
  );

  // Execute both queries
  const [emailResults, phoneResults] = await Promise.all([
    getDocs(emailQuery),
    getDocs(phoneQuery),
  ]);

  // Combine and deduplicate results
  const resultMap = new Map();

  emailResults.forEach(doc => {
    resultMap.set(doc.id, doc.data());
  });

  phoneResults.forEach(doc => {
    resultMap.set(doc.id, doc.data());
  });

  // Convert map back to array
  const combinedResults = Array.from(resultMap.values());

  return combinedResults;
};

async function putUser(
  user: LupaUser,
  trainerMetadata?: TrainerMetadata | null,
): Promise<string | undefined> {
  try {
    console.log('A')
    const usersCollection = collection(db, 'users');
    const trainerMetadataCollection = collection(db, 'trainer_metadata');
    const trainerCertificationCollection = collection(db, 'certifications');
    const storage = getStorage();
    
    console.log('b')
    // Create a reference to the location where the image will be stored
    const imageRef = ref(storage, `${user.uid}/assets/index.png`);
    console.log('c')
    
    // Convert the base64 image to a Blob
    const base64Data = ensureBase64ImageString(user.picture);
    console.log('d')
    if (!base64Data) {
      throw new Error('Invalid base64 image data');
    }
    
    // Remove the data URL prefix if present
    const base64Image = base64Data.split(',')[1];
    console.log('e')
    
    // Create a Blob from the base64 image data
    const blob = await fetch(`data:image/png;base64,${base64Image}`).then(res =>
      res.blob(),
    );
    console.log('f')
    
    // Upload the Blob
    await uploadBytes(imageRef, blob);
    // Get the download URL of the uploaded image
    const downloadURL = await getDownloadURL(imageRef);
    console.log('g')
    
    const updatedUser = {...user, picture: downloadURL};
    console.log('h')
    
    // Important: Set the user document with the user's UID as the document ID
    const userDocRef = doc(usersCollection, user.uid);
    await setDoc(userDocRef, updatedUser);
    console.log('i')

    if (updatedUser.role === 'trainer' && trainerMetadata) {
      // Set trainer metadata with user's UID as document ID
      const trainerMetadataDocRef = doc(trainerMetadataCollection, user.uid);
      await setDoc(trainerMetadataDocRef, {
        ...trainerMetadata,
        id: user.uid,
        uid: user.uid, // Ensure UID is set in the metadata
        user_uid: user.uid // Ensure user_uid is set in the metadata
      });

      // Set certification document with user's UID as document ID
      const certificationDocRef = doc(trainerCertificationCollection, user.uid);
      await setDoc(certificationDocRef, {
        id: user.uid, // Use user's UID as the certification ID
        organization: null,
        is_verified: false,
        is_checked: true,
        user_uid: user.uid // Add user_uid to certification document
      });
    }
    console.log('j')
    
    // Perform a check for external invitations (packs)
    const packs = await queryExternalInvites(user);
    console.log('k')
    
    for (const packDoc of packs) {
      const packId = packDoc.id;
      const packData = packDoc.data() as Pack;

      // Create notification for the new user
      const notificationRef = doc(collection(db, 'notifications'));
      await setDoc(notificationRef, {
        id: notificationRef.id,
        receiver: user.uid,
        sender: packData.owner,
        type: 'PACK_INVITE',
        message: `You've been invited to join the pack: ${packData.name}`,
        metadata: {
          packUid: packId,
          invitedUsers: [user.uid],
        },
        packUid: packId,
        createdAt: serverTimestamp(),
        isRead: false,
      });
    }
    console.log('l')
    
    return user.uid; // Return the user's UID instead of the auto-generated doc ID
  } catch (error) {
    console.log(error);
    throw error;
  }
}

const saveProgram = async (program: Program): Promise<string> => {
  try {
    if (!auth.currentUser) {
      throw new Error('User is not authenticated');
    }

    const programsCollection = collection(db, 'programs');
    let docRef;

    if (program?.program) {
      // Program already exists, update it
      docRef = doc(programsCollection, program?.program.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // Update existing document
        await updateDoc(docRef, {
          ...program?.program,
          metadata: {
            ...program?.program?.metadata,
            is_published: false,
          },
        });
        console.debug('Existing program updated in Firestore successfully!');
      } else {
        // Document with this UID doesn't exist, create a new one
        await setDoc(docRef, {
          ...program,
          metadata: {
            ...program.metadata,
            is_published: false,
          },
        });
        console.debug('New program created in Firestore successfully!');
      }
    } else {
      // Create a new document with a generated id
      docRef = doc(programsCollection);
      await setDoc(docRef, {
        ...program,
        uid: docRef.id,
        metadata: {
          ...program.metadata,
          is_published: false,
        },
      });
      console.debug('New program created in Firestore successfully!');
    }

    return docRef.id;
  } catch (error) {
    console.error('Error saving program to Firestore:', error);
    throw error;
  }
};

const checkOnboardingStatus = async (userId: string) => {
  const usersCollectionRef = collection(db, 'users');
  const userQuery = query(usersCollectionRef, where('uid', '==', userId));
  const userQuerySnapshot = await getDocs(userQuery);

  if (!userQuerySnapshot.empty) {
    const userDoc = userQuerySnapshot.docs[0];
    const userData = userDoc.data();
    return userData.is_onboarding_completed;
  } else {
    return false;
  }
};

export const getStudio = async (uid: string): Promise<Studio | null> => {
  const usersCollectionRef = doc(collection(db, 'studios'), uid);
  const docRef = await getDoc(usersCollectionRef);

  const docdata = {...docRef.data(), id: docRef.id} as Studio;

  return docRef;
};

const getUser = async (uid: string): Promise<LupaUser> => {
  try {
    const usersCollectionRef = collection(db, 'users');
    const userQuery = query(usersCollectionRef, where('uid', '==', uid), limit(1));
    const userQuerySnapshot = await getDocs(userQuery);

    if (!userQuerySnapshot.empty) {
      const userDoc = userQuerySnapshot.docs[0];
      const userData = {id: userDoc.id, ...userDoc.data()};
      return userData as LupaUser & {id: string};
    }
  } catch (error) {
    throw error;
  }

  throw "getUser: Unable to find Lupa User: ${uid}"
};

export const getUsers = async (
  uids: Array<String>,
): Promise<Array<LupaUser>> => {
  const usersCollectionRef = collection(db, 'users');

  if (Array.isArray(uids) && uids.length === 0) {
    return [];
  }

  const userQuery = query(usersCollectionRef, where('uid', 'in', uids));
  const userQuerySnapshot = await getDocs(userQuery);

  const users: (LupaUser & {id: string})[] = [];

  userQuerySnapshot.forEach(userDoc => {
    const userData = {id: userDoc.id, ...userDoc.data()};
    users.push(userData as LupaUser & {id: string});
  });

  return users;
};

export const getPacks = async (
  uids: string[],
): Promise<(Pack & {id: string})[]> => {
  const usersCollectionRef = collection(db, 'packs');

  if (Array.isArray(uids) && uids.length === 0) {
    return [];
  }

  const userQuery = query(usersCollectionRef, where('uid', 'in', uids));
  const userQuerySnapshot = await getDocs(userQuery);

  const packs: (Pack & {id: string})[] = [];

  userQuerySnapshot.forEach(userDoc => {
    const userData = {id: userDoc.id, ...userDoc.data()};
    packs.push(userData as Pack & {id: string});
  });

  return packs;
};

export const getTrainersNearUser = async (
  radius: number,
): Promise<LupaUser[]> => {
  try {
    const userLocation = await getLocation();

    if (userLocation) {
      const {latitude, longitude} = userLocation.coords;
      const trainersRef = collection(db, 'users');

      // Create a GeoPoint for the user's location
      const center = new GeoPoint(latitude, longitude);

      // Calculate the bounds for the query
      const radiusInM = radius * 1000; // Convert radius from km to m
      const bounds = getGeoBounds(center, radiusInM);

      // Query for trainers within the bounds
      const trainersQuery = query(
        trainersRef,
        where('role', '==', 'trainer'),
        where('location', '>=', bounds.sw),
        where('location', '<=', bounds.ne),
      );

      const snapshot = await getDocs(trainersQuery);
      const trainers: LupaUser[] = [];

      snapshot.forEach(doc => {
        const trainerData = doc.data();
        const trainer: LupaUser = {
          uid: trainerData.uid,
          name: trainerData.name,
          location: trainerData.location,
          is_onboarding_completed: true,
          username: trainerData.username,
          email: trainerData.email,
          number: trainerData.number,
          picture: trainerData.picture,
          role: Persona.Trainer,
          time_created_utc: trainerData.time_created_utc,
        };
        trainers.push(trainer);
      });

      return trainers;
    }

    return [];
  } catch (error) {
    console.log('Error getting nearby trainers:', error);
    return [];
  }
};

export const getTrainerCreatedPrograms = async (
  uid: string,
): Promise<Program[]> => {
  try {
    const programsRef = collection(db, 'programs');
    const q = query(programsRef, where('metadata.owner', '==', uid));
    const snapshot = await getDocs(q);

    const programs: Program[] = [];
    snapshot.forEach(doc => {
      const programData = doc.data() as Program;
      const program: Program = {
        ...programData,
        id: doc.id,
      };
      programs.push(program);
    });

    return programs;
  } catch (error) {
    console.log('Error getting user programs:', error);
    return [];
  }
};

export const getUserPrograms = async (uid: string): Promise<Program[]> => {
  try {
    const programsRef = collection(db, 'purchased_programs');
    const q = query(programsRef, where('lupa_user_uid', '==', uid));
    const snapshot = await getDocs(q);

    const programs: Array<Program> = snapshot.docs.map(
      doc => doc.data() as Program,
    );

    return programs;
  } catch (error) {
    console.log('Error getting user programs:', error);
    return [];
  }
};

export const getPurchasedPrograms = async (
  uid: string,
): Promise<ProgramDetailsWithTrainerName[]> => {
  try {
    const purchasedProgramsRef = collection(db, 'purchased_programs');
    const q = query(purchasedProgramsRef, where('lupa_user_uid', '==', uid));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    const purchasedPrograms = snapshot.docs[0].data().programs as Program[];

    const programsWithTrainers = await Promise.all(
      purchasedPrograms.map(async program => {
        const trainerUid = program.metadata.owner;
        const usersRef = collection(db, 'users');
        const trainerQuery = query(usersRef, where('uid', '==', trainerUid));
        const trainerSnapshot = await getDocs(trainerQuery);

        if (trainerSnapshot.empty) {
          return {program, trainer: ''};
        }

        const {name, uid, picture} = trainerSnapshot.docs[0].data() as LupaUser;
        return {program, trainer: {name, uid, picture}};
      }),
    );

    return programsWithTrainers;
  } catch (error) {
    console.log('Error getting purchased programs:', error);
    return [];
  }
};

export const isUserProgramPurchaser = async (
  uid: string,
  program_uid: string,
): Promise<boolean> => {
  try {
    const purchasedProgramsRef = collection(db, 'purchased_programs');
    const q = query(purchasedProgramsRef, where('lupa_user_uid', '==', uid));

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return false;
    }
    const userDoc = snapshot.docs[0].data();
    const userPrograms = userDoc.programs;
    const isProgramPurchased = userPrograms.some(
      (program: Program) => program.uid === program_uid,
    );
    return isProgramPurchased;
  } catch (error) {
    console.log('Error getting purchased programs:', error);
    return false;
  }
};

export const getProgram = async (
  uid: string,
): Promise<{
  program: Program;
  trainer: {uid: string; name: string; picture: string};
} | null> => {
  try {
    // Query program information
    const programsRef = collection(db, 'programs');
    const q = query(programsRef, where('uid', '==', uid));
    const snapshot = await getDocs(q);
    const programData = snapshot.docs[0].data() as Program;

    if (snapshot.size > 0) {
      // Store program information
      const program: Program = {
        ...(snapshot.docs[0].data() as Program),
        id: snapshot.docs[0].id,
      };

      // Fetch trainer information and store trainer name
      const trainerUid = program.metadata.owner;
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('uid', '==', trainerUid));
      const userDocsSnapshot = await getDocs(userQuery);

      const trainerData = userDocsSnapshot.docs[0].data() as LupaUser;

      return {
        program: programData,
        trainer: {
          name: trainerData?.name,
          picture: trainerData?.picture,
          uid: trainerData?.uid,
        },
      };
    }
    return null;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getProgramSuggestions = async (
  userInterests: string[],
): Promise<Program[]> => {
  try {
    const programsRef = collection(db, 'programs');
    const q = query(
      programsRef,
      where('categories', 'array-contains-any', userInterests),
    );
    const snapshot = await getDocs(q);

    const programs: Program[] = [];
    snapshot.forEach(doc => {
      const programData = doc.data() as Program;
      const program: Program = {
        ...programData,
        id: doc.id,
      };
      programs.push(program);
    });

    return programs;
  } catch (error) {
    console.log('Error getting program suggestions:', error);
    return [];
  }
};

export const getTrainerAvailabilityOnDate = async (
  trainerUid: string,
  selectedDate: string,
) => {
  const availabilityRef = collection(db, 'trainer_availability');
  const q = query(
    availabilityRef,
    where('trainer_uid', '==', trainerUid),
    where('date', '==', selectedDate),
  );
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
  return data;
};

export const getTrainerAvailability = async (
  trainerUid: string,
  includeBookedSessions: boolean,
) => {
  const availabilityRef = collection(db, 'trainer_availability');
  const q = query(
    availabilityRef,
    where('trainer_uid', '==', trainerUid),
    //   where('isBooked', '==', includeBookedSessions),
  );
  const snapshot = await getDocs(q);
  const availableSlots = snapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
  }));
  return availableSlots;
};

export const updateTrainerAvailability = async (
  trainerUid: string,
  newSlots: any[],
) => {
  const availabilityRef = collection(db, 'trainer_availability');
  const batch = writeBatch(db);

  newSlots.forEach(slot => {
    const docRef = doc(availabilityRef);
    batch.set(docRef, {
      ...slot,
      trainer_uid: trainerUid,
    });
  });

  await batch.commit();
};

type UpdateUserLocationPayload = {
  uid: string;
  position: {longitude: number; latitude: number};
};

export default async function updateUserLocation(
  payload: UpdateUserLocationPayload,
) {
  const {
    uid,
    position: {longitude, latitude},
  } = payload;

  // Query the users collection to find the document with the matching uid
  const usersQuery = query(collection(db, 'users'), where('uid', '==', uid));
  const querySnapshot = await getDocs(usersQuery);

  if (!querySnapshot.empty) {
    const userDoc = querySnapshot.docs[0];
    const userDocRef = doc(db, 'users', userDoc.id);

    await updateDoc(userDocRef, {
      location: {
        longitude,
        latitude,
        timezone: 'America/New_York',
      },
    });
  } else {
    throw new Error(`User with uid ${uid} not found`);
  }
}

async function getUserAvatar(userId: string): Promise<string | null> {
  const usersCollectionRef = collection(db, 'users');
  const userQuery = query(usersCollectionRef, where('uid', '==', userId));

  try {
    const querySnapshot = await getDocs(userQuery);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const picture = userData.picture;

      if (picture) {
        return picture as string;
      } else {
        console.log('User document does not contain a picture field');
        return null;
      }
    } else {
      console.log('User document does not exist');
      return null;
    }
  } catch (error) {
    console.error('Error fetching user avatar:', error);
    return null;
  }
}

export const fetchTrainerMetadata = async (
  userUid: string,
): Promise<TrainerMetadata | null> => {
  const trainerMetadataRef = collection(db, 'trainer_metadata');
  const q = query(trainerMetadataRef, where('user_uid', '==', userUid));

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const trainerData = {
    ...snapshot.docs[0].data(),
    id: snapshot.docs[0].id,
  } as unknown as TrainerMetadata;

  return trainerData;
};

export const fetchTrainerAvailabilitySlot = async (
  uid: string,
): Promise<TrainerAvailability | null> => {
  const trainerAvailabilityRef = collection(db, 'trainer_availability');
  const q = query(trainerAvailabilityRef, where('uid', '==', uid));

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const availabilityData = snapshot.docs[0].data() as TrainerAvailability;
  return availabilityData;
};

async function putCompletedProgramPurchase(
  lupaUserUid: string,
  newProgram: Program,
) {
  const purchasedProgramsCollectionRef = collection(db, 'purchased_programs');
  const userDocQuery = query(
    purchasedProgramsCollectionRef,
    where('lupa_user_uid', '==', lupaUserUid),
  );

  const userDocSnapshot = await getDocs(userDocQuery);

  if (userDocSnapshot.size > 0) {
    const userDocRef = userDocSnapshot.docs[0].ref;
    const userDocData = userDocSnapshot.docs[0].data();

    const updatedPrograms = [...userDocData.programs, newProgram];

    await updateDoc(userDocRef, {programs: updatedPrograms});
  } else {
    // Create a new document if the user doesn't have any purchased programs
    await addDoc(purchasedProgramsCollectionRef, {
      lupa_user_uid: lupaUserUid,
      programs: [newProgram],
    });
  }

  const userNotificationRef = doc(collection(db, 'notifications'));
  await setDoc(userNotificationRef, {
    id: userNotificationRef.id,
    receiver: newProgram.metadata.owner,
    type: 'NEW_PROGRAM_PURCHASE',
    title: 'New Program Purchase',
    message: `Your program ${newProgram.metadata.name} has been purchased.`,
    createdAt: serverTimestamp(),
    isRead: false,
  });
}

export const createPack = async (pack: Pack) => {
  try {
    const packRef = doc(collection(db, 'packs'));
    await setDoc(packRef, {
      ...pack,
      uid: packRef.id,
      id: packRef.id,
      created_at: serverTimestamp(),
      is_live: false, // Packs do not go live until all user's have accepted the invitation
    });

    const newPack = await getDoc(packRef).then(doc => doc.data());

    // sendPackMessage(auth?.currentUser?.uid as string, packRef?.id, pack.greeting_message, MessageType.NORMAL, {})
    return newPack;
  } catch (error) {
    throw error;
  }
};


// Purchase a session package for a pack
// Packs will occupy one session at a time
export const purchasePackageForPack = async (
  packUid: string,
  packageUid: string,
) => {
  try {
    const packRef = doc(db, 'packs', packUid);
    await updateDoc(packRef, {
      package_uid: packageUid,
    });
  } catch (error) {
    throw error;
  }
};


export const acceptPackInvitation = async ({packId}: {packId: string}) => {
  const packRef = doc(db, 'packs', packId);
  const currentUser = auth?.currentUser?.uid;

  // Fetch the pack document
  const packSnapshot = await getDoc(packRef);
  const packData = packSnapshot.data();

  if (!packData) {
    throw new Error('Pack not found');
  }

  // Start a transaction to ensure data consistency
  await runTransaction(db, async transaction => {
    const updatedPackSnapshot = await transaction.get(packRef);
    const updatedPackData = updatedPackSnapshot.data();

    if (!updatedPackData) {
      throw new Error('Pack not found in transaction');
    }

    const updatedPendingInvites = updatedPackData.pendingInvites.filter(
      (uid: string) => uid !== currentUser,
    );
    const updatedMembers = [...updatedPackData.members, currentUser];

    transaction.update(packRef, {
      pendingInvites: updatedPendingInvites,
      members: updatedMembers,
    });

    // Check if this is the last member to join
    if (
      updatedPackData?.is_live === false &&
      updatedPendingInvites.length === 0
    ) {
      transaction.update(packRef, {is_live: true});

      // Create notifications for all pack members
      updatedMembers.forEach((memberUid: string) => {
        const notificationRef = doc(collection(db, 'notifications'));
        transaction.set(notificationRef, {
          id: notificationRef.id,
          receiver: memberUid,
          type: 'PACK_LIVE',
          message: `Your pack ${updatedPackData.name} is now live!`,
          createdAt: serverTimestamp(),
          isRead: false,
        });
      });
    } else {
      // Pack is already live
      // Create notifications for existing pack members about the new member
      updatedPackData.members.forEach((memberUid: string) => {
        if (memberUid !== currentUser) {
          const notificationRef = doc(collection(db, 'notifications'));
          transaction.set(notificationRef, {
            id: notificationRef.id,
            receiver: memberUid,
            type: 'PACK_MEMBER_JOINED',
            message: `A new member has joined your pack ${updatedPackData.name}`,
            createdAt: serverTimestamp(),
            isRead: false,
          });
        }
      });
    }
  });

  queryClient.invalidateQueries({
    queryKey: ['use_pack', packId],
  });
};

export const declinePackInvitation = async ({packId}: {packId: string}) => {
  const packRef = doc(db, 'packs', packId);
  const currentUser = auth?.currentUser?.uid;

  await updateDoc(packRef, {
    pendingInvites: arrayRemove(currentUser),
  });
};

export const getUserPacks = async () => {
  const currentUser = auth?.currentUser?.uid as string;
  const packsRef = collection(db, 'packs');
  const q = query(packsRef, where('members', 'array-contains', currentUser));

  const querySnapshot = await getDocs(q);
  const packs = querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));

  return packs;
};

export const getPack = async (packUid: string): Promise<Pack | null> => {
  const packsData = await (await getDoc(doc(db, 'packs', packUid))).data();

  if (!packsData) {
    return null;
  }

  return packsData as Pack;
};

export const getUserNotifications = async () => {
  const currentUser = auth?.currentUser?.uid;
  const notificationsRef = collection(db, 'notifications');
  const now = new Date();

  const q = query(
    notificationsRef,
    where('receiver', '==', currentUser),
    where('scheduledFor', '<=', Timestamp.fromDate(now))
  );

  const querySnapshot = await getDocs(q);
  const notifications = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  return notifications;
};


export const createPackage = async (packageData: Partial<SessionPackage>) => {
  const packagesCollection = collection(db, 'packages');
  const newPackageRef = await addDoc(packagesCollection, {
    ...packageData,
    created_at: serverTimestamp(),
    status: 'incomplete',
    scheduled_meeting_uids: [],
  });

  await updateDoc(doc(db, 'packages', newPackageRef.id), {
    uid: newPackageRef.id,
  });

  const docSnapshot = await getDoc(doc(db, 'packages', newPackageRef.id));

  return { uid: newPackageRef.id, ...docSnapshot.data() } as unknown as SessionPackage;
};

export const getTrainerPackages = async (trainerUid: UID) => {
  const packagesCollection = collection(db, 'packages');
  const q = query(packagesCollection, where('trainer_uid', '==', trainerUid));
  const querySnapshot = await getDocs(q);
  const packages = querySnapshot.docs.map(doc => ({
    uid: doc.id,
    ...doc.data(),
  }));
  return packages as unknown as SessionPackage[];
};

export const getSessionPackage = async (packageUid: string) => {
  const packageRef = doc(db, 'packages', packageUid);
  const packageSnapshot = await getDoc(packageRef);
  if (packageSnapshot.exists()) {
    return {
      uid: packageSnapshot.id,
      ...packageSnapshot.data(),
    } as unknown as SessionPackage;
  } else {
    throw new Error('Package not found');
  }
};

export const getUserScheduledEvents = async (
  userUid: string,
): Promise<UserScheduledEvent[]> => {
  const scheduledEventsRef = collection(db, 'user_scheduled_events');
  const q = query(scheduledEventsRef, where('user_uid', '==', userUid));
  const querySnapshot = await getDocs(q);

  const scheduledEvents: UserScheduledEvent[] = [];
  querySnapshot.forEach(doc => {
    scheduledEvents.push(doc.data() as UserScheduledEvent);
  });

  return scheduledEvents;
};

export const getPackScheduledEvents = async (
  packId: string,
): Promise<PackScheduledEvent[]> => {
  const scheduledEventsRef = collection(db, 'pack_scheduled_events');
  const q = query(scheduledEventsRef, where('pack_uid', '==', packId));
  const querySnapshot = await getDocs(q);

  const scheduledEvents: PackScheduledEvent[] = [];
  querySnapshot.forEach(doc => {
    scheduledEvents.push(doc.data() as PackScheduledEvent);
  });

  return scheduledEvents;
};

export const getTrainerClients = async (trainerId: string): Promise<any[]> => {
  try {
    const trainerMetadataRef = collection(db, 'trainer_metadata');
    const q = query(trainerMetadataRef, where('user_uid', '==', trainerId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const trainerMetadata = querySnapshot.docs[0].data();
      const trainerClients = trainerMetadata.clients;

      const clients = [];

      for (const client of trainerClients) {
        // Check if the clientId exists in the users collection
        if (typeof client != 'object') {
          continue;
        }

        if (!client?.type === 'user') {
          const usersRef = collection(db, 'users');
          const userQuery = query(
            usersRef,
            where('uid', '==', client?.data?.uid),
          );
          const userQuerySnapshot = await getDocs(userQuery);
          const userDoc = userQuerySnapshot.docs[0];
          clients.push({
            id: userDoc.id,
            ...userDoc.data(),
            type: 'user',
          });
        } else {
          // Check if the clientId exists in the packs collection
          const packsRef = collection(db, 'packs');
          const packQuery = query(
            packsRef,
            where('uid', '==', client?.data?.uid),
          );
          const packQuerySnapshot = await getDocs(packQuery);

          if (!packQuerySnapshot.empty) {
            const packDoc = packQuerySnapshot.docs[0];
            clients.push({
              id: packDoc.id,
              ...packDoc.data(),
              type: 'pack',
            });
          }
        }
      }

      return clients;
    }
  } catch (error) {
    console.error('Error fetching trainer clients:', error);
    throw error;
  }

  return [];
};

export const getClientPurchasedPackages = async (clientId: string) => {
  const purchasedPackagesRef = collection(db, 'purchased_packages');
  const q = query(purchasedPackagesRef, where('client', '==', clientId));
  const querySnapshot = await getDocs(q);

  const purchasedPackages = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  return purchasedPackages;
};

export const getScheduledMeetingById = async (scheduledMeetingUid: string) => {
  try {
    const purchasedPackagesRef = collection(db, 'scheduled_sessions');
    const q = query(
      purchasedPackagesRef,
      where('uid', '==', scheduledMeetingUid),
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    return querySnapshot.docs[0].data();

    // const scheduledMeetingDoc = await
    //   getDoc(doc(collection(db, 'scheduled_sessions'), scheduledMeetingUid))

    // if (scheduledMeetingDoc.exists()) {
    //   return scheduledMeetingDoc.data() as ScheduledMeeting;
    // } else {
    //   console.log('Scheduled meeting not found');
    //   return null;
    // }
  } catch (error) {
    console.error('Error fetching scheduled meeting:', error);
    return null;
  }
};

export const getAllUsers = async () => {
  const userSnapshot = await getDocs(collection(db, 'users'));
  return userSnapshot.docs.map(doc => doc.data());
};

export const getAllPacks = async () => {
  const packSnapshot = await getDocs(collection(db, 'packs'));
  return packSnapshot.docs.map(doc => doc.data());
};

export const getAllUsersAndPacks = async () => {
  const [userDocs, packDocs] = await Promise.all([
    getAllUsers(),
    getAllPacks(),
  ]);
  return [
    ...userDocs.map(user => ({data: user, type: 'user' as const})),
    ...packDocs.map(pack => ({data: pack, type: 'pack' as const})),
  ];
};

export {
  putCompletedProgramPurchase,
  getUserAvatar,
  getUser,
  listUsers,
  putUser,
  createUser,
  saveProgram,
  checkOnboardingStatus,
};
