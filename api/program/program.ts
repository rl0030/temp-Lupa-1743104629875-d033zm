import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  FieldValue,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {UID} from '../../types/common';
import {Exercise, ExerciseCategory, Program} from '../../types/program';
import {auth, db} from '../../services/firebase';
import {LupaUser} from '../../types/user';
import {ProgramWithTrainerDetails} from './types';
import { FirebaseDatabaseTypes } from '../../types/firebase';
import queryClient from '../../react-query';

/**
 * Returns a program entry from the underlying database
 * @param uid 
 * @param includeTrainerDetails 
 * @returns 
 */
export const getProgram = async (
  uid: UID,
  includeTrainerDetails: boolean = false,
): Promise<Program | ProgramWithTrainerDetails> => {
  try {

    // Query program information
    const programsRef = collection(db, 'programs');
    const q = query(programsRef, where('uid', '==', uid), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.size > 0) {
      // Store program information
      const program: Program = {
        ...(snapshot.docs[0].data() as Program),
        id: snapshot.docs[0].id,
      };

      if (includeTrainerDetails) {
        // Fetch trainer information and store trainer name
        const trainerUid = program.metadata.owner;
        const usersRef = collection(db, 'users');
        const userQuery = query(usersRef, where('uid', '==', trainerUid));
        const userDocsSnapshot = await getDocs(userQuery);

        const trainerData = userDocsSnapshot.docs[0].data() as LupaUser;

        return {
          program,
          trainer: {
            name: trainerData?.name,
            picture: trainerData?.picture,
            uid: trainerData?.uid,
          },
        };
      }

      return program
    }

    throw new Error(`Unable to find program with uid: ${uid}`);
  } catch (error) {

    throw error;
  }
};

// Save or updated a program based on if the program input already exist
// in the database
export const saveOrUpdateProgram = async (program: Program): Promise<boolean> => {
  try {
    const programsCollection = collection(db, 'programs');
    let docRef = doc(programsCollection, program.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Update existing document
      await updateDoc(docRef, {
        ...program,
        metadata: {
          ...program?.metadata,
        },
      });
      console.debug('Existing program updated in Firestore successfully!');
    } else {
      // Create a new document
      const newDocRef = await addDoc(programsCollection, {
        ...program,
        metadata: {
          ...program.metadata,
          is_published: false,
        },
      });
      // Update the document with its new ID
      await updateDoc(newDocRef, { uid: newDocRef.id });
      console.debug('New program created in Firestore successfully!');
    }

    return true;
  } catch (error) {
    console.error('Error saving program to Firestore:', error);
    return false;
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

// Get Exercise Library
const getExerciseLibrary = async (userId: string, categories = [] as Array<string>) => {
  const docRef = doc(db, FirebaseDatabaseTypes.LupaCollections.EXERCISE_LIBRARY, userId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    // Create the document if it doesn't exist
    await setDoc(docRef, { exercises: {} });
    return {};
  }

  const data = docSnap.data().exercises;
  
  if (categories && Array.isArray(categories) && Array.isArray(categories).length > 0) {

    // @ts-ignore
    return Object.fromEntries(
      Object.entries(data).filter(([category]) => categories.includes(category))
    );
  }

  return data;
};

// Add Exercise to Exercise Library
const addExerciseToExerciseLibrary = async (userId: UID, category: string, name: string, description: string, media: string, unique_uid: string) => {
  const docRef = doc(db,  FirebaseDatabaseTypes.LupaCollections.EXERCISE_LIBRARY, userId);
  
  const exercise: Pick<Exercise, 'name' | 'description' | 'media_uri_as_base64' | 'category' | 'unique_uid'> = {
    name,
    description,
    media_uri_as_base64: media,
    category,
    unique_uid
  }

  try {
    await setDoc(docRef, {
      exercises: {
        [category]: arrayUnion(exercise)
      }
    }, { merge: true });

    queryClient.invalidateQueries([auth?.currentUser?.uid as string, 'use_fetch_exercise_library'])

  } catch (error) {
    console.error("Error adding exercise to library: ", error);
    throw error;
  }
};

export { getExerciseLibrary, addExerciseToExerciseLibrary };