import { collection, writeBatch, doc } from "firebase/firestore";
import { db } from "../services/firebase";
import { FirebaseError } from "firebase/app";

export const updateTrainerAvailability = async (
    trainerUid: string,
    newSlots: any[],
  ) => {
    const availabilityRef = collection(db, 'trainer_availability');
    const batch = writeBatch(db);
  
    try {
      newSlots.forEach(slot => {
        const docRef = doc(availabilityRef);
        batch.set(docRef, {
          ...slot,
          trainer_uid: trainerUid,
        });
      });
  
      await batch.commit();
    } catch (error) {
      console.error('Error updating trainer availability:', error);
      if (error instanceof FirebaseError) {
        throw new Error(`Firebase error: ${error.code} - ${error.message}`);
      } else {
        throw new Error('Failed to update trainer availability');
      }
    }
  };